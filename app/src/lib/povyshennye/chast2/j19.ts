/**
 * №19 (варианты 17–18): cos ax = C имеет на отрезке [mπ; nπ] ровно K корней.
 *
 * cos чётен — число корней при a и −a одинаково; при a = 0 корней нет
 * (C ≠ 1). При a > 0, y = ax: корни cos y = C на [amπ; anπ], y = ±θ + 2πj,
 * θ = arccos C. Число корней меняется, только когда конец отрезка проходит
 * через корень: a = (2πj ± θ)/(Mπ), M ∈ {m, n}. Перебираем точки излома
 * по возрастанию (оценка θ ∈ (θ₁; θ₂) из условия позволяет их сравнить)
 * и находим, где корней ровно K.
 */

import type { Kusok, Mnozhestvo } from '@/lib/chast2/sravnenie';
import type { Chast2Zadacha, Shablon2 } from './types';

export interface PJ19 {
  /** C (0 < C < 1), запись с запятой. */
  C: number;
  /** Оценка arccos C ∈ (t1; t2). */
  t1: number;
  t2: number;
  /** Отрезок [mπ; nπ]. */
  m: number;
  n: number;
  K: number;
}

interface Izl {
  /** a = (2j + σθ/π)/M. */
  j: number;
  sg: 1 | -1;
  M: number;
  v: number;
}

export function schet(a: number, p: PJ19): number {
  if (a === 0) return 0;
  const th = Math.acos(p.C);
  const A = Math.abs(a);
  const lo = A * p.m * Math.PI;
  const hi = A * p.n * Math.PI;
  let k = 0;
  const jMin = Math.floor((lo - th) / (2 * Math.PI)) - 1;
  const jMax = Math.ceil((hi + th) / (2 * Math.PI)) + 1;
  for (let j = jMin; j <= jMax; j += 1)
    for (const s of [1, -1]) {
      const y = s * th + 2 * Math.PI * j;
      if (y >= lo - 1e-12 && y <= hi + 1e-12) k += 1;
    }
  return k;
}

export function chislaJ19(p: PJ19) {
  const th = Math.acos(p.C);
  if (!(p.t1 < th && th < p.t2)) throw new Error('j19: оценка');
  /* Точки излома при a > 0 до заведомо большого a. */
  const aMax = (2 * (p.K + 4)) / (p.n - p.m);
  const izl: Izl[] = [];
  for (const M of [p.m, p.n]) {
    if (M === 0) continue;
    for (let j = -60; j <= 60; j += 1)
      for (const sg of [1, -1] as const) {
        const v = (2 * Math.PI * j + sg * th) / (M * Math.PI);
        if (v > 1e-12 && v <= aMax) izl.push({ j, sg, M, v });
      }
  }
  izl.sort((x, y) => x.v - y.v);
  /* Атомы: интервалы (z_{i−1}; z_i) и точки z_i; склеиваем подходящие. */
  type K = { lo: Izl | null; hi: Izl | null; loZ: boolean; hiZ: boolean };
  const kuski: K[] = [];
  let tek: K | null = null;
  let prev: Izl | null = null;
  for (const z of izl) {
    const a0 = prev === null ? 0 : prev.v;
    const okInt = schet((a0 + z.v) / 2, p) === p.K;
    const okT = schet(z.v, p) === p.K;
    if (okInt && tek === null) tek = { lo: prev, hi: null, loZ: false, hiZ: false };
    if (!okInt && tek !== null) {
      kuski.push(tek);
      tek = null;
    }
    if (tek !== null) {
      tek.hi = z;
      tek.hiZ = okT;
      if (!okT) {
        kuski.push(tek);
        tek = null;
      }
    } else if (okT) {
      tek = { lo: z, hi: z, loZ: true, hiZ: true };
    }
    prev = z;
  }
  if (tek !== null) throw new Error('j19: незамкнутый интервал');
  for (const q of kuski) if (q.lo === null || q.hi === null) throw new Error('j19: конец 0');
  if (kuski.length === 0) throw new Error('j19: пусто');
  return { th, kuski };
}

const dec = (x: number) => String(x).replace('.', '{,}');
const api = (m: number) => (m === 1 ? 'a\\pi' : m === -1 ? '-a\\pi' : m === 0 ? '0' : `${m}a\\pi`);

function izlTex(z: Izl, C: number): string {
  /* (2πj + σθ)/(Mπ) = 2j/M + σθ/(Mπ). */
  const g = (a: number, b: number): number => (b === 0 ? Math.abs(a) : g(b, a % b));
  const M = Math.abs(z.M);
  const sM = Math.sign(z.M);
  const num = 2 * z.j * sM;
  const d = g(num, M);
  const cel = num === 0 ? '' : M / d === 1 ? `${num / d}` : `\\frac{${num / d}}{${M / d}}`;
  const sg = z.sg * sM;
  const th = `\\frac{\\arccos ${dec(C)}}{${M === 1 ? '' : M}\\pi}`;
  return `${cel}${sg > 0 ? (cel === '' ? '' : '+') : '-'}${th}`;
}

const negTex = (s: string) =>
  s.startsWith('-') ? s.slice(1).replace(/^(\d|\\frac\{\d)/, (x) => x) : `-${s}`;

function sobrat(p: PJ19): Chast2Zadacha {
  const ch = chislaJ19(p);
  const Ct = dec(p.C);
  const uslovie = `Найдите все значения $a$, при каждом из которых уравнение\n$\\cos ax=${Ct}$\nимеет на отрезке $\\left[${p.m === 0 ? '0' : p.m === 1 ? '\\pi' : p.m === -1 ? '-\\pi' : `${p.m}\\pi`};\\ ${p.n === 1 ? '\\pi' : `${p.n}\\pi`}\\right]$ ровно ${p.K} ${p.K % 10 === 1 && p.K !== 11 ? 'корень' : p.K % 10 >= 2 && p.K % 10 <= 4 && (p.K < 10 || p.K > 20) ? 'корня' : 'корней'}.\nПри решении можно воспользоваться оценкой: $${dec(p.t1)}<\\arccos ${Ct}<${dec(p.t2)}$.`;
  /* a > 0 и симметрично a < 0. */
  type T = { tex: string; pole: string; v: number };
  const tch = (z: { v: number } & Izl): T => {
    const t = izlTex(z, p.C);
    return { tex: t, pole: t, v: z.v };
  };
  const pol = ch.kuski.map((q) => ({ lo: tch(q.lo!), hi: tch(q.hi!), loZ: q.loZ, hiZ: q.hiZ }));
  const otr = pol
    .map((q) => ({
      lo: { tex: `-\\left(${q.hi.tex}\\right)`, pole: `-(${q.hi.pole})`, v: -q.hi.v },
      hi: { tex: `-\\left(${q.lo.tex}\\right)`, pole: `-(${q.lo.pole})`, v: -q.lo.v },
      loZ: q.hiZ,
      hiZ: q.loZ,
    }))
    .reverse();
  /* Красивее: −(2 − x) = −2 + x. */
  const raskryt = (s: string) => {
    const m = /^-\\left\((.*)\\right\)$/.exec(s);
    if (m === null) return s;
    const inner = m[1]!;
    const sp = /^(.*?)([+-])(\\frac\{\\arccos.*)$/.exec(inner);
    if (sp === null) return s;
    const cel = sp[1]!;
    const zn = sp[2] === '+' ? '-' : '+';
    return `${cel === '' ? '' : negTex(cel)}${zn}${sp[3]}`;
  };
  const vse = [
    ...otr.map((q) => ({
      ...q,
      lo: { ...q.lo, tex: raskryt(q.lo.tex) },
      hi: { ...q.hi, tex: raskryt(q.hi.tex) },
    })),
    ...pol,
  ];
  const kusTex = (q: (typeof vse)[number]) =>
    `\\left${q.loZ ? '[' : '('}${q.lo.tex};\\ ${q.hi.tex}\\right${q.hiZ ? ']' : ')'}`;
  const otv = vse.map(kusTex).join('\\cup');
  const vPole: Mnozhestvo = {
    kuski: vse.map((q): Kusok => ({
      t: 'interval',
      lo: q.lo.tex,
      loZakr: q.loZ,
      hi: q.hi.tex,
      hiZakr: q.hiZ,
    })),
  };
  const pr = pol[0]!;
  const aMid = (pr.lo.v + pr.hi.v) / 2;
  const korniMid = (() => {
    const out: string[] = [];
    const lo = aMid * p.m * Math.PI;
    const hi = aMid * p.n * Math.PI;
    for (let j = -40; j <= 40; j += 1)
      for (const s of [-1, 1]) {
        const y = s * ch.th + 2 * Math.PI * j;
        if (y >= lo && y <= hi)
          out.push(`${j === 0 ? '' : `${2 * j}\\pi`}${s > 0 ? '+' : '-'}\\theta`);
      }
    return out;
  })();
  return {
    no: 19,
    shablon: 'j19.cosKorni',
    uslovie,
    risunok: null,
    punkty: [{ bukva: null, podpis: 'Значения $a$', pole: { vid: 'promezhutki', verno: vPole } }],
    otvet: `$${otv}$`,
    reshenie: [
      {
        title: 'Сведение к $a>0$',
        lines: [
          `При $a=0$ получаем $\\cos0=1\\ne${Ct}$ — корней нет. Косинус чётен: $\\cos(-ax)=\\cos ax$, поэтому при $a$ и $-a$ число корней одинаково; найдём подходящие $a>0$.`,
          `Пусть $y=ax$, $\\theta=\\arccos ${Ct}$, $${dec(p.t1)}<\\theta<${dec(p.t2)}$. Корни уравнения на отрезке — это корни $\\cos y=${Ct}$, то есть точки $y=\\pm\\theta+2\\pi j$, на отрезке $\\left[${api(p.m)};\\ ${api(p.n)}\\right]$.`,
        ],
      },
      {
        title: 'Когда меняется число корней',
        lines: [
          `При росте $a$ концы отрезка $${api(p.m)}$ и $${api(p.n)}$ движутся, и число корней меняется только в моменты, когда конец проходит через точку $\\pm\\theta+2\\pi j$, то есть при $a=\\dfrac{2\\pi j\\pm\\theta}{M\\pi}$, $M\\in\\{${[...new Set([p.m, p.n].filter((x) => x !== 0))].join(';\\ ')}\\}$. Оценка $\\theta$ позволяет расположить эти значения по возрастанию.`,
          `Например, при $a=${dec(Math.round(aMid * 1000) / 1000)}$ на отрезке лежат корни $y=${korniMid.join(',\\ ')}$ — их ${korniMid.length}.`,
          `Перебирая промежутки между соседними значениями, получаем: ровно ${p.K} корней при $a\\in${pol.map(kusTex).join('\\cup')}$ (на концах — проверка, попадает ли корень на конец отрезка).`,
        ],
      },
      { title: 'Ответ', lines: [`С учётом симметрии: $a\\in${otv}$.`] },
    ],
    razbor: [
      { slovo: 'Чётность: достаточно $a>0$', formula: 'a\\to -a' },
      { slovo: 'Замена $y=ax$', formula: `\\left[${api(p.m)};\\ ${api(p.n)}\\right]` },
      { slovo: 'Корни $y=\\pm\\theta+2\\pi j$', formula: `\\theta=\\arccos ${Ct}` },
      { slovo: 'Ответ', formula: otv },
    ],
    kontrol: {
      kuski: vse.flatMap((q) => [q.lo.v, q.hi.v, q.loZ ? 1 : 0, q.hiZ ? 1 : 0]),
    },
  };
}

export const J19_COS_KORNI: Shablon2<PJ19> = {
  no: 19,
  prototip: 'Уравнение cos ax = C: ровно K корней на отрезке, перебор концов через оценку arccos',
  sobrat,
};
