'use client';

import { useCallback, useMemo, useState, type ReactNode } from 'react';
import { clsx } from 'clsx';
import { Button, FigureZoom, Input } from '@/components/ui';
import type { Pool, PoolKind, PoolVariant } from '@/lib/zadanie3/pool';
import { ROUND_SIZE, buildRound, seeded, type RoundItem } from '@/lib/zadanie3/podhod';
import { recordTask, taskKey, useZ3Progress } from '@/lib/zadanie3/progress';
import { answerMatches, klyuchZadachi, openText } from '@/lib/zadanie3/secret';
import {
  isSolid3Payload,
  makeSolid3Payload,
  spareFor,
  type Solid3Payload,
} from '@/lib/zadanie3/session';
import type { TaskMark } from '@/lib/trainerSession/types';
import { TrainerSessionHost, useSessionReport, type ConfiguratorApi } from '../session';
import { Solid3Stats } from './Solid3Stats';
import { readSolid3Ui, type Solid3Ui } from './solid3Ui';
import { TitleText } from '@/components/tasks/TitleText';

export interface Solid3TrainerProps {
  pool: Pool;
  /** Раздел для сохранения тренировки: «3:konus» или «3» у общего тренажёра. */
  scope: string;
  /** Куда ведёт ссылка с итогового экрана. */
  backHref: string;
}

/** Смешанный режим: не тип, а все типы сразу. */
const MIX = 'mix';

/** Приставка режима «только этот раздел» в общем тренажёре. */
const GROUP = 'razdel:';

/** Зерно подхода: берётся по нажатию «Начать», а не при отрисовке. */
function freshSeed(): number {
  return (Date.now() ^ Math.floor(Math.random() * 0xffffffff)) >>> 0;
}

/**
 * Тренажёр задания №3: выбор режима, сама тренировка и итоги.
 *
 * Все задания приходят готовыми пропсами: условия набраны KaTeX,
 * чертежи нарисованы движком — на сборке. Ответы уехали вниз только
 * отпечатками, разборы закрытыми, и раскрываются по просьбе ученика.
 *
 * Оболочка сессии хранит тренировку: подход (ссылки на задания
 * банка), ответ ученика, отметки и номер задания. Режим выбирается
 * при старте и дальше не меняется. Подход собирается в обработчике
 * кнопки «Начать тренировку», а не при отрисовке, поэтому разметка
 * сервера и первая отрисовка в браузере совпадают.
 */
export function Solid3Trainer({ pool, scope, backHref }: Solid3TrainerProps) {
  const byId = useMemo(() => new Map(pool.kinds.map((kind) => [kind.id, kind])), [pool]);
  const isPayload = useCallback(
    (value: unknown): value is Solid3Payload => isSolid3Payload(value, byId),
    [byId],
  );

  return (
    <TrainerSessionHost<Solid3Payload, Solid3Ui>
      scope={scope}
      what="тренажёр"
      backHref={backHref}
      isPayload={isPayload}
      /* Индексы раскладки бывают и в запасных вариантах пула, поэтому
         оболочке отдаётся весь пул; число заданий подхода она берёт из
         раскладки, которую экран сообщает сразу после показа. */
      count={(payload) => payload.pool.length}
      describe={(payload, at) => {
        const item = payload.pool[at];
        const kind = item === undefined ? undefined : byId.get(item.kind);
        const variant = kind?.variants.find((entry) => entry.n === item?.n);
        if (kind === undefined || variant === undefined) {
          throw new Error('Нет задания');
        }
        return {
          kind: kind.titlePlain,
          html: variant.uslovieHtml,
          /* Разбор раскрывается только на итогах: до этого он закрыт. */
          review: () => <Solid3Review variant={variant} />,
        };
      }}
      subset={(payload, indexes) =>
        makeSolid3Payload(
          indexes.flatMap((at) => payload.pool[at] ?? []),
          byId,
        )
      }
      configurator={(api) => <Solid3Setup pool={pool} byId={byId} api={api} />}
      screen={({ payload, restored, report, elapsed, finish }) => (
        <Solid3Screen
          pool={pool}
          byId={byId}
          payload={payload}
          restored={restored === null ? null : readSolid3Ui(restored)}
          report={report}
          elapsed={elapsed}
          onFinish={finish}
        />
      )}
    />
  );
}

/** Разбор на итоговом экране: те же шаги, что открывает кнопка решения. */
function Solid3Review({ variant }: { variant: PoolVariant }) {
  const steps = useMemo(() => openText(variant.steps, variant.seal).split('\n'), [variant]);
  return (
    <ol className="z3t__steps">
      {steps.map((step, i) => (
        /* Шаг набран KaTeX на сборке (lib/zadanie3/pool.ts). */
        <li key={i} dangerouslySetInnerHTML={{ __html: step }} />
      ))}
    </ol>
  );
}

interface Solid3SetupProps {
  pool: Pool;
  byId: ReadonlyMap<string, PoolKind>;
  api: ConfiguratorApi<Solid3Payload>;
}

/** Выбор тренировки: режим и «Начать тренировку», ниже — статистика. */
function Solid3Setup({ pool, byId, api }: Solid3SetupProps) {
  const progress = useZ3Progress();
  const [mode, setMode] = useState<string>(MIX);
  /* Повторение ошибок — отдельный режим: подход собирается только из
     заданий, в которых ошиблись. */
  const [repeat, setRepeat] = useState(false);

  /* Из чего собирать подход: один тип, все типы или список ошибок.
     Список ошибок берётся строкой, чтобы зависимость не менялась от
     каждой перерисовки хранилища. */
  const mistakesKey = progress.mistakes.join(',');
  const source = useMemo(() => {
    if (repeat) {
      const wanted = new Map<string, number[]>();
      mistakesKey
        .split(',')
        .filter((item) => item !== '')
        .forEach((item) => {
          const [id, no] = item.split(':');
          if (id === undefined || no === undefined || !byId.has(id)) {
            return;
          }
          wanted.set(id, [...(wanted.get(id) ?? []), Number(no)]);
        });
      return [...wanted.entries()].map(([id, list]) => ({
        id,
        variants: list.map((n) => ({ n })),
      }));
    }
    if (mode === MIX) {
      return pool.kinds.map((kind) => ({
        id: kind.id,
        variants: kind.variants.map((item) => ({ n: item.n })),
      }));
    }
    /* Общий тренажёр фильтрует по разделам: кнопок на 91 прототип
       было бы полтора экрана, и выбирать в них нечего. */
    if (mode.startsWith(GROUP)) {
      const nomer = mode.slice(GROUP.length);
      return pool.kinds
        .filter((kind) => kind.group === nomer)
        .map((kind) => ({ id: kind.id, variants: kind.variants.map((item) => ({ n: item.n })) }));
    }
    const only = byId.get(mode);
    return only === undefined
      ? []
      : [{ id: only.id, variants: only.variants.map((item) => ({ n: item.n })) }];
  }, [repeat, mode, pool, byId, mistakesKey]);

  /* Чем фильтровать: разделами в общем тренажёре, типами заданий
     в тренажёре раздела. */
  const filters = useMemo(() => {
    if (pool.razdel !== 'all') {
      return pool.kinds.map((kind) => ({ id: kind.id, title: kind.title, titleHtml: kind.titleHtml }));
    }
    const seen = new Map<string, string>();
    pool.kinds.forEach((kind) => seen.set(kind.group, kind.groupTitle));
    return [...seen.entries()].map(([nomer, title]) => ({
      id: `${GROUP}${nomer}`,
      title,
      titleHtml: undefined as string | undefined,
    }));
  }, [pool]);

  const size = repeat
    ? Math.min(
        source.reduce((sum, kind) => sum + kind.variants.length, 0),
        ROUND_SIZE,
      )
    : ROUND_SIZE;

  function choose(next: string) {
    setMode(next);
    setRepeat(false);
  }

  function start() {
    const items = buildRound(source, seeded(freshSeed()), size);
    if (items.length === 0) {
      return;
    }
    /* Оболочка сессии сохранит подход и вернёт ученика в него при
       любом заходе, пока тренировка не завершена. */
    api.start(makeSolid3Payload(items, byId));
  }

  const mistakes = progress.mistakes.filter((item) => byId.has(item.split(':')[0] ?? ''));

  return (
    <section className="z3t">
      {/* Фильтр по типам заданий раздела и смешанный режим. */}
      <nav className="z3t__filter" aria-label="Типы заданий">
        <button
          type="button"
          className={clsx('chip', !repeat && mode === MIX && 'is-active')}
          onClick={() => choose(MIX)}
        >
          Смешанный режим
        </button>
        {filters.map((item) => (
          <button
            key={item.id}
            type="button"
            className={clsx('chip', !repeat && mode === item.id && 'is-active')}
            onClick={() => choose(item.id)}
          >
            <TitleText title={item.title} html={item.titleHtml} />
          </button>
        ))}
        {mistakes.length === 0 ? null : (
          <button
            type="button"
            className={clsx('chip', repeat && 'is-active')}
            onClick={() => setRepeat(true)}
          >
            Повторение ошибок ({mistakes.length})
          </button>
        )}
      </nav>

      <div className="z3t__actions">
        <Button onClick={start} disabled={source.length === 0}>
          Начать тренировку
        </Button>
      </div>

      <Solid3Stats
        pool={pool}
        progress={progress}
        onRepeat={mistakes.length === 0 ? null : () => setRepeat(true)}
        onGoKind={choose}
      />
    </section>
  );
}

interface Solid3ScreenProps {
  pool: Pool;
  byId: ReadonlyMap<string, PoolKind>;
  payload: Solid3Payload;
  /** Состояние экрана из сохранённой тренировки. null — тренировка новая. */
  restored: Solid3Ui | null;
  /** Сообщить оболочке сессии о новом состоянии (она его сохранит). */
  report: (ui: Solid3Ui) => void;
  /** Активное время тренировки, мс: пауза и скрытая вкладка не идут. */
  elapsed: () => number;
  /** Последнее задание пройдено: показать итоги. */
  onFinish: () => void;
}

/** Экран заданий: подход идёт по раскладке, замена варианта меняет в ней индекс. */
function Solid3Screen({
  pool,
  byId,
  payload,
  restored,
  report,
  elapsed,
  onFinish,
}: Solid3ScreenProps): ReactNode {
  const progress = useZ3Progress();

  /* Раскладка: индексы пула в порядке показа. Из сохранённой
     тренировки берётся та, что была (с заменёнными вариантами). */
  const [order, setOrder] = useState<number[]>(() =>
    restored !== null && restored.order !== null && restored.order.length === payload.size
      ? restored.order
      : Array.from({ length: payload.size }, (_, i) => i),
  );

  /* Всё, что ученик успел сделать, приходит из сохранённой
     тренировки: вернувшись, он продолжает с того же места. */
  const [index, setIndex] = useState(restored?.index ?? 0);
  const [value, setValue] = useState(restored?.value ?? '');
  const [checked, setChecked] = useState<'right' | 'wrong' | null>(restored?.checked ?? null);
  const [solution, setSolution] = useState(restored?.solution ?? false);
  /* Ошибался ли ученик в этом задании: в точность идёт только
     решённое с первой попытки. */
  const [missed, setMissed] = useState(restored?.missed ?? false);
  /* Когда взялись за задание, мс активного времени. null — ещё не
     начинали. Время тренировки ведёт оболочка сессии. */
  const [taskFrom, setTaskFrom] = useState<number | null>(restored?.taskFrom ?? null);
  /* Чем закончилось каждое задание и где была ошибка: на итогах
     решённое с ошибкой или с разбором отличается от пропущенного. */
  const [marks, setMarks] = useState<Record<number, TaskMark>>(restored?.marks ?? {});
  const [tried, setTried] = useState<Record<number, true>>(restored?.tried ?? {});

  useSessionReport<Solid3Ui>(report, {
    index,
    marks,
    tried,
    order,
    value,
    checked,
    solution,
    missed,
    taskFrom,
  });

  const total = order.length;
  const item: RoundItem | undefined = payload.pool[order[index] ?? -1];
  const kind: PoolKind | undefined = item === undefined ? undefined : byId.get(item.kind);
  const variant: PoolVariant | undefined =
    kind === undefined || item === undefined
      ? undefined
      : kind.variants.find((entry) => entry.n === item.n);

  const steps = useMemo(() => {
    if (variant === undefined || !solution) {
      return [];
    }
    /* Разбор раскрывается только по просьбе ученика: до этого он
       лежит закрытым и в разметку не попадает. */
    return openText(variant.steps, variant.seal).split('\n');
  }, [variant, solution]);

  if (item === undefined || kind === undefined || variant === undefined) {
    return <p className="z3t__wait">Собираем подход…</p>;
  }

  function reset() {
    setValue('');
    setChecked(null);
    setSolution(false);
    setMissed(false);
    setTaskFrom(elapsed());
  }

  function go(next: number) {
    setIndex(next);
    reset();
  }

  function check() {
    if (item === undefined || variant === undefined || value.trim() === '') {
      return;
    }
    const right = answerMatches(value, variant.seal, klyuchZadachi(item.kind, item.n));
    setChecked(right ? 'right' : 'wrong');
    if (right) {
      const seconds = taskFrom === null ? 0 : (elapsed() - taskFrom) / 1000;
      recordTask(item.kind, item.n, !missed, seconds);
      /* Без ошибки и разбора — «решено», иначе «с подсказкой». Уже
         поставленная отметка не понижается повторной проверкой. */
      if (marks[index] === undefined) {
        setMarks({ ...marks, [index]: missed || solution ? 'hinted' : 'right' });
      }
    } else {
      setMissed(true);
      setTried({ ...tried, [index]: true });
    }
  }

  function anotherVariant() {
    const spare = spareFor(payload, order, index, seeded(freshSeed()));
    if (spare === null) {
      return;
    }
    /* Заменяется индекс в раскладке: она сохраняется в сессии, и после
       возвращения на этом месте то же новое задание. Отметки старого
       задания к новому не относятся. */
    setOrder(order.map((at, i) => (i === index ? spare : at)));
    const { [index]: _mark, ...restMarks } = marks;
    const { [index]: _tried, ...restTried } = tried;
    setMarks(restMarks);
    setTried(restTried);
    reset();
  }

  const last = index >= total - 1;

  return (
    <section className="z3t">
      <p className="z3t__count">
        <span className="z3t__kind">
          <TitleText title={kind.title} html={kind.titleHtml} />
        </span>
      </p>

      {/* Полоса подхода: пройденное залито, текущее подсвечено. */}
      <ol className="z3t__bar" aria-hidden="true">
        {order.map((at, i) => {
          const entry = payload.pool[at];
          return (
            <li
              key={`${at}-${i}`}
              className={clsx(
                'z3t__seg',
                i < index && 'is-done',
                entry !== undefined &&
                  progress.mistakes.includes(taskKey(entry.kind, entry.n)) &&
                  'is-wrong',
                i === index && 'is-current',
              )}
            />
          );
        })}
      </ol>

      <article className="z3t__card">
        <div className="z3t__question" dangerouslySetInnerHTML={{ __html: variant.uslovieHtml }} />
        <FigureZoom className="z3t__fig" label={`Чертёж к заданию: ${kind.titlePlain}`}>
          <span dangerouslySetInnerHTML={{ __html: variant.svg ?? kind.svg }} />
        </FigureZoom>
      </article>

      <div className="z3t__answer">
        <label className="z3t__label" htmlFor="z3t-input">
          Ваш ответ:
        </label>
        <Input
          id="z3t-input"
          className="z3t__input"
          value={value}
          state={checked === null ? 'default' : checked === 'right' ? 'success' : 'error'}
          inputMode="decimal"
          autoComplete="off"
          readOnly={checked === 'right'}
          onChange={(event) => setValue(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === 'Enter') {
              check();
            }
          }}
        />
        {kind.format === 'на-пи' ? (
          <p className="z3t__hint" dangerouslySetInnerHTML={{ __html: pool.piHintHtml }} />
        ) : null}

        {checked === null ? null : (
          <div className={clsx('z3t__verdict', `z3t__verdict--${checked}`)} role="status">
            <p className="z3t__verdict-title">{checked === 'right' ? 'Верно!' : 'Неверно'}</p>
            <p className="z3t__verdict-lead">
              {checked === 'right'
                ? 'Разбор ниже — посмотрите, если решали иначе.'
                : 'Попробуйте ещё раз или посмотрите разбор решения.'}
            </p>
          </div>
        )}

        <div className="z3t__actions">
          {checked === 'right' ? null : (
            <Button onClick={check} disabled={value.trim() === ''}>
              Проверить
            </Button>
          )}
          <Button variant="ghost" onClick={() => setSolution(true)} disabled={solution}>
            {checked === 'right' ? 'Показать решение' : 'Посмотреть решение'}
          </Button>
          <Button variant="ghost" onClick={anotherVariant}>
            Ещё один вариант
          </Button>
        </div>

        {solution ? (
          <ol className="z3t__steps">
            {steps.map((step, i) => (
              /* Шаг набран KaTeX на сборке (lib/zadanie3/pool.ts). */
              <li key={i} dangerouslySetInnerHTML={{ __html: step }} />
            ))}
          </ol>
        ) : null}
      </div>

      <div className="z3t__nav">
        <Button variant="ghost" onClick={() => go(index - 1)} disabled={index === 0}>
          ← Предыдущее
        </Button>
        <Button variant="ghost" onClick={last ? onFinish : () => go(index + 1)}>
          {last ? 'Смотреть результат →' : 'Следующее →'}
        </Button>
      </div>
    </section>
  );
}
