/**
 * Статистика ученика по завершённым работам: по серии или за всё время.
 * Чистые функции над архивом (archive.ts) — их же гоняет автотест.
 */

import { EGE_NUMBERS, type EgeNo } from '../types';
import type { ArchivedWork } from './archive';

export interface TrendPoint {
  /** «В3» — номер варианта, или дата для работ вне серии. */
  label: string;
  finishedAt: number;
  /** Тестовый балл, если он есть у работы; иначе процент. */
  value: number;
  test: boolean;
  primary: number;
  max: number;
}

export interface NumberStat {
  egeNumber: EgeNo;
  /** Сколько раз задание встречалось в завершённых работах. */
  total: number;
  right: number;
  /** Доля верных, 0–1; null — задания не было. */
  rate: number | null;
  /** Среднее время, секунды; null — задания не было. */
  avgSeconds: number | null;
}

export interface Stats {
  works: number;
  trend: TrendPoint[];
  numbers: NumberStat[];
  /** Слабые номера: решаемость ниже порога, худшие сначала. */
  weak: NumberStat[];
}

/** Ниже этой решаемости номер считается слабым. */
export const WEAK_RATE = 0.6;

/** Работы одной серии (партии) или все — по времени завершения. */
export function computeStats(
  works: readonly ArchivedWork[],
  code: string | null = null,
  /** Подпись точки графика; не задана — «В3» в серии, дата вне серии. */
  label?: (w: ArchivedWork) => string,
): Stats {
  const list = works
    .filter((w) => code === null || w.code === code)
    .slice()
    .sort((a, b) => a.finishedAt - b.finishedAt);
  const trend: TrendPoint[] = list.map((w) => ({
    label:
      label !== undefined
        ? label(w)
        : code === null
          ? new Date(w.finishedAt).toLocaleDateString('ru-RU', { day: '2-digit', month: '2-digit' })
          : `В${w.variant}`,
    finishedAt: w.finishedAt,
    value: w.test ?? (w.max === 0 ? 0 : Math.round((w.primary / w.max) * 100)),
    test: w.test !== null,
    primary: w.primary,
    max: w.max,
  }));
  const numbers: NumberStat[] = EGE_NUMBERS.map((n) => {
    let total = 0;
    let right = 0;
    let seconds = 0;
    for (const w of list) {
      for (const t of w.tasks) {
        if (t.egeNumber !== n) continue;
        total += 1;
        if (t.right) right += 1;
        seconds += t.seconds;
      }
    }
    return {
      egeNumber: n,
      total,
      right,
      rate: total === 0 ? null : right / total,
      avgSeconds: total === 0 ? null : Math.round(seconds / total),
    };
  });
  const weak = numbers
    .filter((s) => s.rate !== null && s.rate < WEAK_RATE)
    .sort((a, b) => (a.rate ?? 0) - (b.rate ?? 0) || a.egeNumber - b.egeNumber);
  return { works: list.length, trend, numbers, weak };
}

/** Уровень клетки тепловой карты (1–5) по доле верных. */
export function heatLevel(rate: number): 1 | 2 | 3 | 4 | 5 {
  if (rate >= 0.9) return 5;
  if (rate >= 0.7) return 4;
  if (rate >= 0.5) return 3;
  if (rate >= 0.3) return 2;
  return 1;
}
