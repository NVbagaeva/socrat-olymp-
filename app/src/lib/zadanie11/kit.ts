/**
 * Строительные блоки разборов и подсказок задания №11.
 *
 * Разбор каждого подтипа — пять этапов с подписями; подсказка —
 * цепочка вопросов с кнопками. Здесь общие куски: вопрос с
 * перемешанными вариантами, решение квадратного уравнения с
 * отбором корня, подбор множителей для x(x + d) = S.
 */

import type { Etap, HintStep, Params, Tablitsa } from './types';
import { d, fq, gcd, isqrt, q, val, type Q } from './num';

/* ── Параметры ──────────────────────────────────────────────────── */

export function num(p: Params, key: string): number {
  const v = p[key];
  if (typeof v !== 'number' || !Number.isFinite(v)) {
    throw new Error(`параметр ${key}: ожидалось число, пришло ${String(v)}`);
  }
  return v;
}

/** Элемент массива по индексу; выход за границы — ошибка. */
export function at<T>(items: readonly T[], i: number): T {
  const v = items[i];
  if (v === undefined) {
    throw new Error(`нет элемента ${i}`);
  }
  return v;
}

/** Значение словаря по ключу; нет ключа — ошибка. */
export function key<T>(rec: Readonly<Record<string, T>>, k: string): T {
  const v = rec[k];
  if (v === undefined) {
    throw new Error(`нет ключа ${k}`);
  }
  return v;
}

export function str<T extends string>(p: Params, key: string, allowed: readonly T[]): T {
  const v = p[key] ?? allowed[0];
  if (typeof v !== 'string' || !allowed.includes(v as T)) {
    throw new Error(
      `параметр ${key}: ожидалось одно из ${allowed.join(', ')}, пришло ${String(v)}`,
    );
  }
  return v as T;
}

/* ── Этапы ──────────────────────────────────────────────────────── */

export function etap(no: number, title: string, lines: string[]): Etap {
  return { title: `Шаг ${no}. ${title}`, lines };
}

/** Собрать этапы по порядку: номера ставятся сами. */
export function etapy(...items: Array<[string, string[]] | null | false>): Etap[] {
  return items
    .filter((x): x is [string, string[]] => Array.isArray(x))
    .map(([title, lines], i) => etap(i + 1, title, lines));
}

/** Таблица без особого порядка столбцов (клиенты банка и т. п.). */
export function tablitsa(head: string[], rows: string[][], title?: string): Tablitsa {
  return title ? { vid: 'prochee', title, head, rows } : { vid: 'prochee', head, rows };
}

/** Шапка таблицы движения: S | v | t. */
export const HEAD_DVIZHENIE = ['', '$S$, км', '$v$, км/ч', '$t$, ч'];
/** Шапка без единиц — когда путь принят за 1. */
export const HEAD_DVIZHENIE_1 = ['', '$S$', '$v$', '$t$'];

/** Таблица движения. Строка: [участник, S, v, t] — ячейки TeX без долларов. */
export function dvizhenie(
  rows: Array<[string, string, string, string]>,
  head = HEAD_DVIZHENIE,
  title?: string,
): Tablitsa {
  const t: Tablitsa = {
    vid: 'dvizhenie',
    head,
    rows: rows.map(([label, S, v, tt]) => [label, `$${S}$`, `$${v}$`, `$${tt}$`]),
  };
  return title ? { ...t, title } : t;
}

/** Таблица работы. Строка: [участник, A, p, t]. Единицы — в шапке. */
export function rabota(
  rows: Array<[string, string, string, string]>,
  units: [string, string, string] = ['', '', ''],
): Tablitsa {
  const [ua, up, ut] = units;
  return {
    vid: 'rabota',
    head: ['', `$A$${ua}`, `$p$${up}`, `$t$${ut}`],
    rows: rows.map(([label, A, pp, tt]) => [label, `$${A}$`, `$${pp}$`, `$${tt}$`]),
  };
}

/** Подписи строк развёрнутой таблицы концентрации. */
export const STROKI_KONC = [
  '$m_{\\text{в.в.}}$ — масса вещества',
  '$m_{\\text{р-ра}}$ — масса раствора',
  '$p\\,\\%$ — концентрация',
];

export interface Stolbets {
  /** Подпись столбца — римскими цифрами: «I», «II», «I + II», «вода», «I + вода», «I*». */
  label: string;
  /** Масса вещества, TeX. */
  mvv: string;
  /** Масса раствора (смеси, сплава), TeX. */
  mr: string;
  /** Концентрация в процентах, TeX (без знака %). */
  p: string;
}

/**
 * Развёрнутая таблица концентрации: строки m_в.в. (масса вещества),
 * m_р-ра (масса раствора), p % (концентрация) — с расшифровкой в
 * подписи строки; столбцы — участники смешивания римскими цифрами
 * (I, II, I + II, вода, I + II + вода; для равных масс I*, II*,
 * I* + II*). Методика — docs/zadanie-11/metodika.md.
 */
export function koncentraciya(cols: Stolbets[], title?: string): Tablitsa {
  const [r1, r2, r3] = STROKI_KONC as [string, string, string];
  const t: Tablitsa = {
    vid: 'koncentraciya',
    head: ['', ...cols.map((c) => c.label)],
    rows: [
      [r1, ...cols.map((c) => `$${c.mvv}$`)],
      [r2, ...cols.map((c) => `$${c.mr}$`)],
      [r3, ...cols.map((c) => `$${c.p}$`)],
    ],
  };
  return title ? { ...t, title } : t;
}

/* ── Подсказки ──────────────────────────────────────────────────── */

function hash(s: string): number {
  let h = 0x811c9dc5;
  for (const ch of s) {
    h ^= ch.codePointAt(0) ?? 0;
    h = Math.imul(h, 0x01000193) >>> 0;
  }
  return h;
}

/**
 * Вопрос подсказки. Верный вариант и неверные перемешиваются
 * детерминированно (по тексту вопроса): у одной задачи порядок
 * кнопок всегда один. Повторы среди неверных выбрасываются.
 */
export function vopros(
  question: string,
  right: string,
  wrong: string[],
  comment?: string,
): HintStep {
  const uniq = [...new Set(wrong.filter((w) => w !== right))].slice(0, 3);
  const all = [right, ...uniq];
  let seed = hash(question + right);
  for (let i = all.length - 1; i > 0; i -= 1) {
    seed = Math.imul(seed ^ (seed >>> 15), 0x2c1b3c6d) >>> 0;
    const j = seed % (i + 1);
    const tmp = at(all, i);
    all[i] = at(all, j);
    all[j] = tmp;
  }
  const step: HintStep = { question, options: all, correct: all.indexOf(right) };
  if (comment) {
    step.comment = comment;
  }
  return step;
}

/** Вопрос «что спрашивают» — последний шаг почти всех подсказок. */
export function chtoSprashivayut(right: string, wrong: string[], comment?: string): HintStep {
  return vopros('Что именно спрашивают в задаче?', right, wrong, comment);
}

/* ── Решение квадратного уравнения ─────────────────────────────── */

export interface Kvadrat {
  /** Строки решения с формулами. */
  lines: string[];
  /** Корни по возрастанию (рациональные). */
  roots: [Q, Q];
  /** Уравнение после сокращения: TeX без долларов. */
  tex: string;
  /** Уравнение до сокращения — с него начинается запись решения. */
  ishodnoe: string;
}

/** Многочлен ax² + bx + c в TeX. */
export function poly(a: number, b: number, c: number, x = 'x'): string {
  const term = (k: number, v: string, first: boolean): string => {
    if (k === 0) {
      return '';
    }
    const sign = k < 0 ? '-' : first ? '' : '+';
    const abs = Math.abs(k);
    const coef = abs === 1 && v !== '' ? '' : d(abs);
    return `${sign}${coef}${v}`;
  };
  let s = term(a, `${x}^2`, true);
  s += term(b, x, s === '');
  s += term(c, '', s === '');
  return s === '' ? '0' : s;
}

/** Разложение числа на множители для «большого» дискриминанта. */
function razlozhenie(D: number): string | null {
  if (D < 10_000) {
    return null;
  }
  const r = isqrt(D);
  if (r === null) {
    return null;
  }
  /* D = (k·m)²: показываем как k²·m², где k — степень 10 или 2 и 5. */
  for (const k of [100, 50, 40, 30, 20, 10, 5, 4, 3, 2]) {
    if (r % k === 0 && r / k > 1) {
      return `${d(k * k)}\\cdot${d((r / k) ** 2)}=(${d(k)}\\cdot${d(r / k)})^2=${d(r)}^2`;
    }
  }
  return null;
}

/**
 * Решить ax² + bx + c = 0 с целыми коэффициентами: сначала делим на
 * общий множитель, затем дискриминант. Ожидается, что корни
 * рациональные (задачи банка и генератор так устроены).
 */
export function kvadrat(a0: number, b0: number, c0: number, x = 'x'): Kvadrat {
  let a = a0;
  let b = b0;
  let c = c0;
  const lines: string[] = [];
  if (a < 0) {
    a = -a;
    b = -b;
    c = -c;
  }
  const ishodnoe = `${poly(a, b, c, x)}=0`;
  const g = gcd(gcd(a, b), c);
  if (g > 1) {
    lines.push(`Делим обе части на $${d(g)}$: $${poly(a / g, b / g, c / g, x)}=0$.`);
    a /= g;
    b /= g;
    c /= g;
  }
  const tex = `${poly(a, b, c, x)}=0`;
  if (c === 0) {
    lines.push(`Выносим $${x}$: $${x}(${poly(0, a, b, x)})=0$.`);
    const other = q(-b, a);
    const roots: [Q, Q] = val(other) < 0 ? [other, q(0)] : [q(0), other];
    return { lines, roots, tex, ishodnoe };
  }
  if (b === 0) {
    const r2 = q(-c, a);
    lines.push(`$${x}^2=${fq(r2)}$.`);
    const top = isqrt(r2.n);
    const bottom = isqrt(r2.m);
    if (top === null || bottom === null) {
      throw new Error(`корень не рациональный: ${tex}`);
    }
    const r = q(top, bottom);
    lines.push(`$${x}=\\pm${fq(r)}$.`);
    return { lines, roots: [q(-top, bottom), r], tex, ishodnoe };
  }
  const D = b * b - 4 * a * c;
  const sqrtD = isqrt(D);
  if (sqrtD === null) {
    throw new Error(`дискриминант не квадрат: ${tex}, D=${D}`);
  }
  const big = razlozhenie(D);
  lines.push(
    `$D=${b < 0 ? `(${d(b)})` : d(b)}^2-4\\cdot${d(a)}\\cdot${c < 0 ? `(${d(c)})` : d(c)}=${d(D)}${big ? `=${big}` : ''}$, $\\sqrt{D}=${d(sqrtD)}$.`,
  );
  const r1 = q(-b - sqrtD, 2 * a);
  const r2 = q(-b + sqrtD, 2 * a);
  lines.push(
    `$${x}_1=\\dfrac{${d(-b)}-${d(sqrtD)}}{${d(2 * a)}}=${fq(r1, true)}$, $${x}_2=\\dfrac{${d(-b)}+${d(sqrtD)}}{${d(2 * a)}}=${fq(r2, true)}$.`,
  );
  return { lines, roots: [r1, r2], tex, ishodnoe };
}

/**
 * Подбор для x(x + d) = S: два множителя S с разностью d. Возвращает
 * x (положительный) и строку лайфхака.
 */
export function podbor(S: number, dd: number, x = 'x'): { x: number; line: string } {
  for (let k = 1; k * k <= S + dd * dd; k += 1) {
    if (k * (k + dd) === S) {
      return {
        x: k,
        line: `Подбираем два множителя числа $${d(S)}$, которые отличаются на $${d(dd)}$: $${d(S)}=${d(k)}\\cdot${d(k + dd)}$, значит, $${x}=${d(k)}$.`,
      };
    }
  }
  throw new Error(`x(x+${dd})=${S}: целого корня нет`);
}

/**
 * Уравнение вида x(x + d) = S: решение подбором множителей,
 * обоснование, что других подходящих корней нет (теорема Виета), и
 * проверка дискриминантом. Возвращает строки, оба корня и
 * положительный корень.
 */
export function xxd(
  S: number,
  dd: number,
  x = 'x',
): { lines: string[]; roots: number[]; root: number } {
  const guess = podbor(S, dd, x);
  const sol = kvadrat(1, dd, -S, x);
  const vtoroy = -(guess.x + dd);
  return {
    lines: [
      `$${x}(${x}+${d(dd)})=${d(S)}$, то есть $${poly(1, dd, -S, x)}=0$.`,
      `**Лайфхак:** ${guess.line}`,
      `**Других подходящих корней нет:** по теореме Виета $${x}_1\\cdot ${x}_2=-${d(S)}$, поэтому второй корень $${x}_2=-\\dfrac{${d(S)}}{${d(guess.x)}}=${d(vtoroy)}<0$.`,
      `Проверка дискриминантом: $${sol.ishodnoe}$.`,
      ...sol.lines,
    ],
    roots: [vtoroy, guess.x],
    root: guess.x,
  };
}

/* ── Дробно-рациональные уравнения: ОДЗ и отбор корней ─────────── */

export interface Drobnoe {
  /** Значения переменной, при которых знаменатель равен нулю. */
  nuli: number[];
  /** По смыслу задачи: x > lo (и x < hi, если задано). */
  lo: number;
  hi?: number;
  /** Почему: «скорость положительна». */
  pochemu: string;
  /** Дополнительное условие из текста задачи (ДП-12: «больше 48»). */
  uslovie?: { bolshe: number; text: string };
  /** Общий знаменатель в TeX — на него умножаем обе части. */
  znamenatel: string;
  /** Строки решения после умножения на знаменатель. */
  posle: string[];
  /** Все корни целого уравнения. */
  roots: number[];
  x?: string;
}

export interface DrobnoeEtapy {
  odz: [string, string[]];
  reshenie: [string, string[]];
  /** Строки шага «Отбор корней»: вердикт по каждому корню. */
  otbor: string[];
  /** Подходящий корень. */
  root: number;
  /** Вопросы подсказки: «Какие значения x недопустимы?», «Какой корень подходит?». */
  hintOdz: HintStep;
  hintKoren: HintStep;
}

/** «$x\ne0$, $x\ne-3$» */
function zaprety(nuli: number[], x: string): string {
  return [...new Set(nuli)]
    .sort((a, b) => Math.abs(a) - Math.abs(b) || a - b)
    .map((v) => `$${x}\\ne${d(v)}$`)
    .join(', ');
}

/**
 * Шаги дробно-рационального уравнения по методике: ОДЗ отдельной
 * строкой (знаменатели не равны нулю) и условие по смыслу задачи;
 * умножение на общий знаменатель — «≠ 0 (по ОДЗ)», без знака
 * равносильности; отбор корней — по ОДЗ и по смыслу, с вердиктом по
 * каждому корню. Подходить должен ровно один корень.
 */
export function drobnoe(o: Drobnoe): DrobnoeEtapy {
  const x = o.x ?? 'x';
  const smysl = o.hi === undefined ? `$${x}>${d(o.lo)}$` : `$${d(o.lo)}<${x}<${d(o.hi)}$`;
  const odz: [string, string[]] = [
    'ОДЗ',
    [
      `**ОДЗ** (область допустимых значений): ${zaprety(o.nuli, x)} — знаменатели не равны нулю.`,
      `**По смыслу задачи:** ${smysl} — ${o.pochemu}.${o.uslovie ? ` По условию ещё $${x}>${d(o.uslovie.bolshe)}$ (${o.uslovie.text}).` : ''}`,
    ],
  ];
  const reshenie: [string, string[]] = [
    'Решение',
    [`Умножим обе части на $${o.znamenatel}\\ne0$ (по ОДЗ):`, ...o.posle],
  ];
  const otbor: string[] = ['Проверяем каждый корень по ОДЗ и по смыслу задачи.'];
  const podhodyat: number[] = [];
  for (const r of [...new Set(o.roots.map((v) => Math.round(v * 1e9) / 1e9))]) {
    const pref = `$${x}=${d(r)}$`;
    if (o.nuli.some((v) => Math.abs(v - r) < 1e-9)) {
      otbor.push(`${pref} — не входит в ОДЗ: знаменатель обращается в ноль. Отбрасываем.`);
    } else if (!(r > o.lo) || (o.hi !== undefined && !(r < o.hi))) {
      otbor.push(
        `${pref} — входит в ОДЗ, но не подходит по смыслу задачи: нужно ${smysl}. Отбрасываем.`,
      );
    } else if (o.uslovie && !(r > o.uslovie.bolshe)) {
      otbor.push(
        `${pref} — входит в ОДЗ, но не подходит по условию задачи: нужно $${x}>${d(o.uslovie.bolshe)}$. Отбрасываем.`,
      );
    } else {
      otbor.push(`${pref} — входит в ОДЗ и подходит по смыслу задачи.`);
      podhodyat.push(r);
    }
  }
  if (podhodyat.length !== 1) {
    throw new Error(`отбор корней: подходит ${podhodyat.length} корней из ${o.roots.join(', ')}`);
  }
  const root = podhodyat[0] as number;
  const pravilno = zaprety(o.nuli, x);
  const hintOdz = vopros(
    `Какие значения $${x}$ недопустимы?`,
    pravilno,
    [
      zaprety(
        o.nuli.map((v) => (v === 0 ? 0 : -v)),
        x,
      ),
      ...(o.nuli.length > 1 ? [zaprety([o.nuli[0] as number], x)] : []),
      'ограничений нет',
    ],
    'ОДЗ: знаменатели дробей не равны нулю.',
  );
  const drugie = o.roots.filter((r) => Math.abs(r - root) > 1e-9).map((r) => `$${x}=${d(r)}$`);
  const hintKoren = vopros(
    'Какой корень подходит?',
    `$${x}=${d(root)}$`,
    [...drugie, 'оба корня'],
    `Проверяем по ОДЗ и по смыслу задачи: ${smysl}.`,
  );
  return { odz, reshenie, otbor, root, hintOdz, hintKoren };
}
