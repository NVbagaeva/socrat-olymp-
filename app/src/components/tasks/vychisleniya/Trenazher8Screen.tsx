'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { useBeforeFinish } from '../session/useBeforeFinish';
import { useSessionReport } from '../session/useSessionReport';
import type { Shag } from '../steklo';
import { EkranZadachi, type SostoyanieZadachi } from '../trening';
import { TRENAZHER8, podskazkaTipa, shagiTipa } from '@/content/vychisleniya8';
import { pickRound, useRound } from '@/lib/trainerRound';
import type { TaskMark } from '@/lib/trainerSession/types';
import {
  progress8,
  toggleZakladka8,
  zakladki8,
  zapisatPopytku8,
} from '@/lib/vychisleniya/progress';
import { answerMatches, openText } from '@/lib/vychisleniya/secret';
import { levelOfTaskId, makeTask, randomSeed, type Task8 } from '@/lib/vychisleniya/session';
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

/** Разбор: закрыт тем же отпечатком, что и ответ; раскрывается по нажатию. */
export function razborOf(task: Task8): string[] {
  try {
    const value: unknown = JSON.parse(openText(task.razbor, task.seal));
    return Array.isArray(value)
      ? value.filter((item): item is string => typeof item === 'string')
      : [];
  } catch {
    return [];
  }
}

/** Шаги решения с подписями: формулы из разбора, подписи — по подтипу. */
export function shagiOf(task: Task8): Shag[] {
  const podpisi = shagiTipa(task.prototype, task.podtip);
  return razborOf(task).map((line, i) => ({
    chtoHtml: typeset(podpisi?.[i] ?? ''),
    formulaHtml: line,
  }));
}

/** Сколько seed пробовать для похожей задачи. */
const ATTEMPTS = 20;

/**
 * Экран задания тренажёра №8.
 *
 * Условие и одно поле для ответа. Ответ сверяется с отпечатком: числа
 * в разметке нет. Подсказка (первый шаг вопросом) бесплатна; решение
 * открывается по просьбе — тогда задача «решена с разбором» и в
 * прогресс как верная не идёт. «Похожая задача» заменяет текущую
 * свежей того же типа. В режиме без подсказок ни того, ни другого
 * нет до итогов.
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
  const zakladki = zakladki8.use();

  const poolIndex = order.length === 0 ? index : (order[index] ?? index);
  const total = order.length === 0 ? pool.length : order.length;

  /* Замены «Похожая задача» собираются по seed при каждом входе. */
  const zameny = useMemo(() => {
    const out: Record<number, Task8> = {};
    for (const [at, seed] of Object.entries(pohozhie)) {
      const source = pool[Number(at)];
      if (source === undefined) {
        continue;
      }
      try {
        out[Number(at)] = makeTask(source.prototype, seed, levelOfTaskId(source.id));
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

  const shagi = useMemo(() => (task === undefined ? [] : shagiOf(task)), [task]);
  const podskazkaHtml = useMemo(() => {
    const text = task === undefined ? null : podskazkaTipa(task.prototype, task.podtip);
    return text === null ? null : typeset(text);
  }, [task]);

  function taskSeconds(): number {
    return taskFrom === null ? 0 : (elapsed() - taskFrom) / 1000;
  }

  function remember(item: Task8, itog: 'right' | 'wrong' | 'revealed', clean: boolean) {
    progress8.recordAttempt({
      kind: item.prototype,
      taskId: item.id,
      right: itog === 'right',
      clean,
      seconds: taskSeconds(),
      itog,
    });
    zapisatPopytku8(item.prototype, itog === 'right' && clean);
  }

  /* Досрочное «Завершить»: начатая, но не закрытая задача с ошибкой — в историю. */
  useBeforeFinish(setBeforeFinish, () => {
    if (task !== undefined && checked === 'wrong' && marks[index] === undefined) {
      remember(task, 'wrong', false);
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
    const right = answerMatches(value, zadacha.seal);
    setChecked(right ? 'right' : 'wrong');
    if (right) {
      const clean = !failed;
      setMarks({ ...marks, [index]: 'right' });
      remember(zadacha, 'right', clean);
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
      remember(zadacha, 'revealed', false);
    }
  }

  function resetTask() {
    setTaskFrom(elapsed());
    setFailed(false);
    setValue('');
    setChecked(null);
    setSolutionOpen(false);
    setHintOpen(false);
  }

  function next() {
    if (checked === 'wrong' && !zakryta) {
      remember(zadacha, 'wrong', false);
    }
    if (last) {
      onFinish();
      return;
    }
    resetTask();
    setIndex(index + 1);
  }

  function pohozhaya() {
    for (let i = 0; i < ATTEMPTS; i += 1) {
      const seed = randomSeed();
      try {
        const fresh = makeTask(zadacha.prototype, seed, levelOfTaskId(zadacha.id));
        if (fresh.questionHtml === zadacha.questionHtml) {
          continue;
        }
      } catch {
        continue;
      }
      /* Закрытая задача уходит из отметок: решается новая. */
      const nextMarks = { ...marks };
      delete nextMarks[index];
      const nextTried = { ...tried };
      delete nextTried[index];
      setMarks(nextMarks);
      setTried(nextTried);
      setPohozhie({ ...pohozhie, [poolIndex]: seed });
      resetTask();
      return;
    }
  }

  return (
    <EkranZadachi
      nomer={index + 1}
      vsego={total}
      tipHtml={nazvaniya[zadacha.prototype] ?? zadacha.prototype}
      uslovieHtml={zadacha.questionHtml}
      value={value}
      onValue={(next) => {
        setValue(next);
        if (checked === 'wrong') {
          setChecked(null);
        }
      }}
      sostoyanie={sostoyanie}
      onCheck={check}
      podskazka={
        control || podskazkaHtml === null
          ? null
          : { html: podskazkaHtml, open: hintOpen, onOpen: () => setHintOpen(true) }
      }
      reshenie={control ? null : { shagi, open: solutionOpen, onToggle: reveal }}
      onPohozhaya={pohozhaya}
      onNext={next}
      last={last}
      zakladka={{ on: zakladki.includes(zadacha.id), onToggle: () => toggleZakladka8(zadacha.id) }}
      bezPodskazok={control}
      labels={{
        ...TRENAZHER8.ekran,
        vernoLead: TRENAZHER8.ekran.vernoLead(checked === 'right' ? taskSeconds() : null),
      }}
    />
  );
}
