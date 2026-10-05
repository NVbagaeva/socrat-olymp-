/**
 * Общие кирпичи генераторов задания №2: формулировки ФИПИ, шаги
 * разбора с заголовками, случайные векторы.
 *
 * Язык шагов один на теорию, подсказки тренажёра и лист учителя:
 * координаты по рисунку читаются через катеты («катет по
 * горизонтали — 3 клетки, конец левее начала: из меньшего вычитаем
 * большее ⇒ x = 1 − 4 = −3»), знак координаты объясняется словами,
 * а не стоит на рисунке. Все формулы — в $…$ для KaTeX.
 */

import type { Rng } from '../../veroyatnost/generator';
import { counted } from '../../plural';
import { keys, paramsKey } from '../../vychisleniya/prototypes/common';
import { d, kombinatsiya, kv, kvadrat, modul, mnozhitel, slagaemoe, vec, vecKv } from '../tex';
import { dlina, kosoy } from '../troyki';
import type { Shag, Tochka, Vektor } from '../types';

export { keys, paramsKey };

/* ── Формулировки ───────────────────────────────────────────────── */

function perechen(items: string[]): string {
  if (items.length === 1) {
    return items[0] as string;
  }
  return `${items.slice(0, -1).join(', ')} и ${items[items.length - 1]}`;
}

/** «Даны векторы $\vec{a}(6;\ -8)$ и $\vec{b}(1;\ 4)$.» */
export function dany(vectors: readonly (readonly [string, Tochka])[]): string {
  return `Даны векторы ${perechen(vectors.map(([n, p]) => `$${vecKv(n, p)}$`))}.`;
}

/** «На координатной плоскости изображены векторы $\vec{a}$ и $\vec{b}$, координатами которых являются целые числа.» */
export function izobrazheny(names: readonly string[]): string {
  return `На координатной плоскости изображены векторы ${perechen(names.map((n) => `$${vec(n)}$`))}, координатами которых являются целые числа.`;
}

/** «Найдите длину вектора $…$.» */
export function naydiDlinu(tex: string): string {
  return `Найдите длину вектора $${tex}$.`;
}

/** «Найдите скалярное произведение $\vec{a}\cdot\vec{b}$.» */
export function naydiSkalyarnoe(tex: string): string {
  return `Найдите скалярное произведение $${tex}$.`;
}

/** «Найдите значение выражения $…$.» */
export function naydiZnachenie(tex: string): string {
  return `Найдите значение выражения $${tex}$.`;
}

/* ── Шаги разбора ───────────────────────────────────────────────── */

export function koordinaty(v: Vektor): Tochka {
  return [v.to[0] - v.from[0], v.to[1] - v.from[1]];
}

function kletok(n: number): string {
  return counted(n, 'клетка', 'клетки', 'клеток');
}

/** Чтение координат одного вектора с рисунка — через катеты и знак. */
export function strokiKoordinat(v: Vektor): string[] {
  const [x1, y1] = v.from;
  const [x2, y2] = v.to;
  const dx = x2 - x1;
  const dy = y2 - y1;
  const out: string[] = [];
  if (dx === 0) {
    out.push(`По горизонтали смещения нет ⇒ $x = 0$.`);
  } else if (dx > 0) {
    out.push(
      `Катет по горизонтали — ${kletok(dx)}. Конец правее начала: из большего вычитаем меньшее ⇒ $x = ${mnozhitel(x2)} - ${mnozhitel(x1)} = ${d(dx)}$.`,
    );
  } else {
    out.push(
      `Катет по горизонтали — ${kletok(-dx)}. Конец левее начала: из меньшего вычитаем большее ⇒ $x = ${mnozhitel(x2)} - ${mnozhitel(x1)} = ${d(dx)}$.`,
    );
  }
  if (dy === 0) {
    out.push(`По вертикали смещения нет ⇒ $y = 0$.`);
  } else if (dy > 0) {
    out.push(
      `Катет по вертикали — ${kletok(dy)}. Конец выше начала ⇒ $y = ${mnozhitel(y2)} - ${mnozhitel(y1)} = ${d(dy)}$.`,
    );
  } else {
    out.push(
      `Катет по вертикали — ${kletok(-dy)}. Конец ниже начала ⇒ $y = ${mnozhitel(y2)} - ${mnozhitel(y1)} = ${d(dy)}$.`,
    );
  }
  out.push(`$${vecKv(v.name, [dx, dy])}$.`);
  return out;
}

/** Шаг «Координаты векторов по рисунку». */
export function shagPoRisunku(vectors: readonly Vektor[]): Shag {
  return {
    zagolovok: 'Координаты векторов по рисунку',
    stroki: vectors.flatMap(strokiKoordinat),
  };
}

/** Произведение k·x как слагаемое: «8\cdot 1», «+0», «-0{,}6\cdot(-9)». */
function chlen(k: number, x: number, first: boolean): string {
  const abs = Math.abs(k);
  const sign = k < 0 ? '-' : first ? '' : '+';
  if (abs === 1) {
    return sign + mnozhitel(x);
  }
  return `${sign}${d(abs)}\\cdot${mnozhitel(x)}`;
}

/** Шаг «Координаты вектора 8a + b»: покоординатный счёт. */
export function shagKombinatsiya(
  terms: readonly (readonly [number, string, Tochka])[],
  result: Tochka,
  resultName: string,
): Shag {
  const tex = kombinatsiya(terms.map(([k, n]) => [k, n] as const));
  const ex = terms.map(([k, , p], i) => chlen(k, p[0], i === 0)).join('');
  const ey = terms.map(([k, , p], i) => chlen(k, p[1], i === 0)).join('');
  return {
    zagolovok: `Координаты вектора $${tex}$`,
    stroki: [`$${vec(resultName)} = ${tex} = (${ex};\\ ${ey}) = ${kv(result[0], result[1])}$.`],
  };
}

/** Шаг «Длина по формуле». */
export function shagDlina(name: string, p: Tochka, dlinaValue: number): Shag {
  const [x, y] = p;
  const sum = x * x + y * y;
  return {
    zagolovok: 'Длина по формуле',
    stroki: [
      `$${modul(vec(name))} = \\sqrt{x^2 + y^2}$.`,
      `$${modul(vec(name))} = \\sqrt{${kvadrat(x)} + ${kvadrat(y)}} = \\sqrt{${d(x * x)} + ${d(y * y)}} = \\sqrt{${d(sum)}} = ${d(dlinaValue)}$.`,
    ],
  };
}

/** Шаг «Скалярное произведение по координатам». */
export function shagSkalyarnoe(a: readonly [string, Tochka], b: readonly [string, Tochka]): Shag {
  const [an, ap] = a;
  const [bn, bp] = b;
  const px = ap[0] * bp[0];
  const py = ap[1] * bp[1];
  return {
    zagolovok: 'Скалярное произведение по координатам',
    stroki: [
      `$${vec(an)}\\cdot${vec(bn)} = x_1x_2 + y_1y_2$.`,
      `$${vec(an)}\\cdot${vec(bn)} = ${mnozhitel(ap[0])}\\cdot${mnozhitel(bp[0])} + ${mnozhitel(ap[1])}\\cdot${mnozhitel(bp[1])} = ${slagaemoe(px, true)}${slagaemoe(py, false)} = ${d(px + py)}$.`,
    ],
  };
}

/** Последний шаг — ответ. */
export function shagOtvet(otvet: number): Shag {
  return { zagolovok: 'Ответ', stroki: [`$${d(otvet)}$`] };
}

/* ── Случайные векторы ──────────────────────────────────────────── */

export interface VektorOpts {
  /** Вероятность горизонтального или вертикального вектора. */
  pryamoy?: number;
  /** Минимальная длина в клетках. */
  minLen?: number;
}

/** Случайные координаты вектора с |x|, |y| ≤ bound, длиной ≥ 2, чаще косого. */
export function sluchaynyy(r: Rng, bound: number, opts: VektorOpts = {}): Tochka {
  const pryamoy = opts.pryamoy ?? 1 / 8;
  const minLen = opts.minLen ?? 2;
  for (let i = 0; i < 200; i += 1) {
    const x = r.int(-bound, bound);
    const y = r.int(-bound, bound);
    const p: Tochka = [x, y];
    if (dlina(p) < minLen) continue;
    if (!kosoy(p) && r.next() > pryamoy) continue;
    return p;
  }
  return [bound, 1];
}

/** Перемешанная копия списка — детерминированно по seed. */
export function peremeshat<T>(r: Rng, items: readonly T[]): T[] {
  const out = [...items];
  for (let i = out.length - 1; i > 0; i -= 1) {
    const j = r.int(0, i);
    [out[i], out[j]] = [out[j] as T, out[i] as T];
  }
  return out;
}

/** Подпись набора векторов для банка. */
export function signatureOf(vectors: readonly Tochka[]): string {
  return vectors.map((p) => `${p[0]},${p[1]}`).join('|');
}
