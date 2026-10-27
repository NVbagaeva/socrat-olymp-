/**
 * №19 (варианты 11–12): система
 *   (|x| ∓ a²)² + (y − ta)(y + ta) = (R² − t²)a² − 2sy − s²,
 *   y + s = √(Ka),
 * то есть (|x| ∓ a²)² + (y + s)² = R²a², (y + s)² = Ka, a ≥ 0.
 * Получаем (|x| ∓ a²)² = D, D = R²a² − Ka; u = |x| ≥ 0.
 *
 * Сравнение a² с √D сводится к кубическому a³ − R²a + K с целым корнем r
 * (K = r(R² − r²)): (a − r)(a² + ra + r² − R²); положительные корни r и
 * ρ = (−r + √(4R² − 3r²))/2, между ними многочлен отрицателен.
 */

import type { Kusok, Mnozhestvo } from '@/lib/chast2/sravnenie';
import { rat } from '@/lib/zadanie15/core/rational';
import { sqrtRat, surdTex } from '@/lib/zadanie15/core/surd';
import { sKornem, skTex, skToNumber, tochnoTex, type SKornem } from './chisla';
import type { Chast2Zadacha, Shablon2 } from './types';

export interface PF19 {
  /** Вид первого уравнения: (|x| − a²)² или (|x| + a²)². */
  vid: 'minus' | 'plus';
  R: number;
  t: number;
  s: number;
  /** Целый корень кубического многочлена; K = r(R² − r²). */
  r: number;
  /** Сколько решений: minus — 2, 3, 4; plus — 1, 2. */
  k: number;
}

const ratSK = (n: number, d = 1): SKornem => ({ u: rat(n, d), k: rat(0), m: 1n });

export function chislaF19(p: PF19) {
  const K = p.r * (p.R * p.R - p.r * p.r);
  if (K <= 0 || p.t * p.t > p.R * p.R) throw new Error('f19: параметры');
  const rho = sKornem(rat(-p.r, 2), rat(4 * p.R * p.R - 3 * p.r * p.r, 4), 1);
  const rv = skToNumber(rho);
  if (rv <= 0 || Math.abs(rv - p.r) < 1e-9) throw new Error('f19: корни');
  const [lo, hi] = rv < p.r ? [rho, ratSK(p.r)] : [ratSK(p.r), rho];
  const a0 = ratSK(K, p.R * p.R);
  return { K, rho, lo, hi, a0 };
}

/** Число решений при данном a (проверка подсчёта). */
export function chisloF19(p: PF19, a: number): number {
  if (a < 0) return 0;
  const K = p.r * (p.R * p.R - p.r * p.r);
  const D = p.R * p.R * a * a - K * a;
  const eps = 1e-9;
  if (D < -eps) return 0;
  const sq = Math.sqrt(Math.max(0, D));
  const us = p.vid === 'minus' ? [a * a + sq, a * a - sq] : [sq - a * a];
  const uniq = us.filter((u, i) => u > -eps && us.findIndex((w) => Math.abs(w - u) < eps) === i);
  return uniq.reduce((n, u) => n + (u < eps ? 1 : 2), 0);
}

interface KusokF {
  lo: SKornem | null;
  hi: SKornem | null;
  loZ: boolean;
  hiZ: boolean;
}

export function otvetF19(p: PF19): KusokF[] {
  const { lo, hi, a0 } = chislaF19(p);
  const tchk = (x: SKornem): KusokF => ({ lo: x, hi: x, loZ: true, hiZ: true });
  if (p.vid === 'minus') {
    if (p.k === 2) return [tchk(a0), { lo, hi, loZ: false, hiZ: false }];
    if (p.k === 3) return [tchk(lo), tchk(hi)];
    if (p.k === 4)
      return [
        { lo: a0, hi: lo, loZ: false, hiZ: false },
        { lo: hi, hi: null, loZ: false, hiZ: false },
      ];
  } else {
    if (p.k === 2) return [{ lo, hi, loZ: false, hiZ: false }];
    if (p.k === 1) return [tchk(ratSK(0)), tchk(lo), tchk(hi)];
  }
  throw new Error('f19: k');
}

const sl = (c: number) => (c === 0 ? '' : c > 0 ? `+${c}` : `${c}`);
const SLOVO: Record<number, string> = {
  1: 'ровно одно решение',
  2: 'ровно два различных решения',
  3: 'ровно три различных решения',
  4: 'ровно четыре различных решения',
};

function sobrat(p: PF19): Chast2Zadacha {
  const c = chislaF19(p);
  const kus = otvetF19(p);
  /* Проверка подсчёта в средних точках и на концах. */
  for (const q of kus) {
    const v = q.lo === null ? 0 : skToNumber(q.lo);
    const w = q.hi === null ? v + 10 : skToNumber(q.hi);
    const m = q.lo === q.hi ? v : (v + w) / 2;
    if (chisloF19(p, m) !== p.k) throw new Error(`f19: подсчёт при a=${m}`);
  }
  const R2 = p.R * p.R;
  const t2 = p.t * p.t;
  const zn = p.vid === 'minus' ? '-' : '+';
  const lev1 = `\\left(|x|${zn}a^2\\right)^2+(y-${p.t}a)(y+${p.t}a)`;
  const kf = R2 - t2;
  const prav1 =
    `${kf === 0 ? '' : `${kf === 1 ? '' : kf}a^2`}${sl(-2 * p.s).replace(/^(\+|-)(\d+)$/, '$1$2y')}${sl(-p.s * p.s)}`.replace(
      /^\+/,
      '',
    );
  const kor = sqrtRat(rat(c.K));
  const korTex =
    kor.m === 1n
      ? `${tochnoTex(kor.k)}\\sqrt{a}`
      : `${kor.k.n === 1n && kor.k.d === 1n ? '' : tochnoTex(kor.k)}\\sqrt{${kor.m}a}`;
  const ur2 = `y${sl(p.s)}=${korTex}`;
  const sist = `\\begin{cases}${lev1}=${prav1},\\\\ ${ur2}\\end{cases}`;
  const mn = (q: KusokF) =>
    q.lo !== null && q.lo === q.hi
      ? null
      : `\\left${q.loZ ? '[' : '('}${q.lo ? skTex(q.lo) : '-\\infty'};\\ ${q.hi ? skTex(q.hi) : '+\\infty'}\\right${q.hiZ ? ']' : ')'}`;
  const tochki = kus.filter((q) => q.lo !== null && q.lo === q.hi).map((q) => skTex(q.lo!));
  const inter = kus.map(mn).filter((x): x is string => x !== null);
  const otv = [
    ...inter,
    ...(tochki.length ? [`\\left\\{${tochki.join(';\\ ')}\\right\\}`] : []),
  ].join('\\cup');
  const pole: Mnozhestvo = {
    kuski: kus.map((q): Kusok =>
      q.lo !== null && q.lo === q.hi
        ? { t: 'tochka', x: skTex(q.lo) }
        : {
            t: 'interval',
            lo: q.lo ? skTex(q.lo) : '-inf',
            loZakr: q.loZ,
            hi: q.hi ? skTex(q.hi) : 'inf',
            hiZakr: q.hiZ,
          },
    ),
  };
  const ysT = `y${sl(p.s)}`;
  const kub = `a^3-${R2}a+${c.K}`;
  const kvTr = `a^2${sl(p.r)}a${sl(p.r * p.r - R2)}`.replace(/\+1a/, '+a');
  const a0T = skTex(c.a0);
  const loT = skTex(c.lo);
  const hiT = skTex(c.hi);
  const minus = p.vid === 'minus';
  const raz: string[] = minus
    ? [
        `Пусть $u=|x|\\ge0$. Каждое $u>0$ даёт два решения $x=\\pm u$, $u=0$ — одно. $(u-a^2)^2=D$, $D=${R2}a^2-${c.K}a=a(${R2}a-${c.K})$.`,
        `$D<0$ при $0<a<${a0T}$ — решений нет. $D=0$: при $a=0$ $u=0$ — одно решение; при $a=${a0T}$ $u=a^2>0$ — два решения.`,
        `$D>0$ (то есть $a>${a0T}$): $u_1=a^2+\\sqrt D>0$ даёт два решения; $u_2=a^2-\\sqrt D$ даёт два, одно или ни одного решения при $a^2>\\sqrt D$, $a^2=\\sqrt D$, $a^2<\\sqrt D$.`,
      ]
    : [
        `Пусть $u=|x|\\ge0$. Так как $u+a^2\\ge0$, имеем $u+a^2=\\sqrt D$, $D=${R2}a^2-${c.K}a$ ($D\\ge0$), то есть $u=\\sqrt D-a^2$.`,
        'Два решения $x=\\pm u$ — при $\\sqrt D>a^2$, одно ($x=0$) — при $\\sqrt D=a^2$, иначе решений нет.',
      ];
  return {
    no: 19,
    shablon: 'f19.moduliKoren',
    uslovie: `Найдите все значения $a$, при каждом из которых система уравнений\n$${sist}$\nимеет ${SLOVO[p.k] ?? `${p.k} решений`}.`,
    risunok: null,
    punkty: [
      { bukva: null, podpis: 'Множество значений $a$', pole: { vid: 'promezhutki', verno: pole } },
    ],
    otvet: `$a\\in${otv}$`,
    reshenie: [
      {
        title: 'Преобразуем систему',
        lines: [
          `$(y-${p.t}a)(y+${p.t}a)=y^2-${t2}a^2$; переносим и выделяем квадрат: $\\left(|x|${zn}a^2\\right)^2+\\left(${ysT}\\right)^2=${R2}a^2$.`,
          `Второе уравнение: $a\\ge0$, $${ysT}\\ge0$ и $\\left(${ysT}\\right)^2=${c.K}a$. Значение $y$ определяется по $a$ однозначно, поэтому число решений системы равно числу значений $x$.`,
          `Подставляем: $\\left(|x|${zn}a^2\\right)^2=${R2}a^2-${c.K}a$.`,
        ],
      },
      { title: 'Число решений по $x$', lines: raz },
      {
        title: 'Сравнение $a^2$ и $\\sqrt D$',
        lines: [
          `При $a>0$: $a^2>\\sqrt D\\Leftrightarrow a^4>${R2}a^2-${c.K}a\\Leftrightarrow ${kub}>0$.`,
          `Подбором $a=${p.r}$ — корень: $${kub}=(a-${p.r})\\left(${kvTr}\\right)$. Положительный корень трёхчлена: $a=${skTex(c.rho)}$. Многочлен отрицателен при $${loT}<a<${hiT}$ и положителен при $a>0$ вне отрезка $\\left[${loT};\\ ${hiT}\\right]$.`,
        ],
      },
      {
        title: 'Ответ',
        lines: [
          minus
            ? p.k === 2
              ? `Ровно два решения: $a=${a0T}$ или $${loT}<a<${hiT}$ (тогда $u_2<0$).`
              : p.k === 3
                ? `Ровно три решения: $u_2=0$, то есть $a=${loT}$ или $a=${hiT}$.`
                : `Ровно четыре решения: $D>0$ и $u_2>0$, то есть $${a0T}<a<${loT}$ или $a>${hiT}$.`
            : p.k === 2
              ? `Ровно два решения: $\\sqrt D>a^2$, то есть $${loT}<a<${hiT}$.`
              : `Ровно одно решение: $a=0$ ($x=0$) или $\\sqrt D=a^2$, то есть $a=${loT}$ или $a=${hiT}$.`,
          `$a\\in${otv}$.`,
        ],
      },
    ],
    razbor: [
      {
        slovo: 'Окружность и замена $(y+s)^2$ через $a$',
        formula: `\\left(|x|${zn}a^2\\right)^2=${R2}a^2-${c.K}a`,
      },
      { slovo: 'Подсчёт значений $|x|$', formula: minus ? 'u=a^2\\pm\\sqrt D' : 'u=\\sqrt D-a^2' },
      {
        slovo: 'Кубический многочлен с целым корнем',
        formula: `${kub}=(a-${p.r})\\left(${kvTr}\\right)`,
      },
      { slovo: 'Ответ', formula: otv },
    ],
    kontrol: {
      lo: skToNumber(c.lo),
      hi: skToNumber(c.hi),
      a0: skToNumber(c.a0),
      k: p.k,
      kuski: kus.flatMap((q) => [
        q.lo ? skToNumber(q.lo) : -1e9,
        q.hi ? skToNumber(q.hi) : 1e9,
        q.loZ ? 1 : 0,
        q.hiZ ? 1 : 0,
      ]),
    },
  };
}

void surdTex;

export const F19_MODULI_KOREN: Shablon2<PF19> = {
  no: 19,
  prototip: 'Система с модулем и корнем: окружность, сравнение a² и √D через кубический многочлен',
  sobrat,
};
