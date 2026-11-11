'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { BookmarkButton } from '@/components/zakladki/BookmarkButton';
import { useBeforeFinish } from '../session/useBeforeFinish';
import { useSessionReport } from '../session/useSessionReport';
import type { Shag } from '../steklo';
import { EkranZadachi, type SostoyanieZadachi } from '../trening';
import { TRENAZHER3 } from '@/content/zadanie3';
import { tipPrototipa } from '@/content/zadanie3/gruppy';
import { formatHint, fractionRightHint } from '@/lib/otvet';
import type { LogOutcome } from '@/lib/progressLog';
import { pickRound, useRound } from '@/lib/trainerRound';
import type { TaskMark } from '@/lib/trainerSession/types';
import { zadachaHref3 } from '@/lib/zadanie3/links';
import { readSealed3 } from '@/lib/zadanie3/secret';
import { log3 } from '@/lib/zadanie3/trening/progress';
import {
  ZAMENY3,
  analogOf3,
  razobratKlyuch3,
  type Katalog3,
  type Task3,
  type Trenazher3Payload,
} from '@/lib/zadanie3/trening/session';
import {
  modelZadachi,
  nabrat,
  podskazkaZadachi,
  reshenieZadachi,
  zadachaIzKesha,
  zagruzitZadachi,
  type Zadacha3,
} from '@/lib/zadanie3/trening/zagruzka';
import { ChertezhZadachi } from './ChertezhZadachi';
import type { Trenazher3Ui } from './trenazher3Ui';

export interface Trenazher3ScreenProps {
  payload: Trenazher3Payload;
  katalog: Katalog3;
  roundKey: string;
  /** Состояние экрана из сохранённой тренировки. null — тренировка новая. */
  restored: Trenazher3Ui | null;
  report: (ui: Trenazher3Ui) => void;
  /** Активное время тренировки, мс: пауза и скрытая вкладка не идут. */
  elapsed: () => number;
  onFinish: () => void;
  setBeforeFinish: (handler: (() => void) | null) => void;
  /** Название типа над условием: тип → HTML. */
  nazvaniya: Record<string, string>;
  /** Название типа текстом — для закладки. */
  nazvaniyaTekst: Record<string, string>;
}

/** Решение задачи шагами сцены: подпись и выкладка набраны KaTeX. */
export function shagiZadachi(z: Zadacha3): Shag[] {
  return reshenieZadachi(z).map((s) => ({
    chtoHtml: nabrat(s.chto),
    formulaHtml: s.formula === '' ? '' : nabrat(s.formula),
  }));
}

/**
 * Экран задачи тренажёра №3: чертёж, условие и одно поле ответа.
 *
 * Данные задач приезжают файлами прототипов по ходу тренировки. Ответ
 * сверяется с отпечатком; неверная запись (дробь, единицы) — подсказка
 * о формате, попытка не тратится. Подсказка — вопрос о первом шаге,
 * без ответа. Решение открывается по просьбе — тогда задача «решена с
 * разбором». «Похожая задача» заменяет текущую другим вариантом того
 * же типа. В режиме без подсказок ни того, ни другого нет до итогов.
 */
export function Trenazher3Screen({
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
}: Trenazher3ScreenProps) {
  const pool = payload.tasks;
  const control = payload.control;
  const kinds = useMemo(() => pool.map((item) => razobratKlyuch3(item.id)?.prototip ?? ''), [pool]);
  const build = useCallback(() => pickRound(kinds, pool.length), [kinds, pool.length]);
  const order = useRound(roundKey, build, restored?.order);

  const [index, setIndex] = useState(restored?.index ?? 0);
  const [value, setValue] = useState(restored?.value ?? '');
  const [checked, setChecked] = useState<'right' | 'wrong' | null>(restored?.checked ?? null);
  const [marks, setMarks] = useState<Record<number, TaskMark>>(restored?.marks ?? {});
  const [tried, setTried] = useState<Record<number, true>>(restored?.tried ?? {});
  const [solutionOpen, setSolutionOpen] = useState(restored?.solutionOpen ?? false);
  const [hintOpen, setHintOpen] = useState(restored?.hintOpen ?? false);
  const [misses, setMisses] = useState(restored?.misses ?? 0);
  /* Время на задачу — с показа; у восстановленной тренировки — как было. */
  const [taskFrom, setTaskFrom] = useState<number | null>(() => restored?.taskFrom ?? elapsed());
  const [failed, setFailed] = useState(restored?.failed ?? false);
  /* «Похожая задача»: номер в тренировке → ключ другого варианта. */
  const [pohozhie, setPohozhie] = useState<Record<string, string>>(restored?.pohozhie ?? {});
  const [format, setFormat] = useState<string | null>(null);
  const [viaFraction, setViaFraction] = useState(false);
  /* Файлы прототипов: приехали — счётчик растёт, и экран читает кеш заново. */
  const [, setPriehalo] = useState(0);
  const [oshibkaZagruzki, setOshibkaZagruzki] = useState(false);
  const [popytka, setPopytka] = useState(0);

  const poolIndex = order.length === 0 ? index : (order[index] ?? index);
  const total = order.length === 0 ? pool.length : order.length;

  const zameny = useMemo(() => {
    const out: Record<number, Task3> = {};
    for (const [at, id] of Object.entries(pohozhie)) {
      const source = pool[Number(at)];
      if (source !== undefined && razobratKlyuch3(id) !== null) {
        out[Number(at)] = { id, ...(source.fixes === undefined ? {} : { fixes: source.fixes }) };
      }
    }
    return out;
  }, [pohozhie, pool]);
  useEffect(() => {
    ZAMENY3.set(payload, zameny);
  }, [payload, zameny]);

  /* Данные всех задач тренировки и замен: файлы прототипов и KaTeX. */
  useEffect(() => {
    let zhiv = true;
    const ids = [...pool.map((t) => t.id), ...Object.values(pohozhie)];
    if (ids.every((id) => zadachaIzKesha(id) !== undefined)) {
      return undefined;
    }
    zagruzitZadachi(ids)
      .then(() => {
        if (zhiv) setPriehalo((n) => n + 1);
      })
      .catch(() => {
        if (zhiv) setOshibkaZagruzki(true);
      });
    return () => {
      zhiv = false;
    };
  }, [pool, pohozhie, popytka]);

  const task = zameny[poolIndex] ?? pool[poolIndex];
  const zadacha = task === undefined ? undefined : zadachaIzKesha(task.id);

  useSessionReport<Trenazher3Ui>(report, {
    index,
    marks,
    tried,
    order: order.length === 0 ? null : order,
    value,
    checked,
    solutionOpen,
    hintOpen,
    misses,
    failed,
    taskFrom,
    pohozhie,
  });

  const shagi = useMemo(() => (zadacha === undefined ? [] : shagiZadachi(zadacha)), [zadacha]);
  const podskazkaHtml = useMemo(() => {
    const text = zadacha === undefined ? null : podskazkaZadachi(zadacha);
    return text === null ? null : nabrat(text);
  }, [zadacha]);
  const model = useMemo(() => (zadacha === undefined ? null : modelZadachi(zadacha)), [zadacha]);

  function taskSeconds(): number {
    return taskFrom === null ? 0 : (elapsed() - taskFrom) / 1000;
  }

  /* Журнал попыток (lib/progressLog): из него считаются прогресс по
     группам, «Стоит повторить» и «Мои ошибки». Тип попытки — прототип
     банка. Аналог из «Работы над ошибками» записывается с задачей,
     ошибку в которой он закрывает. */
  function remember(item: Task3, outcome: LogOutcome) {
    log3.record({
      task: item.id,
      kind: razobratKlyuch3(item.id)?.prototip ?? item.id,
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
  if (zadacha === undefined || model === null) {
    return (
      <div className="trn-ekran z3-zagruzka" role="status" aria-live="polite">
        {oshibkaZagruzki ? (
          <>
            <p>{TRENAZHER3.ekran.oshibkaZagruzki}</p>
            <button
              type="button"
              className="stk-btn stk-btn--primary"
              onClick={() => {
                setOshibkaZagruzki(false);
                setPopytka(popytka + 1);
              }}
            >
              {TRENAZHER3.ekran.povtorit}
            </button>
          </>
        ) : (
          <p>{TRENAZHER3.ekran.zagruzka}</p>
        )}
      </div>
    );
  }
  const tekushchaya: Task3 = task;
  const dannye: Zadacha3 = zadacha;
  const tip = tipPrototipa(dannye.prototip) ?? '';

  const revealed = solutionOpen && checked !== 'right';
  const sostoyanie: SostoyanieZadachi =
    checked === 'right' ? 'verno' : revealed ? 'razbor' : checked === 'wrong' ? 'neverno' : 'vvod';
  const last = index === total - 1;
  const zakryta = marks[index] !== undefined;

  function check() {
    const reading = readSealed3(value, dannye.variant.seal, dannye.id);
    if (reading.kind === 'format') {
      setFormat(formatHint(reading.problem, reading.meant));
      return;
    }
    if (reading.kind === 'fractionRight') {
      setFormat(fractionRightHint(reading.decimal));
      return;
    }
    setFormat(null);
    const right = reading.right;
    setViaFraction(!right && reading.viaFraction);
    setChecked(right ? 'right' : 'wrong');
    if (right) {
      if (!zakryta) {
        setMarks({ ...marks, [index]: 'right' });
        remember(tekushchaya, failed ? 'wrong' : 'right');
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

  function pohozhaya() {
    const avoid = new Set([...pool.map((item) => item.id), ...Object.values(pohozhie)]);
    const fresh = analogOf3(katalog, tekushchaya.id, avoid);
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

  const estPohozhaya =
    analogOf3(
      katalog,
      tekushchaya.id,
      new Set([...pool.map((item) => item.id), ...Object.values(pohozhie)]),
    ) !== null;

  return (
    <EkranZadachi
      taskId={dannye.id}
      nomer={index + 1}
      vsego={total}
      tipHtml={nazvaniya[tip] ?? ''}
      risunok={<ChertezhZadachi key={dannye.id} model={model} alt={TRENAZHER3.ekran.chertezh} />}
      uslovieHtml={dannye.variant.uslovieHtml}
      tekst
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
        control || podskazkaHtml === null
          ? null
          : { html: podskazkaHtml, open: hintOpen, onOpen: () => setHintOpen(true) }
      }
      reshenie={control ? null : { shagi, open: solutionOpen, onToggle: reveal }}
      {...(estPohozhaya ? { onPohozhaya: pohozhaya } : {})}
      onNext={next}
      last={last}
      zakladka={
        <BookmarkButton
          section="3"
          place="trenazher"
          refId={dannye.id}
          title={TRENAZHER3.ekran.zakladka(nazvaniyaTekst[tip] ?? '')}
          href={zadachaHref3(dannye.id)}
          className="trn-zakladka"
        />
      }
      bezPodskazok={control}
      labels={{
        ...TRENAZHER3.ekran,
        vernoLead: TRENAZHER3.ekran.vernoLead(checked === 'right' ? taskSeconds() : null),
        nevernoLead: viaFraction ? TRENAZHER3.ekran.nevernoDrob : TRENAZHER3.ekran.nevernoLead,
      }}
    />
  );
}
