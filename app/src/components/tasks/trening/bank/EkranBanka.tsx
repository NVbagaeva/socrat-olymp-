'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { BookmarkButton } from '@/components/zakladki/BookmarkButton';
import { useBeforeFinish } from '../../session/useBeforeFinish';
import { useSessionReport } from '../../session/useSessionReport';
import { EkranZadachi, type SostoyanieZadachi } from '../EkranZadachi';
import { PodskazkaVoprosy } from '../PodskazkaVoprosy';
import { formatHint, fractionRightHint } from '@/lib/otvet';
import type { LogOutcome } from '@/lib/progressLog';
import { pickRound, useRound } from '@/lib/trainerRound';
import type { TaskMark } from '@/lib/trainerSession/types';
import {
  ZAMENY,
  analogOf,
  type KatalogBanka,
  type PayloadBanka,
  type TaskBanka,
} from '@/lib/trening/bank';
import type { RazdelBanka, ZadachaBanka } from './types';
import type { UiBanka } from './ui';

export interface EkranBankaProps<Z extends ZadachaBanka, S> {
  razdel: RazdelBanka<Z, S>;
  payload: PayloadBanka;
  katalog: KatalogBanka;
  roundKey: string;
  /** Состояние экрана из сохранённой тренировки. null — тренировка новая. */
  restored: UiBanka | null;
  report: (ui: UiBanka) => void;
  /** Активное время тренировки, мс: пауза и скрытая вкладка не идут. */
  elapsed: () => number;
  onFinish: () => void;
  setBeforeFinish: (handler: (() => void) | null) => void;
  /** Название типа над условием: прототип → HTML. */
  nazvaniya: Record<string, string>;
  /** Название типа текстом — для закладки. */
  nazvaniyaTekst: Record<string, string>;
}

/**
 * Экран задачи тренажёра по банку: условие и одно поле ответа — в одну
 * колонку, на общем экране задачи (EkranZadachi). Под условием — что
 * даёт раздел: рисунок, вопрос после рисунка, откуда задача.
 *
 * Данные задач приезжают файлами прототипов по ходу тренировки. Ответ
 * читается по правилам бланка ЕГЭ и сверяется с отпечатком; неверная
 * запись (дробь, единицы, π) — подсказка о записи, попытка не тратится.
 * Подсказка — вопросы с кнопками. Решение по шагам открывается по
 * просьбе — тогда задача «решена с разбором». «Похожая задача» заменяет
 * текущую другой задачей того же типа. В режиме без подсказок ни того,
 * ни другого нет до итогов.
 */
export function EkranBanka<Z extends ZadachaBanka, S>({
  razdel,
  payload,
  katalog,
  roundKey,
  restored,
  report,
  elapsed,
  onFinish,
  setBeforeFinish,
  nazvaniya,
  nazvaniyaTekst,
}: EkranBankaProps<Z, S>) {
  const { T, zagruzka, log } = razdel;
  const pool = payload.tasks;
  const control = payload.control;
  const kinds = useMemo(() => pool.map((item) => item.p), [pool]);
  const build = useCallback(() => pickRound(kinds, pool.length), [kinds, pool.length]);
  const order = useRound(roundKey, build, restored?.order);

  const [index, setIndex] = useState(restored?.index ?? 0);
  const [value, setValue] = useState(restored?.value ?? '');
  const [checked, setChecked] = useState<'right' | 'wrong' | null>(restored?.checked ?? null);
  const [marks, setMarks] = useState<Record<number, TaskMark>>(restored?.marks ?? {});
  const [tried, setTried] = useState<Record<number, true>>(restored?.tried ?? {});
  const [solutionOpen, setSolutionOpen] = useState(restored?.solutionOpen ?? false);
  const [hintOpen, setHintOpen] = useState(restored?.hintOpen ?? false);
  const [shag, setShag] = useState(restored?.shag ?? 1);
  const [mimo, setMimo] = useState<number[]>(restored?.mimo ?? []);
  const [misses, setMisses] = useState(restored?.misses ?? 0);
  /* Время на задачу — с показа; у восстановленной тренировки — как было. */
  const [taskFrom, setTaskFrom] = useState<number | null>(() => restored?.taskFrom ?? elapsed());
  const [failed, setFailed] = useState(restored?.failed ?? false);
  /* «Похожая задача»: номер в тренировке → ключ другой задачи. */
  const [pohozhie, setPohozhie] = useState<Record<string, string>>(restored?.pohozhie ?? {});
  /* Подсказка о записи ответа: не ошибка, попытка не тратится; не хранится. */
  const [format, setFormat] = useState<string | null>(null);
  /* Неверный ответ был записан дробью: к вердикту — напоминание о записи. */
  const [viaFraction, setViaFraction] = useState(false);
  /* Файлы прототипов: приехали — счётчик растёт, и экран читает кеш заново. */
  const [, setPriehalo] = useState(0);
  const [oshibkaZagruzki, setOshibkaZagruzki] = useState(false);
  const [popytka, setPopytka] = useState(0);

  const poolIndex = order.length === 0 ? index : (order[index] ?? index);
  const total = order.length === 0 ? pool.length : order.length;

  const zameny = useMemo(() => {
    const out: Record<number, TaskBanka> = {};
    for (const [at, id] of Object.entries(pohozhie)) {
      const source = pool[Number(at)];
      if (source !== undefined && razdel.klyuch.test(id)) {
        out[Number(at)] = {
          id,
          p: source.p,
          ...(source.fixes === undefined ? {} : { fixes: source.fixes }),
        };
      }
    }
    return out;
  }, [pohozhie, pool, razdel.klyuch]);
  useEffect(() => {
    ZAMENY.set(payload, zameny);
  }, [payload, zameny]);

  /* Данные всех задач тренировки: файлы прототипов, решатель и KaTeX. */
  useEffect(() => {
    let zhiv = true;
    const ids = [...pool.map((t) => t.id), ...Object.values(pohozhie)];
    if (ids.every((id) => zagruzka.izKesha(id) !== undefined)) {
      return undefined;
    }
    zagruzka
      .zagruzit(pool.map((t) => t.p))
      .then(() => {
        if (zhiv) setPriehalo((n) => n + 1);
      })
      .catch(() => {
        if (zhiv) setOshibkaZagruzki(true);
      });
    return () => {
      zhiv = false;
    };
  }, [pool, pohozhie, popytka, zagruzka]);

  const task = zameny[poolIndex] ?? pool[poolIndex];
  const zadacha = task === undefined ? undefined : zagruzka.izKesha(task.id);

  useSessionReport<UiBanka>(report, {
    index,
    marks,
    tried,
    order: order.length === 0 ? null : order,
    value,
    checked,
    solutionOpen,
    hintOpen,
    shag,
    mimo,
    misses,
    failed,
    taskFrom,
    pohozhie,
  });

  /* Разбор нужен подсказке и решению: строится, когда открыто одно из них. */
  const nuzhenRazbor = hintOpen || solutionOpen;
  const razbor = useMemo(
    () => (zadacha === undefined || !nuzhenRazbor ? null : zagruzka.reshenie(zadacha)),
    [zadacha, nuzhenRazbor, zagruzka],
  );
  const shagi = useMemo(() => (razbor === null ? [] : razdel.shagi(razbor)), [razbor, razdel]);
  const voprosy = useMemo(() => (razbor === null ? [] : razdel.voprosy(razbor)), [razbor, razdel]);

  function taskSeconds(): number {
    return taskFrom === null ? 0 : (elapsed() - taskFrom) / 1000;
  }

  /* Журнал попыток (lib/progressLog): из него считаются прогресс по
     группам, «Стоит повторить» и «Мои ошибки». Тип попытки — прототип
     банка. Аналог из «Работы над ошибками» записывается с задачей,
     ошибку в которой он закрывает. */
  function remember(item: TaskBanka, outcome: LogOutcome) {
    log.record({
      task: item.id,
      kind: item.p,
      outcome,
      seconds: Math.round(taskSeconds()),
      session: roundKey,
      ...(item.fixes === undefined ? {} : { fixes: item.fixes }),
    });
  }

  /* Досрочное «Завершить»: начатая, но не закрытая задача с ошибкой — в журнал. */
  useBeforeFinish(setBeforeFinish, () => {
    if (task !== undefined && checked === 'wrong' && marks[index] === undefined) {
      remember(task, 'wrong');
    }
  });

  if (task === undefined) {
    return null;
  }
  if (zadacha === undefined) {
    return (
      <div className="trn-ekran trn-zagruzka" role="status" aria-live="polite">
        {oshibkaZagruzki ? (
          <>
            <p>{T.ekran.oshibkaZagruzki}</p>
            <button
              type="button"
              className="stk-btn stk-btn--primary"
              onClick={() => {
                setOshibkaZagruzki(false);
                setPopytka(popytka + 1);
              }}
            >
              {T.ekran.povtorit}
            </button>
          </>
        ) : (
          <p>{T.ekran.zagruzka}</p>
        )}
      </div>
    );
  }
  const tekushchaya: TaskBanka = task;
  const dannye: Z = zadacha;

  const revealed = solutionOpen && checked !== 'right';
  const sostoyanie: SostoyanieZadachi =
    checked === 'right' ? 'verno' : revealed ? 'razbor' : checked === 'wrong' ? 'neverno' : 'vvod';
  const last = index === total - 1;
  const zakryta = marks[index] !== undefined;

  function check() {
    const reading = razdel.proverit(value, dannye.seal);
    if (reading.kind === 'pi') {
      /* Ответ через π: подсказка о записи, попытка не тратится. */
      setFormat(T.ekran.piPodskazka);
      return;
    }
    if (reading.kind === 'format') {
      /* Неверная запись: подсказка, попытка не тратится. */
      setFormat(formatHint(reading.problem, reading.meant));
      return;
    }
    if (reading.kind === 'fractionRight') {
      /* Значение верное, но дробью: не засчитано и не ошибка. */
      setFormat(fractionRightHint(reading.decimal));
      return;
    }
    setFormat(null);
    const right = reading.right;
    setViaFraction(!right && reading.viaFraction);
    setChecked(right ? 'right' : 'wrong');
    if (right) {
      if (!zakryta) {
        /* Начисто — без ошибок и без подсказки; иначе «с разбором». */
        const chisto = !failed && !hintOpen;
        setMarks({ ...marks, [index]: chisto ? 'right' : 'hinted' });
        /* Верно с первой попытки, но с открытой подсказкой — «с подсказкой». */
        remember(tekushchaya, failed ? 'wrong' : hintOpen ? 'hinted' : 'right');
      }
    } else {
      setFailed(true);
      setMisses(misses + 1);
      setTried({ ...tried, [index]: true });
    }
  }

  function reveal() {
    const wasOpen = solutionOpen;
    setSolutionOpen(!wasOpen);
    if (!wasOpen && checked !== 'right' && !zakryta) {
      /* Решение открыто до ответа: задача закрыта «с разбором». */
      setMarks({ ...marks, [index]: 'hinted' });
      remember(tekushchaya, 'revealed');
    }
  }

  function resetTask() {
    setTaskFrom(elapsed());
    setFailed(false);
    setValue('');
    setChecked(null);
    setSolutionOpen(false);
    setHintOpen(false);
    setShag(1);
    setMimo([]);
    setFormat(null);
    setViaFraction(false);
  }

  function next() {
    if (checked === 'wrong' && !zakryta) {
      remember(tekushchaya, 'wrong');
    }
    if (last) {
      onFinish();
      return;
    }
    resetTask();
    setIndex(index + 1);
  }

  const zanyato = new Set([...pool.map((item) => item.id), ...Object.values(pohozhie)]);
  const estPohozhaya = analogOf(katalog, tekushchaya.p, tekushchaya.id, zanyato) !== null;

  function pohozhaya() {
    const fresh = analogOf(katalog, tekushchaya.p, tekushchaya.id, zanyato);
    if (fresh === null) {
      return;
    }
    /* Закрытая задача уходит из отметок: решается новая. */
    const nextMarks = { ...marks };
    delete nextMarks[index];
    const nextTried = { ...tried };
    delete nextTried[index];
    setMarks(nextMarks);
    setTried(nextTried);
    setPohozhie({ ...pohozhie, [poolIndex]: fresh });
    resetTask();
  }

  return (
    <EkranZadachi
      taskId={dannye.id}
      nomer={index + 1}
      vsego={total}
      tipHtml={nazvaniya[tekushchaya.p] ?? ''}
      uslovieHtml={zagruzka.nabrat(dannye.text)}
      tekst
      pod={razdel.pod(dannye, {
        podskazka: hintOpen && !control,
        shag,
        reshenie: solutionOpen && !control,
        razbor,
      })}
      value={value}
      onValue={(nextValue) => {
        setValue(nextValue);
        setFormat(null);
        if (checked === 'wrong') {
          setChecked(null);
        }
      }}
      sostoyanie={sostoyanie}
      onCheck={check}
      formatHint={format}
      podskazka={
        control
          ? null
          : {
              html: '',
              open: hintOpen,
              onOpen: () => setHintOpen(true),
              telo:
                voprosy.length === 0 ? (
                  <p>{T.ekran.zagruzka}</p>
                ) : (
                  <PodskazkaVoprosy
                    voprosy={voprosy}
                    otkryto={shag}
                    mimo={mimo}
                    onVerno={() => {
                      setShag(shag + 1);
                      setMimo([]);
                    }}
                    onMimo={(j) => setMimo([...mimo, j])}
                    labels={T.ekran.voprosy}
                  />
                ),
            }
      }
      reshenie={
        control
          ? null
          : {
              shagi,
              posle:
                razbor === null || razdel.posle === undefined ? undefined : razdel.posle(razbor),
              open: solutionOpen,
              onToggle: reveal,
            }
      }
      {...(estPohozhaya ? { onPohozhaya: pohozhaya } : {})}
      onNext={next}
      last={last}
      zakladka={
        <BookmarkButton
          section={razdel.razdel}
          place="trenazher"
          refId={dannye.id}
          title={T.ekran.zakladka(nazvaniyaTekst[tekushchaya.p] ?? '')}
          href={razdel.zadachaHref(dannye.id)}
          className="trn-zakladka"
        />
      }
      bezPodskazok={control}
      labels={{
        ...T.ekran,
        vernoLead: T.ekran.vernoLead(checked === 'right' ? taskSeconds() : null),
        nevernoLead: viaFraction ? T.ekran.nevernoDrob : T.ekran.nevernoLead,
      }}
    />
  );
}
