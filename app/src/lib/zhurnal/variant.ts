'use client';

/**
 * Завершённый вариант — в журнал кабинета: результат работы и каждая
 * задача с ответом ученика, верным ответом и временем
 * (docs/plans/cabinet-v2.md, этап 1).
 */

import { novyyId, zapisatGotovye, zapisatRabotu, type GotovayaZadacha, type Rabota } from './index';
import { razdelNomera } from '@/content/struktura';
import type { VariantTask } from '@/lib/variant/types';

export interface ItogVarianta {
  kind: Rabota['kind'];
  code: string;
  variant: number;
  mode: 'trening' | 'kontrol';
  title: string;
  startedAt: number;
  finishedAt: number;
  /** Активное время работы, мс. */
  activeMs: number;
  primary: number;
  max: number;
  test: number | null;
  tasks: VariantTask[];
  /** Первые ответы, вторые попытки тренировки, верно ли по первой попытке. */
  answers: Record<number, string>;
  second: Record<number, string>;
  right: boolean[];
  secondRight: Record<number, boolean>;
  hinted: number[];
  /** Активное время по задачам, мс. */
  times: Record<number, number>;
}

/** Номер хранения раздела по номеру ЕГЭ; у задачи «Собрать вариант» он есть всегда. */
function nomerHraneniya(egeNumber: number): number | null {
  try {
    return razdelNomera(egeNumber).hranenie;
  } catch {
    return null;
  }
}

export function zapisatVariant(itog: ItogVarianta): void {
  const workId = novyyId();
  const total = Math.max(itog.activeMs, itog.finishedAt - itog.startedAt, 0);
  zapisatRabotu({
    id: workId,
    kind: itog.kind,
    code: itog.code,
    variant: itog.variant,
    mode: itog.mode,
    title: itog.title,
    startedAt: new Date(itog.startedAt).toISOString(),
    finishedAt: new Date(itog.finishedAt).toISOString(),
    primary: itog.primary,
    max: itog.max,
    test: itog.test,
    totalMs: Math.min(total, 86_400_000),
    activeMs: Math.min(itog.activeMs, total, 86_400_000),
  });
  const zadachi: GotovayaZadacha[] = [];
  itog.tasks.forEach((task, i) => {
    const taskNo = nomerHraneniya(task.egeNumber);
    if (taskNo === null || !Number.isInteger(taskNo)) {
      return;
    }
    const first = itog.answers[i] ?? '';
    const second = itog.second[i];
    const popytki: GotovayaZadacha['popytki'] = [];
    if (first !== '') {
      popytki.push({ answer: first, ok: itog.right[i] === true });
    }
    if (second !== undefined && second !== '') {
      popytki.push({ answer: second, ok: itog.secondRight[i] === true });
    }
    const podskazka = itog.hinted.includes(i);
    zadachi.push({
      opis: {
        klyuch: `v:${workId}:${i}`,
        source: 'variant',
        taskNo,
        kind: task.prototypeId,
        ref: JSON.stringify(task.ref).slice(0, 200),
        statement: task.statement,
        ...(task.figure === null ? {} : { figure: task.figure.svg }),
        ...(task.answer === '' ? {} : { answer: task.answer }),
        workId,
        position: i + 1,
      },
      startedAt: itog.startedAt,
      closedAt: itog.finishedAt,
      outcome:
        first === '' ? 'skipped' : itog.right[i] === true ? (podskazka ? 'hinted' : 'right') : 'wrong',
      activeMs: itog.times[i] ?? 0,
      popytki,
      podskazka,
    });
  });
  zapisatGotovye(zadachi);
}
