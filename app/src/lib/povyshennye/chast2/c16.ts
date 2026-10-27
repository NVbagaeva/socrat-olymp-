/**
 * №16: дробь из показательной разности и квадрата логарифма.
 *
 *   E = p^L − r^L (p > r > 0),  L = ±W,  W = kx − s — аргумент логарифма;
 *   G = ±(log²_b W − c²).
 *
 * Дробь E/G или G/E сравнивается с нулём. На области определения W > 0,
 * поэтому знак E постоянный (p^L − r^L = r^L((p/r)^L − 1) — знак L), и
 * неравенство сводится к знаку G: |log_b W| ≥ c (или ≤). Шаблон требует
 * «внешний» случай, как в образцах: W ≤ w₁ или W ≥ w₂, где
 * w₁ < 1 < w₂ — числа b^{±c}; ответ — два промежутка по x, концы
 * включены, если логарифм в числителе.
 */

import { add, div, mul, neg, rat, toNumber, type Rat } from '@/lib/zadanie15/core/rational';
import type { Kusok, Mnozhestvo } from '@/lib/chast2/sravnenie';
import { ratDecTex } from './tex';
import type { Chast2Zadacha, Shablon2 } from './types';

/** Основания степеней: запись и значение. */
const OSN: Record<string, Rat> = {
  '2': rat(2),
  '3': rat(3),
  '4': rat(4),
  '5': rat(5),
  '6': rat(6),
  '7': rat(7),
  '9': rat(9),
  '10': rat(10),
  '0,5': rat(1, 2),
  '0,25': rat(1, 4),
  '0,2': rat(1, 5),
  '0,1': rat(1, 10),
};

/** Основание логарифма и число c: b^c и b^{−c} рациональные. */
const LOGB: Record<string, Rat> = {
  '0,04': rat(1, 25),
  '0,2': rat(1, 5),
  '0,25': rat(1, 4),
  '0,5': rat(1, 2),
  '0,1': rat(1, 10),
  '3': rat(3),
  '4': rat(4),
  '9': rat(9),
};

export interface PC16 {
  /** W = k·x − s. */
  k: number;
  s: number;
  /** Показатель степени: W (1) или −W (−1). */
  zE: 1 | -1;
  /** Основания степеней p > r. */
  p: keyof typeof OSN;
  r: keyof typeof OSN;
  /** Основание логарифма. */
  b: keyof typeof LOGB;
  /** c — дробь [числитель, знаменатель]: 1, 1/2, 3/2, 2. */
  c: readonly [number, number];
  /** Логарифм — в числителе (иначе в знаменателе). */
  logNum: boolean;
  /** G = log² − c² ('minus') или c² − log² ('plus'). */
  forma: 'minus' | 'plus';
  znak: 'ge' | 'le';
}

/** b^q для q = ±1/2, ±1, ±3/2, ±2 — точно (b — точный квадрат, если q дробное). */
function stepen(b: Rat, q: Rat): Rat {
  const pol = q.n > 0n;
  const m = pol ? q : neg(q);
  let res: Rat;
  if (m.d === 1n) {
    res = rat(1);
    for (let i = 0n; i < m.n; i += 1n) res = mul(res, b);
  } else if (m.d === 2n) {
    const kor = (x: bigint) => {
      const r = BigInt(Math.round(Math.sqrt(Number(x))));
      if (r * r !== x) throw new Error('c16: основание не квадрат');
      return r;
    };
    const s = { n: kor(b.n), d: kor(b.d) } as Rat;
    res = rat(1);
    for (let i = 0n; i < m.n; i += 1n) res = mul(res, s);
  } else throw new Error('c16: показатель не тот');
  return pol ? res : div(rat(1), res);
}

export function chislaC16(p: PC16) {
  const b = LOGB[p.b]!;
  const c = rat(p.c[0], p.c[1]);
  const u = stepen(b, c);
  const v = stepen(b, neg(c));
  const [w1, w2] = toNumber(u) < toNumber(v) ? [u, v] : [v, u];
  /* x по W: x = (W + s)/k. */
  const x = (w: Rat) => div(add(w, rat(p.s)), rat(p.k));
  const x0 = rat(p.s, p.k);
  const x1 = x(w1);
  const x2 = x(w2);
  const P = OSN[p.p]!;
  const R = OSN[p.r]!;
  /* Знак E на области (W > 0): знак показателя. */
  const sigma = p.zE;
  const eps = p.forma === 'minus' ? 1 : -1;
  const z = p.znak === 'ge' ? 1 : -1;
  /* Нужно sign(log² − c²) = τ: +1 — «вне», −1 — «между». */
  const tau = sigma * eps * z;
  return { b, c, w1, w2, x0, x1, x2, P, R, sigma, eps, z, tau, c2: mul(c, c), pr: div(P, R) };
}

/** Кусок ответа по x. */
export interface KusokC16 {
  lo: Rat | null;
  loZ: boolean;
  hi: Rat | null;
  hiZ: boolean;
}

export function otvetC16(p: PC16): KusokC16[] {
  const n = chislaC16(p);
  if (n.tau !== 1) throw new Error('c16: ответ не из двух промежутков');
  const z = p.logNum;
  /* W ∈ (0; w1] ∪ [w2; +∞). */
  if (p.k > 0)
    return [
      { lo: n.x0, loZ: false, hi: n.x1, hiZ: z },
      { lo: n.x2, loZ: z, hi: null, hiZ: false },
    ];
  return [
    { lo: null, loZ: false, hi: n.x2, hiZ: z },
    { lo: n.x1, loZ: z, hi: n.x0, hiZ: false },
  ];
}

const chT = (x: Rat | null, minus: boolean) =>
  x === null ? (minus ? '-\\infty' : '+\\infty') : ratDecTex(x);

export function mnozhestvoC16(ks: readonly KusokC16[]): string {
  return ks
    .map(
      (k) =>
        `\\left${k.loZ ? '[' : '('}${chT(k.lo, true)};\\ ${chT(k.hi, false)}\\right${k.hiZ ? ']' : ')'}`,
    )
    .join('\\cup');
}

function vPole(ks: readonly KusokC16[]): Mnozhestvo {
  const pole = (x: Rat | null, minus: boolean) =>
    x === null ? (minus ? '-inf' : 'inf') : ratDecTex(x).replace(/\\dfrac/g, '\\frac');
  return {
    kuski: ks.map((k): Kusok => ({
      t: 'interval',
      lo: pole(k.lo, true),
      loZakr: k.loZ,
      hi: pole(k.hi, false),
      hiZakr: k.hiZ,
    })),
  };
}

/** «2x−5», «4−5x» по k, s. */
function lineTex(k: number, s: number): string {
  const kx = `${Math.abs(k) === 1 ? '' : Math.abs(k)}x`;
  if (k > 0) return `${kx}${s > 0 ? '-' : '+'}${Math.abs(s)}`;
  return `${-s}-${kx}`;
}

const rT = (x: Rat) => ratDecTex(x);

function sobrat(p: PC16): Chast2Zadacha {
  const n = chislaC16(p);
  if (!(toNumber(n.P) > toNumber(n.R))) throw new Error('c16: нужно p > r');
  if (p.s === 0 || p.k === 0) throw new Error('c16: W вырождено');
  const ks = otvetC16(p);
  const W = lineTex(p.k, p.s);
  const L = lineTex(p.zE * p.k, p.zE * p.s);
  const pT = p.p.replace(',', '{,}');
  const rTx = p.r.replace(',', '{,}');
  const bT = p.b.replace(',', '{,}');
  const E = `${pT}^{${L}}-${rTx}^{${L}}`;
  const c2 = rT(n.c2);
  const logT = `\\log_{${bT}}^2(${W})`;
  const G = p.forma === 'minus' ? `${logT}-${c2}` : `${c2}-${logT}`;
  const [chis, znam] = p.logNum ? [G, E] : [E, G];
  const zn = p.znak === 'ge' ? '\\ge' : '\\le';
  const uslovie = `Решите неравенство $\\dfrac{${chis}}{${znam}}${zn}0.$`;
  const otvet = mnozhestvoC16(ks);
  const cT = rT(n.c);
  const w1 = rT(n.w1);
  const w2 = rT(n.w2);
  const x0 = rT(n.x0);
  const prT = rT(n.pr);

  /* Знак E на области определения. */
  const ePolozh = n.sigma > 0;
  /* Нужный знак G: G·σ·z ≥ 0 → sign G = σ·z. */
  const gZnak = n.sigma * n.z > 0 ? 'неотрицательным' : 'неположительным';
  const gStrogo = p.logNum ? '' : ' (и не равным нулю: он в знаменателе)';
  const vne = p.logNum
    ? `\\left|\\log_{${bT}}(${W})\\right|\\ge${cT}`
    : `\\left|\\log_{${bT}}(${W})\\right|>${cT}`;
  const [zl, zr] = p.logNum ? ['\\le', '\\ge'] : ['<', '>'];
  const kPol = p.k > 0;
  const kusX = ks.map(
    (k) =>
      `\\left${k.loZ ? '[' : '('}${chT(k.lo, true)};\\ ${chT(k.hi, false)}\\right${k.hiZ ? ']' : ')'}`,
  );

  return {
    no: 16,
    shablon: 'c16.pokazLog',
    uslovie,
    risunok: null,
    punkty: [
      { bukva: null, podpis: 'Множество решений', pole: { vid: 'promezhutki', verno: vPole(ks) } },
    ],
    otvet: `$${otvet}$`,
    reshenie: [
      {
        title: 'Область определения',
        lines: [
          `Логарифм определён при $${W}>0$, то есть $x${kPol ? '>' : '<'}${x0}$. ${p.logNum ? 'Знаменатель' : 'Числитель'} $${E}$ при этом не обращается в ноль — это видно из следующего шага.`,
        ],
      },
      {
        title: 'Знак показательной разности',
        lines: [
          `$${E}=${rTx}^{${L}}\\left(${prT}^{${L}}-1\\right)$, так как $\\dfrac{${pT}}{${rTx}}=${prT}>1$. Множитель $${rTx}^{${L}}$ положителен, а $${prT}^{${L}}>1$ при $${L}>0$ и $${prT}^{${L}}<1$ при $${L}<0$.`,
          `На области определения $${W}>0$, поэтому $${L}${ePolozh ? '>' : '<'}0$ и $${E}${ePolozh ? '>' : '<'}0$.`,
        ],
      },
      {
        title: 'Сводим к логарифмическому неравенству',
        lines: [
          `Дробь ${p.znak === 'ge' ? 'неотрицательна' : 'неположительна'}, а показательная разность ${ePolozh ? 'положительна' : 'отрицательна'} — значит, выражение $${G}$ должно быть ${gZnak}${gStrogo}:`,
          `$${logT}${p.logNum ? '\\ge' : '>'}${c2}$, то есть $${vne}$.`,
        ],
      },
      {
        title: 'Решаем логарифмическое неравенство',
        lines: [
          `$\\log_{${bT}}(${W})=\\pm${cT}$ при $${W}=${bT}^{\\pm${cT}}$, то есть при $${W}=${w1}$ и $${W}=${w2}$. Модуль логарифма ${p.logNum ? 'не меньше' : 'больше'} $${cT}$, когда аргумент лежит вне промежутка между этими числами:`,
          `$0<${W}${zl}${w1}$ или $${W}${zr}${w2}$.`,
        ],
      },
      {
        title: 'Возвращаемся к $x$',
        lines: [
          `$0<${W}${zl}${w1}$ даёт $x\\in${kPol ? kusX[0] : kusX[1]}$; $${W}${zr}${w2}$ даёт $x\\in${kPol ? kusX[1] : kusX[0]}$.`,
          `Ответ: $x\\in${otvet}$.`,
        ],
      },
    ],
    razbor: [
      { slovo: 'Область определения: аргумент логарифма положителен', formula: `${W}>0` },
      {
        slovo: 'Знак показательной разности на области постоянный',
        formula: `${E}${ePolozh ? '>' : '<'}0`,
      },
      { slovo: 'Остаётся неравенство на модуль логарифма', formula: vne },
      {
        slovo: 'Аргумент — вне промежутка между корнями',
        formula: `0<${W}${zl}${w1}\\ \\text{или}\\ ${W}${zr}${w2}`,
      },
      { slovo: 'Переходим к $x$', formula: otvet },
    ],
    ...(p.logNum
      ? {
          utochnenie: {
            u: `точек $${ks
              .flatMap((k) => [k.loZ ? k.lo : null, k.hiZ ? k.hi : null])
              .filter((x): x is Rat => x !== null)
              .map(rT)
              .join('$ и/или $')}$`,
          },
        }
      : {}),
    kontrol: {
      kuski: ks.flatMap((k) => [
        k.lo === null ? -1e9 : toNumber(k.lo),
        k.hi === null ? 1e9 : toNumber(k.hi),
        k.loZ ? 1 : 0,
        k.hiZ ? 1 : 0,
      ]),
      x0: toNumber(n.x0),
      w1: toNumber(n.w1),
      w2: toNumber(n.w2),
    },
  };
}

export const C16_POKAZ_LOG: Shablon2<PC16> = {
  no: 16,
  prototip:
    'Дробь: разность степеней и квадрат логарифма; знак степеней постоянный, |log| вне отрезка',
  sobrat,
};
