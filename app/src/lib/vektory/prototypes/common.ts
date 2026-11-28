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
import { naytiTroyku, risunokPifagora } from '../pifagor';
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

/** Готовое число как слагаемое со знаком коэффициента: «8», «-16», «-(-16)», «+(-3)». */
function gotovyy(k: number, x: number, first: boolean): string {
  const sign = k < 0 ? '-' : first ? '' : '+';
  return sign + (sign === '' ? d(x) : mnozhitel(x));
}

/** Без «-0» и хвостов плавающей арифметики у десятичных коэффициентов. */
function chisto(v: number): number {
  const r = Math.round(v * 1e9) / 1e9;
  return Object.is(r, -0) ? 0 : r;
}

/**
 * Выкладка по строкам: каждый переход «=» — с новой строки, знаки «=»
 * выровнены (aligned). Строка aligned не рвётся посреди выражения.
 */
export function vyravnyat(levo: string, pravye: readonly string[]): string {
  return `$\\begin{aligned}${levo} &= ${pravye.join(' \\\\ &= ')}\\end{aligned}$`;
}

/**
 * Шаг «Координаты вектора c = 8a + b»: покоординатный счёт. `gotovye` —
 * уже найденные отдельными шагами координаты |k|·p каждого слагаемого:
 * тогда в скобках стоят готовые числа, а не произведения.
 */
export function shagKombinatsiya(
  terms: readonly (readonly [number, string, Tochka])[],
  result: Tochka,
  resultName: string,
  gotovye?: readonly Tochka[],
): Shag {
  const tex = kombinatsiya(terms.map(([k, n]) => [k, n] as const));
  const coord = (i: 0 | 1) =>
    terms
      .map(([k, , p], j) =>
        gotovye === undefined
          ? chlen(k, p[i], j === 0)
          : gotovyy(k, (gotovye[j] as Tochka)[i], j === 0),
      )
      .join('');
  return {
    zagolovok: `Координаты вектора $${vec(resultName)} = ${tex}$`,
    stroki: [
      vyravnyat(vec(resultName), [tex, `(${coord(0)};\\ ${coord(1)})`, kv(result[0], result[1])]),
    ],
  };
}

/**
 * Шаги для вектора-комбинации: сначала координаты каждого вектора с
 * коэффициентом (8b; у 3a + 2b — и 3a, и 2b) отдельными шагами, потом
 * сама комбинация из готовых чисел. Без коэффициентов — один шаг.
 */
export function shagiKombinatsii(
  terms: readonly (readonly [number, string, Tochka])[],
  result: Tochka,
  resultName: string,
): Shag[] {
  const shagi: Shag[] = [];
  const gotovye = terms.map(([k, name, p]) => {
    const abs = Math.abs(k);
    if (abs === 1) {
      return p;
    }
    const kp: Tochka = [chisto(abs * p[0]), chisto(abs * p[1])];
    const tex = `${d(abs)}${vec(name)}`;
    shagi.push({
      zagolovok: `Координаты $${tex}$`,
      stroki: [
        vyravnyat(tex, [
          `(${d(abs)}\\cdot${mnozhitel(p[0])};\\ ${d(abs)}\\cdot${mnozhitel(p[1])})`,
          kv(kp[0], kp[1]),
        ]),
      ],
    });
    return kp;
  });
  shagi.push(shagKombinatsiya(terms, result, resultName, shagi.length > 0 ? gotovye : undefined));
  return shagi;
}

function napravlenie(v: number, os: 'x' | 'y'): string {
  if (os === 'x') return v < 0 ? 'влево' : 'вправо';
  return v < 0 ? 'вниз' : 'вверх';
}

/** «в 2 раза», «в 5 раз», «в 0,5 раза». */
function razOkonchanie(k: number): string {
  if (!Number.isInteger(k)) return 'раза';
  const n10 = k % 10;
  const n100 = k % 100;
  return n10 >= 2 && n10 <= 4 && (n100 < 12 || n100 > 14) ? 'раза' : 'раз';
}

/**
 * Шаг «Длина по формуле»: рисунок с треугольником Пифагора (svg),
 * откуда формула и почему пропадает минус, выкладка по строкам и —
 * если модули координат пропорциональны пифагоровой тройке (3-4-5,
 * 5-12-13, 8-15-17…) — быстрый путь без корня.
 */
export function shagDlina(name: string, p: Tochka, dlinaValue: number): Shag {
  const [x, y] = p;
  const m = modul(vec(name));
  const stroki: string[] = [];
  const kosoy = x !== 0 && y !== 0;
  if (kosoy) {
    stroki.push(
      `Знак координаты показывает только направление: $x = ${d(x)}$ — ${napravlenie(x, 'x')}, $y = ${d(y)}$ — ${napravlenie(y, 'y')}. Длины катетов — модули координат: $${d(Math.abs(x))}$ и $${d(Math.abs(y))}$.`,
    );
    const otr = [x, y].find((v) => v < 0);
    stroki.push(
      `Длина вектора — гипотенуза, поэтому формула — теорема Пифагора: $${m}^2 = x^2 + y^2$.` +
        (otr === undefined
          ? ''
          : ` При возведении в квадрат знак пропадает: $${kvadrat(otr)} = ${kvadrat(Math.abs(otr))}$.`),
    );
  }
  stroki.push(
    vyravnyat(m, [
      '\\sqrt{x^2 + y^2}',
      `\\sqrt{${kvadrat(x)} + ${kvadrat(y)}}`,
      `\\sqrt{${d(chisto(x * x))} + ${d(chisto(y * y))}}`,
      `\\sqrt{${d(chisto(x * x + y * y))}}`,
      d(dlinaValue),
    ]),
  );
  const t = kosoy ? naytiTroyku(x, y) : null;
  if (t !== null) {
    const [a, b, c] = t.troyka;
    const egip = a === 3;
    const imya = `${egip ? 'египетский треугольник' : 'пифагорова тройка'} $${a}$-$${b}$-$${c}$`;
    const ax = d(Math.abs(x));
    const ay = d(Math.abs(y));
    stroki.push(
      t.k === 1
        ? `**Быстрый путь.** Катеты $${ax}$ и $${ay}$ — ${imya}. Значит, длина $${c}$ сразу, без корня.`
        : `**Быстрый путь.** Катеты $${ax}$ и $${ay}$ — это $${d(t.k)}\\cdot${t.p}$ и $${d(t.k)}\\cdot${t.q}$: ${imya}, ${egip ? 'увеличенный' : 'увеличенная'} в $${d(t.k)}$ ${razOkonchanie(t.k)}. Значит, длина $${d(t.k)}\\cdot${c} = ${d(dlinaValue)}$ сразу, без корня.`,
    );
  }
  return {
    zagolovok: 'Длина по формуле',
    stroki,
    ...(kosoy ? { svg: risunokPifagora(name, p, dlinaValue) } : {}),
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
