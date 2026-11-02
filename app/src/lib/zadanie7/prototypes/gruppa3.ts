/**
 * Группа III — показательные уравнения (П-15 … П-19, П-29, П-31, П-32).
 *
 * Общий приём: записать обе части степенями одного основания и
 * приравнять показатели. Показательная функция монотонна — каждое
 * значение принимает один раз, поэтому из a^E = a^F следует E = F и
 * корень единственный.
 */

import {
  add,
  d,
  fq,
  hint,
  hintOtbor,
  koef,
  konechnaya,
  lin,
  linReshenie,
  linOboih,
  linVal,
  mul,
  num,
  podst,
  pokazatel,
  por,
  powQ,
  pw,
  q,
  razbor,
  t,
  uslovieTekst,
  val,
  voprosIz,
  vychDelenie,
  type Poryadok,
  type Q,
} from '../kit';
import { kvadratQ, poly } from '../../zadanie10/kit';
import type { Params, Prototype, Solved } from '../types';
import { ryadom } from './gruppa1';

/* ── Общий решатель ─────────────────────────────────────────────── */

/** Основание степени: число a^s или дробь 1/a^s. */
interface Osnovanie {
  /** Число a^s. */
  chislo: number;
  /** 1/a^s. */
  obratnoe: boolean;
}

function osnTex(o: Osnovanie): string {
  return o.obratnoe ? `\\left(\\dfrac{1}{${d(o.chislo)}}\\right)` : d(o.chislo);
}

/** Показатель основания по a: 49 при a = 7 → 2; 1/6 при a = 6 → −1. */
function eOsn(o: Osnovanie, a: number): number {
  let s = 0;
  let m = o.chislo;
  while (m > 1) {
    if (m % a !== 0) {
      throw new Error(`${o.chislo} — не степень ${a}`);
    }
    m /= a;
    s += 1;
  }
  return o.obratnoe ? -s : s;
}

/** «$\dfrac{1}{6}=6^{-1}$», «$49=7^2$» или пусто, если основание уже a. */
function kakStepenOsn(o: Osnovanie, a: number): string | null {
  const e = eOsn(o, a);
  if (e === 1) {
    return null;
  }
  return `$${o.obratnoe ? `\\dfrac{1}{${d(o.chislo)}}` : d(o.chislo)}=${pw(d(a), String(e))}$`;
}

/**
 * Правая часть-число: a^t как число (t ≥ 0) или 1/a^|t|; `dec` —
 * дробь десятичной записью, если она конечная: «0,5» вместо 1/2.
 */
function chisloTex(a: number, tt: number, dec = false): string {
  if (tt >= 0) {
    return d(a ** tt);
  }
  return dec && konechnaya(q(1, a ** -tt)) ? d(1 / a ** -tt) : `\\dfrac{1}{${d(a ** -tt)}}`;
}

interface Pokazatelnoe {
  a: number;
  /** Левая часть: основание и показатель kx + b. */
  L: Osnovanie;
  k: number;
  b: number;
  pr: Poryadok;
  /**
   * Правая часть: число a^tt (`dec` — десятичной дробью: «0,5») или
   * степень основания R с показателем k2·x + b2.
   */
  R: { tt: number; dec?: boolean } | { osn: Osnovanie; k2: number; b2: number; pr2: Poryadok };
  uravnenie: string;
}

/** Решить показательное уравнение, приведённое к основанию a. */
function reshitPokazatelnoe(u: Pokazatelnoe, plan: string): Solved {
  const { a, L, k, b, pr } = u;
  const eL = eOsn(L, a);
  const E = lin(k, b, 'x', pr);
  const odnoL = b === 0;
  /* Левый показатель по основанию a: eL·(kx + b). */
  const lk = eL * k;
  const lb = eL * b;
  const levyy =
    eL === 1 ? E : odnoL ? koef(lk, 'x') : eL === -1 ? lin(-k, -b, 'x', pr) : `${d(eL)}(${E})`;
  let rk: number;
  let rb: number;
  let pravyy: string;
  const stroki: string[] = [];
  const kl = kakStepenOsn(L, a);
  if (kl !== null) {
    stroki.push(
      `Основание слева: ${kl}, поэтому $${pw(osnTex(L), E)}=${pw(d(a), levyy)}$ (при возведении степени в степень показатели перемножаются).`,
    );
  }
  let pravayaChast: string;
  let pravayaPri: (x: Q) => string = () => '';
  if ('tt' in u.R) {
    const tt = u.R.tt;
    const dec = u.R.dec === true;
    rk = 0;
    rb = tt;
    pravyy = d(tt);
    pravayaChast = chisloTex(a, tt, dec);
    const drobyu = pravayaChast === chisloTex(a, tt) ? '' : `=${chisloTex(a, tt)}`;
    stroki.push(
      tt === 1
        ? `Число $${d(a)}$ — это $${d(a)}$ в первой степени: показатель равен $1$.`
        : tt === 0
          ? `Число $1$ — это $${d(a)}^0$.`
          : `Правая часть: $${pravayaChast}${drobyu}=${pw(d(a), String(tt))}$${tt < 0 ? ` (число $\\dfrac{1}{a^n}$ — это $a^{-n}$)` : ''}.`,
    );
  } else {
    const { osn, k2, b2, pr2 } = u.R;
    const eR = eOsn(osn, a);
    const F = lin(k2, b2, 'x', pr2);
    rk = eR * k2;
    rb = eR * b2;
    pravyy = eR === 1 ? F : b2 === 0 ? koef(rk, 'x') : `${eR === -1 ? '-' : d(eR)}(${F})`;
    pravayaChast = pw(osnTex(osn), F);
    pravayaPri = (x) => pw(osnTex(osn), podst(k2, b2, x, pr2));
    const kr = kakStepenOsn(osn, a);
    if (kr !== null) {
      stroki.push(`Основание справа: ${kr}, поэтому $${pw(osnTex(osn), F)}=${pw(d(a), pravyy)}$.`);
    }
  }
  const x = q(rb - lb, lk - rk);
  const ans = val(x);
  const raskryt =
    levyy === lin(lk, lb) && pravyy === lin(rk, rb)
      ? []
      : [`Раскрываем скобки: $${lin(lk, lb)}=${lin(rk, rb)}$.`];
  /* Проверка: показатели по основанию a слева и справа при x. */
  const pokL = add(mul(q(lk), x), q(lb));
  const pokR = add(mul(q(rk), x), q(rb));
  const EL = linVal(k, b, x);
  return {
    answer: ans,
    uravnenie: u.uravnenie,
    korni: [ans],
    postoronnie: [],
    etapy: razbor({
      plan: [plan],
      preobr: [
        ...stroki,
        `Уравнение: $${pw(d(a), levyy)}=${pw(d(a), pravyy)}$. Основания равны — приравниваем показатели: $${levyy}=${pravyy}$.`,
        ...raskryt,
        ...linOboih(lk, lb, rk, rb),
      ],
      korni: [`$x=${t(x)}$ — единственный корень (показательная функция монотонна).`],
      proverka: [
        `При $x=${t(x)}$ показатель слева $${E}=${podst(k, b, x, pr)}=${t(EL)}$, и левая часть равна $${pw(osnTex(L), t(EL).length === 1 ? t(EL) : `${t(EL)}`)}=${pw(d(a), t(pokL))}$; правая часть $${pravayaChast.includes('x') ? pravayaPri(x) : pravayaChast}=${pw(d(a), t(pokR))}$ — равны.`,
      ],
      answer: ans,
    }),
    vychisleniya: Math.abs(lk - rk) === 1 ? [] : vychDelenie(q(rb - lb), q(lk - rk)),
    hints: [
      hint(
        'К какому основанию привести обе части?',
        `$${d(a)}$`,
        [
          ...('tt' in u.R && Math.abs(u.R.tt) > 1 ? [`$${d(a ** Math.abs(u.R.tt))}$`] : []),
          ...(L.chislo !== a ? [`$${d(L.chislo)}$`] : []),
          `$${d(a + 1)}$`,
          '$10$',
        ],
        `Все числа в уравнении — степени числа $${d(a)}$.`,
      ),
      ...('tt' in u.R && u.R.tt !== 1
        ? [
            hint(
              `Как записать $${chisloTex(a, u.R.tt, u.R.dec === true)}$ степенью числа $${d(a)}$?`,
              `$${pw(d(a), String(u.R.tt))}$`,
              [`$${pw(d(a), String(-u.R.tt))}$`, `$${pw(d(a), String(2 * u.R.tt))}$`],
              u.R.tt < 0 ? 'Дробь $\\dfrac{1}{a^n}$ — это $a^{-n}$.' : undefined,
            ),
          ]
        : []),
      hint(
        'Какое уравнение для показателей получится?',
        `$${lin(lk, lb)}=${lin(rk, rb)}$`,
        [
          `$${lin(-lk, -lb)}=${lin(rk, rb)}$`,
          `$${lin(k, b)}=${'tt' in u.R ? chisloTex(a, u.R.tt).replace(/\\dfrac\{1\}\{(\d+)\}/, '$1') : lin(rk + 1, rb)}$`,
        ],
        eL < 0
          ? 'Минус из основания $\\dfrac{1}{a}=a^{-1}$ переходит в показатель — его легко потерять.'
          : undefined,
      ),
      hint('Чему равен $x$?', `$${t(x)}$`, ryadom(x)),
    ],
  };
}

const PLAN_OSN =
  'Показательное уравнение. План: записать обе части степенями одного основания и приравнять показатели — у равных степеней с одинаковым основанием равны и показатели (показательная функция монотонна).';

/* ── П-15 a^(x+b) = aᵏ ─────────────────────────────────────────── */

function u15(p: Params): Pokazatelnoe {
  const a = num(p, 'a');
  const b = num(p, 'b');
  const k = num(p, 'k');
  return {
    a,
    L: { chislo: a, obratnoe: false },
    k: 1,
    b,
    pr: 'xb',
    R: { tt: k },
    uravnenie: `${pw(d(a), lin(1, b))}=${d(a ** k)}`,
  };
}

const P15: Prototype = {
  id: 'P15',
  no: 15,
  group: 'III',
  title: 'Степень равна степени того же числа',
  formula: 'a^{x+b}=a^k',
  skills: ['stepeni', 'perenos'],
  fipiNos: 'Блок 1, задание 5',
  uravnenie: (p) => u15(p).uravnenie,
  uslovie(p) {
    return uslovieTekst(this.uravnenie(p), 'koren');
  },
  vopros: () => 'koren',
  chisla(p) {
    const a = num(p, 'a');
    const b = num(p, 'b');
    const k = num(p, 'k');
    return { lhs: (x) => a ** (x + b), rhs: () => a ** k, odz: () => true };
  },
  solve: (p) => reshitPokazatelnoe(u15(p), PLAN_OSN),
};

/* ── П-16 a^(kx+b) = aᵐ, показатель «b − x» и с коэффициентом ──── */

function u16(p: Params): Pokazatelnoe {
  const a = num(p, 'a');
  const k = num(p, 'k');
  const b = num(p, 'b');
  const m = num(p, 'm');
  const pr = por(p);
  return {
    a,
    L: { chislo: a, obratnoe: false },
    k,
    b,
    pr,
    R: { tt: m },
    uravnenie: `${pw(d(a), lin(k, b, 'x', pr))}=${d(a ** m)}`,
  };
}

const P16: Prototype = {
  id: 'P16',
  no: 16,
  group: 'III',
  title: 'Показатель с минусом или коэффициентом',
  formula: 'a^{b-x}=c^m',
  skills: ['stepeni', 'perenos'],
  fipiNos: 'Блок 1, задание 6',
  uravnenie: (p) => u16(p).uravnenie,
  uslovie(p) {
    return uslovieTekst(this.uravnenie(p), 'koren');
  },
  vopros: () => 'koren',
  chisla(p) {
    const a = num(p, 'a');
    const k = num(p, 'k');
    const b = num(p, 'b');
    const m = num(p, 'm');
    return { lhs: (x) => a ** (k * x + b), rhs: () => a ** m, odz: () => true };
  },
  solve: (p) =>
    reshitPokazatelnoe(
      u16(p),
      `${PLAN_OSN} Минус перед $x$ в показателе не мешает: показатели приравниваются целиком.`,
    ),
};

/* ── П-17 a^(kx+b) = (aʲ)^(mx) ──────────────────────────────────── */

function u17(p: Params): Pokazatelnoe {
  const a = num(p, 'a');
  const k = num(p, 'k');
  const b = num(p, 'b');
  const j = num(p, 'j');
  const m = num(p, 'm');
  const pr = por(p);
  const B = a ** j;
  return {
    a,
    L: { chislo: a, obratnoe: false },
    k,
    b,
    pr,
    R: { osn: { chislo: B, obratnoe: false }, k2: m, b2: 0, pr2: 'xb' },
    uravnenie: `${pw(d(a), lin(k, b, 'x', pr))}=${pw(d(B), koef(m, 'x'))}`,
  };
}

const P17: Prototype = {
  id: 'P17',
  no: 17,
  group: 'III',
  title: '$x$ в показателях обеих частей',
  formula: 'a^{x+b}=\\left(a^k\\right)^{mx}',
  skills: ['stepeni', 'perenos'],
  fipiNos: 'Блок 1, задание 7; подборка 16',
  uravnenie: (p) => u17(p).uravnenie,
  uslovie(p) {
    return uslovieTekst(this.uravnenie(p), 'koren');
  },
  vopros: () => 'koren',
  chisla(p) {
    const a = num(p, 'a');
    const k = num(p, 'k');
    const b = num(p, 'b');
    const B = a ** num(p, 'j');
    const m = num(p, 'm');
    return { lhs: (x) => a ** (k * x + b), rhs: (x) => B ** (m * x), odz: () => true };
  },
  solve: (p) =>
    reshitPokazatelnoe(
      u17(p),
      `${PLAN_OSN} Здесь $x$ есть в обоих показателях — после приравнивания получится линейное уравнение с $x$ в обеих частях.`,
    ),
};

/* ── П-18 a^(kx+b) = 1/aᵗ и (1/a)^(kx+b) = aᵗ ──────────────────── */

function u18(p: Params): Pokazatelnoe {
  const a = num(p, 'a');
  const s = num(p, 's');
  const inv = num(p, 'inv') === 1;
  const k = num(p, 'k');
  const b = num(p, 'b');
  const tt = num(p, 'tt');
  const pr = por(p);
  /* dec = 1 — правая часть десятичной дробью: $16^{x-9}=0{,}5$. */
  const dec = p.dec === 1;
  const L = { chislo: a ** s, obratnoe: inv };
  return {
    a,
    L,
    k,
    b,
    pr,
    R: { tt, dec },
    uravnenie: `${pw(osnTex(L), lin(k, b, 'x', pr))}=${tt === 1 ? d(a) : chisloTex(a, tt, dec)}`,
  };
}

const P18: Prototype = {
  id: 'P18',
  no: 18,
  group: 'III',
  title: 'Дробь $\\dfrac{1}{a}$ в основании или справа',
  formula: '\\left(\\dfrac{1}{a}\\right)^{x+b}=a^k',
  skills: ['stepeni', 'perenos'],
  fipiNos: 'Блок 1, задание 8 (1–12); Блок 2, задание 6 (1–8, 13–16); подборка 15, 17, 19',
  uravnenie: (p) => u18(p).uravnenie,
  uslovie(p) {
    return uslovieTekst(this.uravnenie(p), 'koren');
  },
  vopros: () => 'koren',
  chisla(p) {
    const a = num(p, 'a');
    const B = a ** num(p, 's');
    const osn = num(p, 'inv') === 1 ? 1 / B : B;
    const k = num(p, 'k');
    const b = num(p, 'b');
    const tt = num(p, 'tt');
    return { lhs: (x) => osn ** (k * x + b), rhs: () => a ** tt, odz: () => true };
  },
  solve: (p) =>
    reshitPokazatelnoe(
      u18(p),
      `${PLAN_OSN} Дробь с единицей в числителе — это степень с отрицательным показателем: $\\dfrac{1}{a^n}=a^{-n}$.`,
    ),
};

/* ── П-19 (1/a)^(x+b) = (aᵏ)ˣ ──────────────────────────────────── */

function u19(p: Params): Pokazatelnoe {
  const a = num(p, 'a');
  const b = num(p, 'b');
  const k = num(p, 'k');
  return {
    a,
    L: { chislo: a, obratnoe: true },
    k: 1,
    b,
    pr: 'xb',
    R: { osn: { chislo: a ** k, obratnoe: false }, k2: 1, b2: 0, pr2: 'xb' },
    uravnenie: `${pw(osnTex({ chislo: a, obratnoe: true }), lin(1, b))}=${pw(d(a ** k), 'x')}`,
  };
}

const P19: Prototype = {
  id: 'P19',
  no: 19,
  group: 'III',
  title: '$\\dfrac{1}{a}$ слева, степень $a$ справа, $x$ в обеих частях',
  formula: '\\left(\\dfrac{1}{a}\\right)^{x+b}=\\left(a^k\\right)^x',
  skills: ['stepeni', 'perenos'],
  fipiNos: 'Блок 1, задание 8 (13–16); Блок 2, задание 6 (9–12)',
  uravnenie: (p) => u19(p).uravnenie,
  uslovie(p) {
    return uslovieTekst(this.uravnenie(p), 'koren');
  },
  vopros: () => 'koren',
  chisla(p) {
    const a = num(p, 'a');
    const b = num(p, 'b');
    const B = a ** num(p, 'k');
    return { lhs: (x) => (1 / a) ** (x + b), rhs: (x) => B ** x, odz: () => true };
  },
  solve: (p) =>
    reshitPokazatelnoe(
      u19(p),
      `${PLAN_OSN} Слева основание $\\dfrac{1}{a}=a^{-1}$ — минус уйдёт в показатель.`,
    ),
};

/* ── П-29 (1/aᵐ)^(x+b) = a^(x+c) ─────────────────────────────────── */

function u29(p: Params): Pokazatelnoe {
  const a = num(p, 'a');
  const m = num(p, 'm');
  const b = num(p, 'b');
  const c = num(p, 'c');
  const L = { chislo: a ** m, obratnoe: true };
  return {
    a,
    L,
    k: 1,
    b,
    pr: 'xb',
    R: { osn: { chislo: a, obratnoe: false }, k2: 1, b2: c, pr2: 'xb' },
    uravnenie: `${pw(osnTex(L), lin(1, b))}=${pw(d(a), lin(1, c))}`,
  };
}

const P29: Prototype = {
  id: 'P29',
  no: 29,
  group: 'III',
  title: 'Дробь-степень слева, $x$ в обоих показателях',
  formula: '\\left(\\dfrac{1}{a^m}\\right)^{x+b}=a^{x+c}',
  skills: ['stepeni', 'perenos'],
  fipiNos: 'подборка 18',
  uravnenie: (p) => u29(p).uravnenie,
  uslovie(p) {
    return uslovieTekst(this.uravnenie(p), 'koren');
  },
  vopros: () => 'koren',
  chisla(p) {
    const a = num(p, 'a');
    const B = a ** num(p, 'm');
    const b = num(p, 'b');
    const c = num(p, 'c');
    return { lhs: (x) => (1 / B) ** (x + b), rhs: (x) => a ** (x + c), odz: () => true };
  },
  solve: (p) =>
    reshitPokazatelnoe(
      u29(p),
      `${PLAN_OSN} Основание слева $\\dfrac{1}{a^m}=a^{-m}$: показатель умножится на $-m$.`,
    ),
};

/* ── П-31 a^m / a^(x+b) = a^t — частное степеней ──────────────── */

/** Показатель рационального t по основанию a: 1/81 при a = 3 → −4; не степень — null. */
export function pokazatelQ(x: Q, a: number): number | null {
  if (x.n <= 0) {
    return null;
  }
  if (x.m === 1) {
    return pokazatel(x.n, a);
  }
  if (x.n === 1) {
    const e = pokazatel(x.m, a);
    return e === null ? null : -e;
  }
  return null;
}

/** «Число $3$ — это $3$ в первой степени», «$9=3^2$», «$\dfrac{1}{81}=3^{-4}$». */
function chisloKakStepen(a: number, e: number): string {
  if (e === 1) {
    return `число $${d(a)}$ — это $${d(a)}$ в первой степени`;
  }
  return `$${chisloTex(a, e)}=${pw(d(a), d(e))}$`;
}

const P31: Prototype = {
  id: 'P31',
  no: 31,
  group: 'III',
  title: 'Частное степеней с одним основанием',
  formula: '\\dfrac{a^m}{a^{x+b}}=a^k',
  skills: ['stepeni', 'perenos'],
  fipiNos: '',
  uravnenie(p) {
    const a = num(p, 'a');
    return `\\dfrac{${d(a ** num(p, 'm'))}}{${pw(d(a), lin(1, num(p, 'b')))}}=${chisloTex(a, num(p, 'tt'))}`;
  },
  uslovie(p) {
    return uslovieTekst(this.uravnenie(p), 'koren');
  },
  vopros: () => 'koren',
  chisla(p) {
    const a = num(p, 'a');
    const m = num(p, 'm');
    const b = num(p, 'b');
    const tt = num(p, 'tt');
    return { lhs: (x) => a ** m / a ** (x + b), rhs: () => a ** tt, odz: () => true };
  },
  solve(p) {
    const a = num(p, 'a');
    const m = num(p, 'm');
    const b = num(p, 'b');
    const tt = num(p, 'tt');
    const M = a ** m;
    const Z = lin(1, b);
    /* Показатель после деления: m − (x + b) = (m − b) − x. */
    const E = lin(-1, m - b, 'x', 'bx');
    const x = m - b - tt;
    const xq = q(x);
    const prav = chisloTex(a, tt);
    const pokZ = x + b;
    return {
      answer: x,
      uravnenie: this.uravnenie(p),
      korni: [x],
      postoronnie: [],
      etapy: razbor({
        plan: [
          'Показательное уравнение: слева частное двух степеней одного числа. План: записать числитель и правую часть степенями одного основания, разделить степени (показатели вычитаются) и приравнять показатели.',
        ],
        preobr: [
          `Числитель: ${chisloKakStepen(a, m)}.`,
          `При делении степеней с одинаковым основанием показатели вычитаются: $\\dfrac{${pw(d(a), d(m))}}{${pw(d(a), Z)}}=${pw(d(a), b === 0 ? E : `${d(m)}-(${Z})`)}${b === 0 ? '' : `=${pw(d(a), E)}`}$.`,
          `Правая часть: ${chisloKakStepen(a, tt)}.`,
          `Основания равны — приравниваем показатели: $${E}=${d(tt)}$.`,
          ...linReshenie(-1, m - b, q(tt), 'bx'),
        ],
        korni: [`$x=${d(x)}$ — единственный корень (показательная функция монотонна).`],
        proverka: [
          `$\\dfrac{${d(M)}}{${pw(d(a), d(pokZ))}}=${pw(d(a), d(m - pokZ))}${tt === 1 ? '' : `=${prav}`}$ — верно.`,
        ],
        answer: x,
      }),
      vychisleniya: [],
      hints: [
        hint(
          'Как записать левую часть одной степенью?',
          `$${pw(d(a), E)}$`,
          [`$${pw(d(a), lin(1, b - m))}$`, `$${pw(d(a), lin(1, b + m))}$`],
          'Делим степени — показатели вычитаются: $\\dfrac{a^m}{a^n}=a^{m-n}$.',
        ),
        ...(tt === 1
          ? []
          : [
              hint(
                `Как записать $${prav}$ степенью числа $${d(a)}$?`,
                `$${pw(d(a), d(tt))}$`,
                tt === 0
                  ? [`$${pw(d(a), '-1')}$`, `$${d(a)}$`]
                  : [`$${pw(d(a), d(-tt))}$`, `$${pw(d(a), d(2 * tt))}$`],
                tt < 0 ? 'Дробь $\\dfrac{1}{a^n}$ — это $a^{-n}$.' : undefined,
              ),
            ]),
        hint('Какое уравнение для показателей получится?', `$${E}=${d(tt)}$`, [
          `$${lin(1, b - m)}=${d(tt)}$`,
          `$${lin(1, b + m)}=${d(tt)}$`,
        ]),
        hint('Чему равен $x$?', `$${d(x)}$`, ryadom(xq)),
      ],
    };
  },
};

/* ── П-32 (a²)^(x+p) ± K·a^(x+q) + c = 0 — замена t = aˣ ────────── */

interface Kv32 {
  a: number;
  p: number;
  s: number;
  K: number;
  qq: number;
  c: number;
  /** Коэффициенты квадратного уравнения A·t² + B·t + C = 0, t = aˣ. */
  A: number;
  B: number;
  C: number;
}

function kv32(p: Params): Kv32 {
  const a = num(p, 'a');
  const pp = num(p, 'p');
  const s = num(p, 's');
  const K = num(p, 'K');
  const qq = num(p, 'q');
  const c = num(p, 'c');
  return { a, p: pp, s, K, qq, c, A: a ** (2 * pp), B: s * K * a ** qq, C: c };
}

/** Средний член: «-2^{x+3}», «+4\cdot3^x». */
function chlen32(u: Kv32, pokazatel: string): string {
  return `${u.s < 0 ? '-' : '+'}${u.K === 1 ? '' : `${d(u.K)}\\cdot`}${pw(d(u.a), pokazatel)}`;
}

/** Слагаемое-число со знаком: «+1», «-24». */
function svobodnyy(c: number): string {
  return `${c < 0 ? '-' : '+'}${d(Math.abs(c))}`;
}

/** A·(aˣ)² + B·aˣ + C в TeX. */
function cherezAx(u: Kv32): string {
  const ax = `${d(u.a)}^x`;
  const pervyy = u.A === 1 ? `(${ax})^2` : `${d(u.A)}\\cdot(${ax})^2`;
  const B = Math.abs(u.B);
  return `${pervyy}${u.B < 0 ? '-' : '+'}${B === 1 ? '' : `${d(B)}\\cdot`}${ax}${svobodnyy(u.C)}`;
}

const P32: Prototype = {
  id: 'P32',
  no: 32,
  group: 'III',
  title: 'Показательное уравнение, сводящееся к квадратному',
  formula: '\\left(a^2\\right)^{x+p}+k\\cdot a^{x+q}+c=0',
  skills: ['stepeni', 'diskriminant'],
  fipiNos: '',
  uravnenie(p) {
    const u = kv32(p);
    return `${pw(d(u.a * u.a), lin(1, u.p))}${chlen32(u, lin(1, u.qq))}${svobodnyy(u.c)}=0`;
  },
  uslovie(p) {
    return uslovieTekst(this.uravnenie(p), this.vopros(p));
  },
  vopros: (p) => voprosIz(p, ['koren', 'menshiy', 'bolshiy']),
  chisla(p) {
    const u = kv32(p);
    const b = u.a * u.a;
    return {
      lhs: (x) => b ** (x + u.p) + u.s * u.K * u.a ** (x + u.qq) + u.c,
      rhs: () => 0,
      odz: () => true,
    };
  },
  solve(p) {
    const u = kv32(p);
    const { a, A, B, C } = u;
    const b = a * a;
    const v = this.vopros(p);
    const kv = kvadratQ(q(A), q(B), q(C), 't');
    const [t1, t2] = kv.roots;
    const tKorni = t1.n * t2.m === t2.n * t1.m ? [t1] : [t1, t2];
    const otbros = tKorni.filter((x) => x.n <= 0);
    const ostalis = tKorni.filter((x) => x.n > 0);
    const korni = ostalis.map((x) => {
      const e = pokazatelQ(x, a);
      if (e === null) {
        throw new Error(`П-32: t = ${fq(x)} — не степень ${a}`);
      }
      return { t: x, x: e };
    });
    if (korni.length === 0) {
      throw new Error('П-32: нет положительных t');
    }
    if ((korni.length === 1) !== (v === 'koren')) {
      throw new Error(`П-32: корней ${korni.length}, вопрос ${v}`);
    }
    const xs = korni.map((k) => k.x).sort((x, y) => x - y);
    const ans = v === 'bolshiy' ? (xs.at(-1) as number) : (xs[0] as number);
    const tStr = (x: Q) => fq(x);
    const kvTex = `${poly(A, B, C, 't')}=0`;
    const pervyy =
      u.p === 0
        ? `$${pw(d(b), 'x')}=(${d(a)}^2)^x=(${d(a)}^x)^2$.`
        : `$${pw(d(b), lin(1, u.p))}=${pw(d(b), d(u.p))}\\cdot${d(b)}^x=${d(A)}\\cdot(${d(a)}^x)^2$.`;
    const vtoroy =
      u.qq === 0
        ? []
        : [
            `$${pw(d(a), lin(1, u.qq))}=${pw(d(a), d(u.qq))}\\cdot${d(a)}^x${u.qq === 1 ? '' : `=${d(a ** u.qq)}\\cdot${d(a)}^x`}$.`,
          ];
    /* Подстановка ответа: значения слагаемых. */
    const T1 = powQ(q(b), ans + u.p);
    const T2 = mul(q(u.K), powQ(q(a), ans + u.qq));
    const drugoy = xs.find((x) => x !== ans);
    return {
      answer: ans,
      uravnenie: this.uravnenie(p),
      korni: xs,
      postoronnie: [],
      etapy: razbor({
        plan: [
          `Показательное уравнение, которое сводится к квадратному: $${d(b)}=${d(a)}^2$, поэтому $${d(b)}^x=(${d(a)}^x)^2$. План: записать все степени через $${d(a)}^x$, сделать замену $t=${d(a)}^x$ ($t>0$), решить квадратное уравнение, отбросить неположительные $t$ и вернуться к $x$.`,
        ],
        preobr: [
          pervyy,
          ...vtoroy,
          `Уравнение: $${cherezAx(u)}=0$.`,
          `Замена $t=${d(a)}^x$, где $t>0$: $${kvTex}$.`,
          ...kv.lines,
          ...otbros.map(
            (x) =>
              `$t=${tStr(x)}$ не подходит: $${d(a)}^x>0$ при любом $x$ — уравнение $${d(a)}^x=${tStr(x)}$ корней не имеет.`,
          ),
          ...korni.map((k) =>
            k.x === 1
              ? `$${d(a)}^x=${d(a)}$, откуда $x=1$.`
              : `$${d(a)}^x=${tStr(k.t)}=${pw(d(a), d(k.x))}$, откуда $x=${d(k.x)}$.`,
          ),
        ],
        korni: [
          xs.length === 1
            ? `$x=${d(ans)}$.`
            : `$x=${d(xs[0] as number)}$ или $x=${d(xs[1] as number)}$.`,
        ],
        ...(xs.length > 1
          ? {
              otbor: [
                `Корней два: $${d(xs[0] as number)}$ и $${d(xs[1] as number)}$. В ответ — ${v === 'menshiy' ? 'меньший' : 'больший'}: $${d(ans)}$.`,
              ],
            }
          : {}),
        proverka: [
          `$${pw(d(b), d(ans + u.p))}${chlen32(u, d(ans + u.qq))}${svobodnyy(u.c)}=${t(T1)}${u.s < 0 ? '-' : '+'}${t(T2)}${svobodnyy(u.c)}=0$ — верно.`,
        ],
        answer: ans,
      }),
      vychisleniya: [
        {
          tekst: 'Корни квадратного уравнения удобно проверить по теореме Виета:',
          tex: `t_1+t_2=${t(q(-B, A))},\\quad t_1t_2=${t(q(C, A))}`,
        },
      ],
      hints: [
        hint(
          'Какую замену сделать?',
          `$t=${d(a)}^x$`,
          [`$t=${d(b)}^x$`, '$t=x^2$', `$t=${d(a)}x$`],
          `$${d(b)}^x=(${d(a)}^x)^2=t^2$.`,
        ),
        hint('Какое квадратное уравнение получится?', `$${kvTex}$`, [
          A === 1 ? `$${poly(A, -B, C, 't')}=0$` : `$${poly(1, B, C, 't')}=0$`,
          `$${poly(A, B, -C, 't')}=0$`,
        ]),
        tKorni.length === 1
          ? hint('Чему равен корень квадратного уравнения?', `$t=${tStr(t1)}$`, [
              `$t=${tStr(q(-t1.n, t1.m))}$`,
              `$t=${tStr(mul(t1, q(a)))}$`,
            ])
          : hint('Какие корни у квадратного уравнения?', `$${tStr(t1)}$ и $${tStr(t2)}$`, [
              `$${tStr(q(-t1.n, t1.m))}$ и $${tStr(q(-t2.n, t2.m))}$`,
              `$${tStr(t1)}$ и $${tStr(q(-t2.n, t2.m))}$`,
            ]),
        ...otbros.map((x) =>
          hint(
            `Подходит ли $t=${tStr(x)}$?`,
            `нет: $${d(a)}^x>0$`,
            ['да', `да, если $x<0$`],
            'Степень положительного числа всегда положительна.',
          ),
        ),
        xs.length === 1
          ? hint('Чему равен $x$?', `$${d(ans)}$`, ryadom(q(ans)))
          : hintOtbor(
              v,
              `$${d(ans)}$`,
              [`$${d(drugoy as number)}$`, `$${d(-ans)}$`].filter((o) => o !== `$${d(ans)}$`),
            ),
      ],
    };
  },
};

export const GRUPPA_III: Prototype[] = [P15, P16, P17, P18, P19, P29, P31, P32];
