/**
 * Группа III — показательные уравнения (П-15 … П-19, П-29).
 *
 * Общий приём: записать обе части степенями одного основания и
 * приравнять показатели. Показательная функция монотонна — каждое
 * значение принимает один раз, поэтому из a^E = a^F следует E = F и
 * корень единственный.
 */

import {
  add,
  d,
  hint,
  koef,
  lin,
  linOboih,
  linVal,
  mul,
  num,
  podst,
  por,
  pw,
  q,
  razbor,
  t,
  uslovieTekst,
  val,
  vychDelenie,
  type Poryadok,
  type Q,
} from '../kit';
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

/** Правая часть-число: a^t как число (t ≥ 0) или 1/a^|t|. */
function chisloTex(a: number, tt: number): string {
  return tt >= 0 ? d(a ** tt) : `\\dfrac{1}{${d(a ** -tt)}}`;
}

interface Pokazatelnoe {
  a: number;
  /** Левая часть: основание и показатель kx + b. */
  L: Osnovanie;
  k: number;
  b: number;
  pr: Poryadok;
  /** Правая часть: число a^tt или степень основания R с показателем k2·x + b2. */
  R: { tt: number } | { osn: Osnovanie; k2: number; b2: number; pr2: Poryadok };
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
    rk = 0;
    rb = tt;
    pravyy = d(tt);
    pravayaChast = chisloTex(a, tt);
    stroki.push(
      tt === 1
        ? `Число $${d(a)}$ — это $${d(a)}$ в первой степени: показатель равен $1$.`
        : tt === 0
          ? `Число $1$ — это $${d(a)}^0$.`
          : `Правая часть: $${chisloTex(a, tt)}=${pw(d(a), String(tt))}$${tt < 0 ? ` (число $\\dfrac{1}{a^n}$ — это $a^{-n}$)` : ''}.`,
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
              `Как записать $${chisloTex(a, u.R.tt)}$ степенью числа $${d(a)}$?`,
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
  const L = { chislo: a ** s, obratnoe: inv };
  return {
    a,
    L,
    k,
    b,
    pr,
    R: { tt },
    uravnenie: `${pw(osnTex(L), lin(k, b, 'x', pr))}=${tt === 1 ? d(a) : chisloTex(a, tt)}`,
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

export const GRUPPA_III: Prototype[] = [P15, P16, P17, P18, P19, P29];
