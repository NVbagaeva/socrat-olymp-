/**
 * Общие кирпичи групп III и IV: склонение, списки точек, промежутки
 * знаков, неверные числовые варианты для подсказок.
 */

import { d } from '../tex';
import type { Pomoshch } from '../types';
import type { Nevernyy } from './common';

/** «точка / точки / точек» по числу. */
export function tochek(n: number): string {
  const m10 = n % 10;
  const m100 = n % 100;
  if (m10 === 1 && m100 !== 11) {
    return 'точка';
  }
  if (m10 >= 2 && m10 <= 4 && !(m100 >= 12 && m100 <= 14)) {
    return 'точки';
  }
  return 'точек';
}

/** Число в скобках, если оно отрицательно: для записи «b − (a) − 1». */
export function skobki(v: number): string {
  return v < 0 ? `(${d(v)})` : d(v);
}

/** Список отмеченных точек по номерам с нуля: «$x_1,\ x_3$». */
export function xSpisok(idx: readonly number[]): string {
  if (idx.length === 0) {
    return 'Ни в одной';
  }
  return `$${idx.map((i) => `x_{${i + 1}}`).join(',\\ ')}$`;
}

/** Список чисел в одной формуле: «$-3,\ 2$». */
export function chislaSpisok(xs: readonly number[]): string {
  return `$${xs.map((x) => d(x)).join(',\\ ')}$`;
}

/** Список равенств «x = 2, x = 5». */
export function xRavno(xs: readonly number[]): string {
  return xs.map((x) => `$x=${d(x)}$`).join(', ');
}

export interface Promezhutok {
  lo: number;
  hi: number;
  znak: 1 | -1;
}

/** Промежутки между границами со знаком, заданным функцией от середины. */
export function promezhutki(
  granicy: readonly number[],
  znakV: (mid: number) => number,
): Promezhutok[] {
  const out: Promezhutok[] = [];
  for (let i = 0; i < granicy.length - 1; i += 1) {
    const lo = granicy[i] as number;
    const hi = granicy[i + 1] as number;
    const s = znakV((lo + hi) / 2);
    out.push({ lo, hi, znak: s >= 0 ? 1 : -1 });
  }
  return out;
}

/** Знаки на промежутках как вспомогательные построения. */
export function znakiPomoshch(ps: readonly Promezhutok[], shag: number): Pomoshch[] {
  return ps.map((p): Pomoshch => ({ t: 'znak', x0: p.lo, x1: p.hi, znak: p.znak, shag }));
}

/**
 * Неверные числовые варианты: сначала заданные причины, затем соседние
 * числа с общей пометкой. Не больше трёх, ни один не совпадает с ответом.
 */
export function neverniyeChisla(
  otvet: number,
  kandidaty: readonly { v: number; w: string }[],
  lo = 0,
): Nevernyy[] {
  const out: Nevernyy[] = [];
  const seen = new Set<number>([otvet]);
  const add = (v: number, w: string): void => {
    if (!seen.has(v) && Number.isFinite(v) && v >= lo) {
      seen.add(v);
      out.push({ tekst: `$${d(v)}$`, pochemu: w });
    }
  };
  for (const c of kandidaty) {
    add(c.v, c.w);
  }
  for (const dv of [1, -1, 2, -2, 3]) {
    add(otvet + dv, 'Пересчитайте по рисунку: в подсчёте потеряна или добавлена лишняя точка.');
  }
  return out.slice(0, 3);
}

/** Знак числа словом для текста разбора. */
export function slovoZnaka(s: 1 | -1, kogda: 'proizv' | 'funk' = 'proizv'): string {
  if (kogda === 'funk') {
    return s > 0 ? 'возрастает' : 'убывает';
  }
  return s > 0 ? 'положительна' : 'отрицательна';
}
