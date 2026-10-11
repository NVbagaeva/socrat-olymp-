/**
 * Общие кирпичи групп III и IV: склонение, списки точек, промежутки
 * знаков, неверные числовые варианты для подсказок.
 */

import { ekstremumyUzlov } from '../chtenie';
import { postroit } from '../spline';
import { d } from '../tex';
import type { Pomoshch, Uzel } from '../types';
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

/** Есть ли «площадка»: соседние узлы волны отличаются по высоте меньше чем на 2. */
export function ploskoe(uzly: readonly { y: number }[]): boolean {
  for (let i = 1; i < uzly.length; i += 1) {
    if (Math.abs((uzly[i] as { y: number }).y - (uzly[i - 1] as { y: number }).y) < 2) {
      return true;
    }
  }
  return false;
}

/**
 * n целых из [lo; hi], соседние не ближе gap: равномерно среди всех
 * таких наборов («звёзды и полосы»), без отбраковки. null — не влезают.
 */
export function razbrosat(
  r: { int(a: number, b: number): number },
  lo: number,
  hi: number,
  n: number,
  gap: number,
): number[] | null {
  const span = hi - lo - (n - 1) * (gap - 1);
  if (n < 0 || span + 1 < n) {
    return null;
  }
  const pool = Array.from({ length: span + 1 }, (_, i) => i);
  const vzyato: number[] = [];
  for (let i = 0; i < n; i += 1) {
    const j = r.int(i, pool.length - 1);
    [pool[i], pool[j]] = [pool[j] as number, pool[i] as number];
    vzyato.push(pool[i] as number);
  }
  return vzyato.sort((p, q) => p - q).map((v, i) => lo + v + i * (gap - 1));
}

/** Интервал (a; b) длины shirina: начало координат внутри, концы не дальше 12 от нуля. */
export function intervalShiriny(
  r: { int(a: number, b: number): number },
  shirina: number,
): { a: number; b: number } {
  const lo = Math.max(2, shirina - 12);
  const hi = Math.min(shirina - 2, 12);
  const a = -r.int(lo, Math.max(lo, hi));
  return { a, b: a + shirina };
}

/**
 * Расставить n точек (нули f′ или вершины f) на интервале длины shirina
 * и сдвинуть интервал так, чтобы x = 0 не попал ни на точку, ни в середину
 * своей доли (ближе клетки к середине): там ставятся подписи и знаки,
 * а их загораживает ось y.
 */
export function tochkiSOsyu(
  r: { int(a: number, b: number): number },
  shirina: number,
  n: number,
  gap: number,
  zapasL: number,
  zapasR: number,
  otstup = 2,
): { a: number; b: number; tochki: number[] } | null {
  /* Расстановок с подходящей долей вокруг нуля мало: пробуем несколько.
     Если нет ни одной с отступом otstup — берём запасную с наибольшим
     отступом (x = 0 при этом всё равно не совпадает с точкой); последнее
     слово за проверкой подписей рисунка. */
  let zapas: { a: number; b: number; tochki: number[] } | null = null;
  let zapasOt = -1;
  for (let popytka = 0; popytka < 30; popytka += 1) {
    const rel = razbrosat(r, zapasL, shirina - zapasR, n, gap);
    if (rel === null) {
      return null;
    }
    const gr = [0, ...rel, shirina];
    const po: number[][] = [];
    for (let o = Math.max(2, shirina - 13); o <= Math.min(shirina - 2, 13); o += 1) {
      const i = gr.findIndex((g, j) => g < o && o < (gr[j + 1] as number));
      if (i >= 0) {
        const ot = Math.min(otstup, Math.abs((gr[i] as number) + (gr[i + 1] as number) - 2 * o));
        (po[ot] ??= []).push(o);
      }
    }
    const sdvig = (o: number) => ({ a: -o, b: shirina - o, tochki: rel.map((x) => x - o) });
    for (let ot = otstup; ot > zapasOt; ot -= 1) {
      const kand = po[ot];
      if (kand !== undefined && kand.length > 0) {
        const res = sdvig(kand[r.int(0, kand.length - 1)] as number);
        if (ot === otstup) {
          return res;
        }
        zapas = res;
        zapasOt = ot;
        break;
      }
    }
  }
  return zapas;
}

/**
 * Сдвиг рисунка по x, при котором ответ ans становится равным cel, а
 * интервал (a; b) остаётся вокруг нуля: a ≤ −2, b ≥ 2, концы не дальше 12.
 * null — такого сдвига нет.
 */
export function sdvigPod(cel: number, ans: number, a: number, b: number): number | null {
  const s = cel - ans;
  if (a + s > -2 || b + s < 2 || a + s < -12 || b + s > 12) {
    return null;
  }
  return s;
}

/** Узлы, сдвинутые по x на s. */
export function sdvinut<T extends { x: number; y: number }>(uzly: readonly T[], s: number): T[] {
  return uzly.map((u) => ({ ...u, x: u.x + s }));
}

/**
 * Целевой ответ, равномерно на [lo; hi]. Сумма двух выборок по модулю:
 * у соседних seed первая выборка генератора распределена заметно неровно.
 */
export function celevoy(r: { int(a: number, b: number): number }, lo: number, hi: number): number {
  const m = hi - lo + 1;
  return lo + ((r.int(0, m - 1) + r.int(0, m - 1)) % m);
}

/**
 * Нет «полок»: во всех целых точках интервала, кроме вершин, наклон
 * графика не меньше min по модулю — иначе на глаз неясно, где вершина
 * и какого знака производная.
 */
export function bezPolok(uzly: readonly Uzel[], min: number): boolean {
  const spl = postroit(uzly);
  const vershiny = new Set(ekstremumyUzlov(uzly).map((e) => e.x));
  const a = (uzly[0] as Uzel).x;
  const b = (uzly[uzly.length - 1] as Uzel).x;
  for (let x = a + 1; x < b; x += 1) {
    if (!vershiny.has(x) && Math.abs(spl.dy(x)) < min) {
      return false;
    }
  }
  return true;
}

/**
 * Концы волны круче: перепад до соседнего узла не меньше 0,6 клетки на
 * клетку (но конец не выше 6 по модулю). Длинный конец (от 5 клеток)
 * получает промежуточный узел: иначе сплайн у вершины долго идёт почти
 * горизонтально и выглядит «полкой».
 */
export function krutyeKoncy(uzly: Uzel[]): void {
  if (uzly.length < 2) {
    return;
  }
  for (const levyy of [true, false]) {
    const i = levyy ? 0 : uzly.length - 1;
    const j = levyy ? 1 : uzly.length - 2;
    const end = uzly[i] as Uzel;
    const sosed = uzly[j] as Uzel;
    const L = Math.abs(end.x - sosed.x);
    const dy = end.y - sosed.y;
    if (dy === 0) {
      continue;
    }
    const nado = Math.max(Math.ceil(0.6 * L), L >= 5 ? 4 : 0);
    const y = Math.abs(dy) < nado ? sosed.y + Math.sign(dy) * nado : end.y;
    const yEnd = Math.max(-6, Math.min(6, y));
    uzly[i] = { x: end.x, y: yEnd };
    const D = yEnd - sosed.y;
    if (L >= 5 && Math.abs(D) >= 4) {
      const xm = sosed.x + Math.sign(end.x - sosed.x) * Math.round(0.45 * L);
      const ym =
        sosed.y +
        Math.sign(D) * Math.max(2, Math.min(Math.abs(D) - 2, Math.round(0.4 * Math.abs(D))));
      uzly.splice(levyy ? 1 : uzly.length - 1, 0, { x: xm, y: ym });
    }
  }
}
