/**
 * №19 (варианты 13–14): |x − βa| + |kx − kγa| = c + σax, a одного знака
 * (t = −σa ≥ 0), ровно N решений.
 *
 * h(x) = |x − βa| + k|x − γa| − c + tx — выпуклая ломаная; при условии
 * γa < βa её наклоны −(k+1) + t, (k−1) + t, (k+1) + t, наименьшее значение
 * (при t < k + 1) — в точке x = γa: h_min = −g t² + d t − c, где g = σγ > 0,
 * d = g − σβ > 0. Число корней: 2, 1, 0 при h_min < 0, = 0, > 0 (t < k+1);
 * при t > k + 1 ломаная возрастает — один корень; при t = k + 1 — один
 * корень, если h_min < 0.
 */

import type { Kusok, Mnozhestvo } from '@/lib/chast2/sravnenie';
import {
  add,
  cmp,
  div,
  mul,
  neg,
  rat,
  ratTex,
  sub,
  toNumber,
  type Rat,
} from '@/lib/zadanie15/core/rational';
import { sKornem, skTex, skToNumber, type SKornem } from './chisla';
import type { Chast2Zadacha, Shablon2 } from './types';

type Dr = readonly [number, number];
const R = (d: Dr) => rat(d[0], d[1]);

export interface PG19 {
  /** Коэффициент при x во втором модуле. */
  k: number;
  /** Правая часть c + σax. */
  sg: 1 | -1;
  c: Dr;
  /** Первый модуль |x − βa|, второй |kx − kγa|, γ = σg. */
  beta: Dr;
  g: Dr;
  /** Сколько решений: 1 или 2. */
  N: 1 | 2;
  /** a = 0 входит в рассматриваемые значения (неотрицательные / неположительные). */
  nol: boolean;
  /** Какой модуль первым в условии. */
  pervyy: 1 | 2;
}

interface Tt {
  v: number;
  tex: string;
  pole: string;
}

const fromRat = (x: Rat): Tt => ({
  v: toNumber(x),
  tex: ratTex(x),
  pole: ratTex(x).replace(/\\dfrac/g, '\\frac'),
});
const fromSk = (x: SKornem): Tt => ({
  v: skToNumber(x),
  tex: skTex(x),
  pole: skTex(x).replace(/\\dfrac/g, '\\frac'),
});

/** «x−a», «x+2a», «2x+3a», «3x-1{,}5a». */
function lin(kx: number, ka: Rat): string {
  const x = kx === 1 ? 'x' : `${kx}x`;
  if (ka.n === 0n) return x;
  const v = toNumber(ka);
  const av = Math.abs(v);
  const aT = av === 1 ? 'a' : `${String(av).replace('.', '{,}')}a`;
  return `${x}${v < 0 ? '-' : '+'}${aT}`;
}

export function chislaG19(p: PG19) {
  const g = R(p.g);
  const beta = R(p.beta);
  const c = R(p.c);
  const sb = mul(rat(p.sg), beta);
  const d = sub(g, sb);
  if (!(toNumber(g) > 0 && toNumber(d) > 0 && toNumber(c) > 0)) throw new Error('g19: параметры');
  const T = rat(p.k + 1);
  /* g t² − d t + c = 0. */
  const D = sub(mul(d, d), mul(rat(4), mul(g, c)));
  if (!(toNumber(D) > 0)) throw new Error('g19: нужен D > 0');
  const u = div(d, mul(rat(2), g));
  const D4 = div(D, mul(rat(4), mul(g, g)));
  const t1 = sKornem(u, D4, -1);
  const t2 = sKornem(u, D4, 1);
  if (!(skToNumber(t1) > 0 && skToNumber(t2) < p.k + 1)) throw new Error('g19: корни вне (0; k+1)');
  /* h_min(k+1) < 0? */
  const hT = add(neg(mul(g, mul(T, T))), sub(mul(d, T), c));
  /* Множество t. */
  type K = { lo: Tt | null; hi: Tt | null; loZ: boolean; hiZ: boolean };
  const T1 = fromSk(t1);
  const T2 = fromSk(t2);
  const TT = fromRat(T);
  const Z = fromRat(rat(0));
  let kuski: K[];
  if (p.N === 2) {
    kuski = [
      { lo: Z, hi: T1, loZ: p.nol, hiZ: false },
      { lo: T2, hi: TT, loZ: false, hiZ: false },
    ];
  } else {
    kuski = [
      { lo: T1, hi: T1, loZ: true, hiZ: true },
      { lo: T2, hi: T2, loZ: true, hiZ: true },
      { lo: TT, hi: null, loZ: toNumber(hT) < 0, hiZ: false },
    ];
  }
  /* a = −σt. */
  const kA = (x: Tt | null): Tt | null => {
    if (x === null) return null;
    if (p.sg < 0) return x;
    const neg1 = (s: string) => (s === '0' ? '0' : s.startsWith('-') ? s.slice(1) : `-${s}`);
    if (x.tex.includes('\\dfrac') && !x.tex.startsWith('-'))
      return { v: -x.v, tex: `-${x.tex}`, pole: `-${x.pole}` };
    return { v: -x.v, tex: neg1(x.tex), pole: neg1(x.pole) };
  };
  let kuskiA: K[] = kuski.map((q) =>
    p.sg < 0 ? q : { lo: kA(q.hi), hi: kA(q.lo), loZ: q.hiZ, hiZ: q.loZ },
  );
  if (p.sg > 0) {
    /* t = −a: a = −t1 и т. п.; корни −t через sKornem(−u, D4, ±). */
    const m1 = fromSk(sKornem(neg(u), D4, 1));
    const m2 = fromSk(sKornem(neg(u), D4, -1));
    const fix = (x: Tt | null) =>
      x === null ? null : Math.abs(x.v - m1.v) < 1e-12 ? m1 : Math.abs(x.v - m2.v) < 1e-12 ? m2 : x;
    kuskiA = kuskiA.map((q) => ({ ...q, lo: fix(q.lo), hi: fix(q.hi) }));
  }
  kuskiA.sort((x, y) => (x.lo?.v ?? -Infinity) - (y.lo?.v ?? -Infinity));
  return { g, d, c, D, t1, t2, T, hT, kuskiA, sb };
}

function sobrat(p: PG19): Chast2Zadacha {
  const ch = chislaG19(p);
  const k = p.k;
  const sg = p.sg;
  const gamma = mul(rat(sg), ch.g);
  const beta = R(p.beta);
  const m1 = `\\left|${lin(1, neg(beta))}\\right|`;
  const m2 = `\\left|${lin(k, neg(mul(rat(k), gamma)))}\\right|`;
  const cT = ratTex(ch.c).replace(/\\dfrac\{(\d+)\}\{(\d+)\}/, (_, a, b) =>
    String(Number(a) / Number(b)).replace('.', '{,}'),
  );
  const prav = sg < 0 ? `${cT}-ax` : `ax+${cT}`;
  const ur = `${p.pervyy === 1 ? m1 + '+' + m2 : m2 + '+' + m1}=${prav}`;
  const znak =
    sg < 0
      ? p.nol
        ? 'неотрицательные'
        : 'положительные'
      : p.nol
        ? 'неположительные'
        : 'отрицательные';
  const reshT = p.N === 1 ? 'ровно одно решение' : 'ровно два различных решения';
  const uslovie = `Найдите все ${znak} значения $a$, при каждом из которых уравнение\n$${ur}$\nимеет ${reshT}.`;
  const tT = sg < 0 ? 'a' : '-a';
  const kt = (x: Rat) => {
    const s0 = ratTex(x);
    return s0 === '1' ? 't' : s0 === '-1' ? '-t' : `${s0}t`;
  };
  const odin = (x: Rat) => (ratTex(x) === '1' ? '' : ratTex(x));
  const gT = odin(ch.g);
  const dT = odin(ch.d);
  const kusTex = (q: { lo: Tt | null; hi: Tt | null; loZ: boolean; hiZ: boolean }) =>
    q.lo !== null && q.hi !== null && Math.abs(q.lo.v - q.hi.v) < 1e-12
      ? `\\left\\{${q.lo.tex}\\right\\}`
      : `\\left${q.loZ ? '[' : '('}${q.lo?.tex ?? '-\\infty'};\\ ${q.hi?.tex ?? '+\\infty'}\\right${q.hiZ ? ']' : ')'}`;
  const tochki = ch.kuskiA.filter(
    (q) => q.lo !== null && q.hi !== null && Math.abs(q.lo.v - q.hi.v) < 1e-12,
  );
  const otv = [
    ...(tochki.length > 0
      ? [`\\left\\{${tochki.map((q) => q.lo!.tex).join(';\\ ')}\\right\\}`]
      : []),
    ...ch.kuskiA.filter((q) => !tochki.includes(q)).map(kusTex),
  ].join('\\cup');
  const vPole: Mnozhestvo = {
    kuski: ch.kuskiA.map((q): Kusok =>
      q.lo !== null && q.hi !== null && Math.abs(q.lo.v - q.hi.v) < 1e-12
        ? { t: 'tochka', x: q.lo.pole }
        : {
            t: 'interval',
            lo: q.lo?.pole ?? '-inf',
            loZakr: q.loZ,
            hi: q.hi?.pole ?? 'inf',
            hiZakr: q.hiZ,
          },
    ),
  };
  const t1 = skTex(ch.t1);
  const t2 = skTex(ch.t2);
  const hTv = toNumber(ch.hT);
  return {
    no: 19,
    shablon: 'g19.dvaModulya',
    uslovie,
    risunok: null,
    punkty: [{ bukva: null, podpis: 'Значения $a$', pole: { vid: 'promezhutki', verno: vPole } }],
    otvet: `$${otv}$`,
    reshenie: [
      {
        title: 'Функция с модулями',
        lines: [
          `Пусть $t=${tT}$, $t\\ge0$. Тогда $a=${sg < 0 ? 't' : '-t'}$, правая часть равна $${cT}-tx$, а уравнение — $h(x)=0$, где $h(x)=${m1}+${m2}-${cT}+tx$.`,
          `Модули обращаются в ноль при $x=${kt(mul(beta, rat(-sg)))}$ и $x=${kt(mul(gamma, rat(-sg)))}$; при $t>0$ вторая точка левее первой. $h$ — непрерывная ломаная с угловыми коэффициентами $-${k + 1}+t$, $${k - 1}+t$, $${k + 1}+t$ (слева направо).`,
          `Два последних наклона положительны. Если $t<${k + 1}$, первый отрицателен: $h$ убывает до точки $x_0=${kt(mul(gamma, rat(-sg)))}$, затем возрастает. Её значение там $h(x_0)=${dT}t-${cT}+t\\cdot\\left(${kt(mul(gamma, rat(-sg)))}\\right)=-${gT}t^2+${dT}t-${cT}$.`,
        ],
      },
      {
        title: 'Число корней',
        lines: [
          `При $t<${k + 1}$: два корня, если $h(x_0)<0$; один, если $h(x_0)=0$; ни одного, если $h(x_0)>0$.`,
          `При $t>${k + 1}$ ломаная возрастает на всей прямой и меняет знак — ровно один корень. При $t=${k + 1}$ она постоянна левее $x_0$ и равна $h(x_0)=${ratTex(ch.hT)}${hTv < 0 ? '<0' : '>0'}$, правее возрастает — ${hTv < 0 ? 'ровно один корень' : 'корней нет'}.`,
          `$${gT}t^2-${dT}t+${cT}=0$: $t_1=${t1}$, $t_2=${t2}$, оба на интервале $(0;\\ ${k + 1})$; $h(x_0)<0$ при $t<t_1$ и при $t>t_2$.`,
        ],
      },
      {
        title: 'Ответ',
        lines: [
          p.N === 1
            ? `Ровно одно решение: $t=t_1$, $t=t_2$ и $t${hTv < 0 ? '\\ge' : '>'}${k + 1}$.`
            : `Ровно два решения: $${p.nol ? '0\\le' : '0<'} t<t_1$ и $t_2<t<${k + 1}$.`,
          `Возвращаемся к $a=${sg < 0 ? 't' : '-t'}$: $a\\in${otv}$.`,
        ],
      },
    ],
    razbor: [
      {
        slovo: 'Левая часть минус правая — выпуклая ломаная',
        formula: `h(x)=${m1}+${m2}-${cT}+tx`,
      },
      { slovo: 'Наименьшее значение — в точке излома', formula: `h(x_0)=-${gT}t^2+${dT}t-${cT}` },
      { slovo: `Отдельно $t\\ge${k + 1}$: ломаная монотонна`, formula: `t=${tT}` },
      { slovo: 'Ответ', formula: otv },
    ],
    kontrol: {
      kuski: ch.kuskiA.flatMap((q) => [
        q.lo?.v ?? -1e9,
        q.hi?.v ?? 1e9,
        q.loZ ? 1 : 0,
        q.hiZ ? 1 : 0,
      ]),
    },
  };
}

void cmp;

export const G19_DVA_MODULYA: Shablon2<PG19> = {
  no: 19,
  prototip:
    'Сумма двух модулей и прямая с параметром: выпуклая ломаная, наименьшее значение в изломе',
  sobrat,
};
