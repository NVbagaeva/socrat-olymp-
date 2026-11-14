'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { BookmarkButton } from '@/components/zakladki/BookmarkButton';
import { useBeforeFinish } from '../session/useBeforeFinish';
import { useSessionReport } from '../session/useSessionReport';
import type { Shag } from '../steklo';
import { EkranZadachi, type SostoyanieZadachi } from '../trening';
import { TRENAZHER8, podskazkaTipa } from '@/content/vychisleniya8';
import { formatHint, fractionRightHint } from '@/lib/otvet';
import type { LogOutcome } from '@/lib/progressLog';
import { pickRound, useRound } from '@/lib/trainerRound';
import type { TaskMark } from '@/lib/trainerSession/types';
import { zadachaHref } from '@/lib/vychisleniya/links';
import { log8 } from '@/lib/vychisleniya/progress';
import type { PriznakHtml, RazborHtml, ShagHtml } from '@/lib/vychisleniya/razbor';
import { openText, readSealed } from '@/lib/vychisleniya/secret';
import { analogOf, parseTaskId, makeTask, type Task8 } from '@/lib/vychisleniya/session';
import { typeset } from '@/lib/tex';
import { ZAMENY8, type Trenazher8Payload } from './trenazher8Payload';
import type { Trenazher8Ui } from './trenazher8Ui';

export interface Trenazher8ScreenProps {
  payload: Trenazher8Payload;
  roundKey: string;
  /** Состояние экрана из сохранённой тренировки. null — тренировка новая. */
  restored: Trenazher8Ui | null;
  report: (ui: Trenazher8Ui) => void;
  /** Активное время тренировки, мс: пауза и скрытая вкладка не идут. */
  elapsed: () => number;
  onFinish: () => void;
  setBeforeFinish: (handler: (() => void) | null) => void;
  /** Название типа над условием: прототип → HTML. */
  nazvaniya: Record<string, string>;
}

/** Решение: закрыто тем же отпечатком, что и ответ; раскрывается по нажатию. */
export function razborOf(task: Task8): RazborHtml {
  try {
    const value = JSON.parse(openText(task.razbor, task.seal)) as Partial<RazborHtml>;
    const shagi = Array.isArray(value.shagi)
      ? value.shagi.filter(
          (item): item is ShagHtml =>
            typeof item === 'object' &&
            item !== null &&
            typeof item.chto === 'string' &&
            typeof item.tex === 'string',
        )
      : [];
    const delimost = Array.isArray(value.delimost)
      ? value.delimost.filter(
          (item): item is PriznakHtml =>
            typeof item === 'object' &&
            item !== null &&
            typeof item.title === 'string' &&
            typeof item.html === 'string',
        )
      : [];
    return { shagi, delimost };
  } catch {
    return { shagi: [], delimost: [] };
  }
}

/** Решение в виде шагов сцены: подпись «что делаем и почему» и выкладка — из генератора. */
export function shagiOf(task: Task8): { shagi: Shag[]; delimost: PriznakHtml[] } {
  const razbor = razborOf(task);
  return {
    shagi: razbor.shagi.map((step) => ({ chtoHtml: step.chto, formulaHtml: step.tex })),
    delimost: razbor.delimost,
  };
}

/**
 * Экран задания тренажёра №8.
 *
 * Условие и одно поле для ответа. Ответ сверяется с отпечатком: числа
 * в разметке нет; неверная запись (дробь, единицы) — подсказка о
 * формате, попытка не тратится. Подсказка (первый шаг вопросом)
 * бесплатна; решение открывается по просьбе — тогда задача «решена с
 * разбором» и в журнал идёт как открытое решение. «Похожая задача»
 * заменяет текущую свежей того же типа. В режиме без подсказок ни
 * того, ни другого нет до итогов.
 */
export function Trenazher8Screen({
  payload,
  roundKey,
  restored,
  report,
  elapsed,
  onFinish,
  setBeforeFinish,
  nazvaniya,
}: Trenazher8ScreenProps) {
  const pool = payload.tasks;
  const control = payload.control;
  const kinds = useMemo(() => pool.map((item) => item.prototype), [pool]);
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
  const [pohozhie, setPohozhie] = useState<Record<string, string>>(restored?.pohozhie ?? {});
  /* Подсказка о записи ответа: не ошибка, попытка не тратится; не хранится. */
  const [format, setFormat] = useState<string | null>(null);
  /* Неверный ответ был записан дробью: к вердикту — напоминание о записи. */
  const [viaFraction, setViaFraction] = useState(false);

  const poolIndex = order.length === 0 ? index : (order[index] ?? index);
  const total = order.length === 0 ? pool.length : order.length;

  /* Замены «Похожая задача» собираются по seed при каждом входе. */
  const zameny = useMemo(() => {
    const out: Record<number, Task8> = {};
    for (const [at, seed] of Object.entries(pohozhie)) {
      const source = pool[Number(at)];
      const parsed = source === undefined ? null : parseTaskId(source.id);
      if (source === undefined || parsed === null) {
        continue;
      }
      try {
        out[Number(at)] = makeTask(source.prototype, seed, parsed.level, source.fixes);
      } catch {
        /* Сайт обновился и seed не подошёл — остаётся исходная задача. */
      }
    }
    return out;
  }, [pohozhie, pool]);
  useEffect(() => {
    ZAMENY8.set(payload, zameny);
  }, [payload, zameny]);

  const task = zameny[poolIndex] ?? pool[poolIndex];

  useSessionReport<Trenazher8Ui>(report, {
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

  const reshenie = useMemo(
    () => (task === undefined ? { shagi: [], delimost: [] } : shagiOf(task)),
    [task],
  );
  const podskazkaHtml = useMemo(() => {
    const text = task === undefined ? null : podskazkaTipa(task.prototype, task.podtip);
    return text === null ? null : typeset(text);
  }, [task]);

  function taskSeconds(): number {
    return taskFrom === null ? 0 : (elapsed() - taskFrom) / 1000;
  }

  /* Журнал попыток (lib/progressLog): из него считаются прогресс по
     типам, «Стоит повторить» и «Мои ошибки». Аналог из «Работы над
     ошибками» записывается с задачей, ошибку в которой он закрывает. */
  function remember(item: Task8, outcome: LogOutcome) {
    log8.record({
      task: item.id,
      kind: item.prototype,
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
  const zadacha: Task8 = task;

  const revealed = solutionOpen && checked !== 'right';
  const sostoyanie: SostoyanieZadachi =
    checked === 'right' ? 'verno' : revealed ? 'razbor' : checked === 'wrong' ? 'neverno' : 'vvod';
  const last = index === total - 1;
  const zakryta = marks[index] !== undefined;

  function check() {
    const reading = readSealed(value, zadacha.seal, 'trenazher');
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
      setMarks({ ...marks, [index]: 'right' });
      /* Верно с первой попытки, но с открытой подсказкой — «с подсказкой». */
      remember(zadacha, failed ? 'wrong' : hintOpen ? 'hinted' : 'right');
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
      remember(zadacha, 'revealed');
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
      remember(zadacha, 'wrong');
    }
    if (last) {
      onFinish();
      return;
    }
    resetTask();
    setIndex(index + 1);
  }

  function pohozhaya() {
    const avoid = new Set(pool.map((item) => item.questionHtml));
    const fresh = analogOf(zadacha.id, zadacha.fixes ?? zadacha.id, avoid);
    const parsed = fresh === null ? null : parseTaskId(fresh.id);
    if (fresh === null || parsed === null) {
      return;
    }
    /* Закрытая задача уходит из отметок: решается новая. */
    const nextMarks = { ...marks };
    delete nextMarks[index];
    const nextTried = { ...tried };
    delete nextTried[index];
    setMarks(nextMarks);
    setTried(nextTried);
    setPohozhie({ ...pohozhie, [poolIndex]: parsed.seed });
    resetTask();
  }

  return (
    <EkranZadachi
      taskId={zadacha.id}
      nomer={index + 1}
      vsego={total}
      tipHtml={nazvaniya[zadacha.prototype] ?? zadacha.prototype}
      uslovieHtml={zadacha.questionHtml}
      value={value}
      onValue={(next) => {
        setValue(next);
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
      reshenie={
        control
          ? null
          : {
              shagi: reshenie.shagi,
              delimost: reshenie.delimost,
              open: solutionOpen,
              onToggle: reveal,
            }
      }
      onPohozhaya={pohozhaya}
      onNext={next}
      last={last}
      zakladka={
        <BookmarkButton
          section="8"
          place="trenazher"
          refId={zadacha.id}
          title={`№8 · тренажёр, тип ${zadacha.prototype}`}
          href={zadachaHref(zadacha.id)}
          className="trn-zakladka"
        />
      }
      bezPodskazok={control}
      labels={{
        ...TRENAZHER8.ekran,
        vernoLead: TRENAZHER8.ekran.vernoLead(checked === 'right' ? taskSeconds() : null),
        nevernoLead: viaFraction ? TRENAZHER8.ekran.nevernoDrob : TRENAZHER8.ekran.nevernoLead,
      }}
    />
  );
}
