/**
 * Прототипы общего вида P22–P35 задания «Наибольшее и наименьшее
 * значение функции»: формы, которых нет у P01–P21, — многочлен с
 * любыми коэффициентами и любым отрезком, $x^{3/2}$, $(x-p)^2(x-q)$,
 * многочлен на $e^{kx+b}$, $ax^2+bx+c\ln x$, $K\ln(x+a)^n$,
 * $e^{2x}$ с заменой $t = e^x$, монотонные тригонометрические.
 *
 * Разбор — общими схемами obshchiy.ts: знаки производной считаются по
 * самой производной. Каждый прототип сам подбирает числа так, чтобы
 * ответ был целым или конечной десятичной дробью.
 */

import type { Rng } from '@/lib/veroyatnost/generator';
import {
  drobObyknovennaya,
  drobT,
  naOtrezkeObshchiy,
  nod,
  pDer,
  pKorni,
  pRazlozhenie,
  pStepen,
  pTex,
  pVal,
  schetPoSlagaemym,
  tochkaChisla,
  tochkaPoZnakam,
  tochkaT,
  type Poly,
  type Tochka,
} from './obshchiy';
import {
  N,
  S,
  cel as slCel,
  oblastDvuh,
  plusC,
  uslovieOtrezka,
  uslovieTochki,
  znakOt,
  type Cel,
} from './razbor';
import { num, okrugl, summa, xMinus } from './tex';
import type { Chisla, Params, Prototype } from './types';

const C = (p: Params): Cel => S(p, 'cel') as Cel;

/** Ответ для бланка: целое или конечная дробь до двух знаков. */
const goden = (v: number): boolean =>
  Number.isFinite(v) && Math.abs(v) < 10000 && Math.abs(Math.round(v * 100) - v * 100) < 1e-6;

/** Повторять генератор, пока параметры не годятся. */
function poka(r: Rng, gen: (r: Rng) => Params | null): Params {
  for (let i = 0; i < 500; i += 1) {
    const p = gen(r);
    if (p !== null) return p;
  }
  throw new Error('№21: генератор не нашёл задачу');
}

/* ── Многочлен: коэффициенты c0…c5 и порядок записи ─────────────── */

function koef(p: Params): number[] {
  const c: number[] = [];
  for (let k = 0; k <= 5; k += 1) c.push(p[`c${k}`] === undefined ? 0 : N(p, `c${k}`));
  return c.slice(0, pStepen(c) + 1);
}

function porPoly(p: Params, c: Poly): number[] | undefined {
  const por = p.por === undefined ? undefined : S(p, 'por').split('').map(Number);
  return por?.filter((k) => okrugl(c[k] ?? 0) !== 0 || k === 0);
}

function polyParams(c: readonly number[], extra: Params): Params {
  const out: Params = {};
  c.forEach((a, k) => {
    if (okrugl(a) !== 0) out[`c${k}`] = okrugl(a);
  });
  return { ...out, ...extra };
}

/** Производная многочлена: «3x^2+24x+36 = 3(x+6)(x+2)». */
function dPoly(c: Poly): { d: number[]; tex: string; razl: string } {
  const d = pDer(c);
  const tex = pTex(d);
  const razl = pRazlozhenie(d);
  return { d, tex: razl === tex ? tex : `${tex} = ${razl}`, razl };
}

function nuliPoly(razl: string, korni: readonly Tochka[]): string {
  const xs = korni.map((t) => `$x = ${t.tex}$`).join(' или ');
  return `$${razl} = 0$: ${xs}.`;
}

/** Нули производной многочлена — точки с подписью, без повторов. */
function korniPoly(d: Poly): Tochka[] {
  return pKorni(d).map((k) => tochkaChisla(k.x));
}

/** Многочлен на отрезке и точка экстремума: общая часть P22 и P23. */
function poly(p: Params) {
  const c = koef(p);
  const fn = `y = ${pTex(c, porPoly(p, c))}`;
  const dd = dPoly(c);
  const korni = korniPoly(dd.d);
  return {
    c,
    fn,
    d: dd.tex,
    razl: dd.razl,
    korni,
    f: (x: number) => pVal(c, x),
    df: (x: number) => pVal(dd.d, x),
  };
}

/* P22 — точка экстремума многочлена общего вида. */

function genP22(r: Rng): Params {
  return poka(r, (): Params | null => {
    const ce = slCel(r);
    const c0 = r.int(-20, 30);
    if (r.int(0, 1) === 0) {
      /* x(x + m)^2 + c: нули −m и −m/3. */
      const m = znakOt(r, 1, 12);
      const c = [c0, m * m, 2 * m, 1];
      const t = [-m, -m / 3].sort((a, b) => a - b) as [number, number];
      const otvet = ce === 'max' ? t[0] : t[1];
      if (!goden(otvet)) return null;
      return polyParams(c, { forma: 'kv', cel: ce });
    }
    /* s(x^3 − 1,5(r1 + r2)x^2 + 3r1r2x) + c: целые нули одной чётности. */
    const r1 = r.int(-9, 7);
    const r2 = r1 + 2 * r.int(1, 6);
    const s = r.pick([1, 1, -1]);
    const c = [c0, s * 3 * r1 * r2, s * -1.5 * (r1 + r2), s];
    return polyParams(c, { forma: 'dva', cel: ce });
  });
}

const P22: Prototype = {
  id: 'P22',
  vid: 1,
  vopros: 'A',
  title: 'Точка экстремума: многочлен общего вида',
  primer: 'y = x^3 + 12x^2 + 36x + 20',
  gen: genP22,
  uslovie: (p) => uslovieTochki(C(p), poly(p).fn),
  solve: (p) => {
    const m = poly(p);
    return tochkaPoZnakam({
      cel: C(p),
      fn: m.fn,
      d: m.d,
      nuli: [nuliPoly(m.razl, m.korni)],
      korni: m.korni,
      df: m.df,
    });
  },
  chisla: (p) => {
    const m = poly(p);
    const [a, b] = [m.korni[0]?.x ?? 0, m.korni[m.korni.length - 1]?.x ?? 0];
    const s = P22.solve(p).answer;
    return { f: m.f, otrezok: oblastDvuh(a, b, s), cel: C(p), chto: 'tochka' };
  },
};

/* P23 — многочлен на отрезке: любые коэффициенты и концы. */

function konecT(p: Params, k: 'lo' | 'hi'): Tochka {
  return drobT(N(p, k));
}

function genP23(r: Rng): Params {
  return poka(r, (): Params | null => {
    const forma = r.pick(['kub', 'kub', 'kv', 'pyat', 'pyat2'] as const);
    if (forma === 'pyat') {
      /* 3x^5 − 5m^2x^3 + c: нули 0 (двойной) и ±m. */
      const m = r.int(1, 2);
      const c = [r.int(-15, 20), 0, 0, -5 * m * m, 0, 3];
      return r.int(0, 1) === 0
        ? polyParams(c, { forma, lo: -m - r.int(1, 6), hi: 0, cel: 'max' })
        : polyParams(c, { forma, lo: 0, hi: m + r.int(1, 6), cel: 'min' });
    }
    if (forma === 'pyat2') {
      /* x^5 + 5/3(n − m^2)x^3 − 5m^2nx: y' = 5(x^2 − m^2)(x^2 + n). */
      const m = r.int(1, 2);
      const n = r.pick(m === 1 ? [4, 7, 10, 13] : [1, 7, 10]);
      const c = [0, -5 * m * m * n, 0, (5 / 3) * (n - m * m), 0, 1];
      return r.int(0, 1) === 0
        ? polyParams(c, { forma, lo: -m - r.int(1, 8), hi: r.int(-m + 1, m), cel: 'max' })
        : polyParams(c, { forma, lo: r.int(-m, m - 1), hi: m + r.int(1, 8), cel: 'min' });
    }
    /* Кубический: s(x^3 − 1,5(r1 + r2)x^2 + 3r1r2x) + c. */
    const r1 = forma === 'kv' ? 0 : r.int(-8, 6);
    const r2 = r1 + 2 * r.int(1, 5);
    const s = forma === 'kv' ? -1 : r.pick([1, -1]);
    const c = [r.int(-20, 30), s * 3 * r1 * r2, s * -1.5 * (r1 + r2), s];
    const ce = slCel(r);
    /* Нужная точка: у s = 1 максимум в r1, минимум в r2; у s = −1 наоборот. */
    const t = (ce === 'max') === (s === 1) ? r1 : r2;
    const levaya = t === r1;
    const lo = levaya ? t - r.int(1, 5) : r.pick([r1, r1 + 1, t - 1]);
    const hi = levaya ? r.pick([r2, r2 - 1, t + 1]) : t + r.int(1, 5);
    if (!(lo < t && t < hi)) return null;
    return polyParams(c, {
      forma,
      lo,
      hi,
      cel: ce,
      ...(forma === 'kv' ? { por: '2310' } : {}),
    });
  });
}

const P23: Prototype = {
  id: 'P23',
  vid: 1,
  vopros: 'B',
  title: 'Многочлен общего вида на отрезке',
  primer: 'y = 3x^5 - 5x^3 + 1,\\ [-7;\\,0]',
  gen: genP23,
  uslovie: (p) => uslovieOtrezka(C(p), poly(p).fn, konecT(p, 'lo').tex, konecT(p, 'hi').tex),
  solve: (p) => {
    const m = poly(p);
    const por = porPoly(p, m.c) ?? Array.from({ length: m.c.length }, (_, i) => m.c.length - 1 - i);
    return naOtrezkeObshchiy({
      cel: C(p),
      fn: m.fn,
      d: m.d,
      nuli: [nuliPoly(m.razl, m.korni)],
      lo: konecT(p, 'lo'),
      hi: konecT(p, 'hi'),
      korni: m.korni,
      f: m.f,
      df: m.df,
      schet: (t) => [
        schetPoSlagaemym(
          t,
          por.map((k) => (m.c[k] ?? 0) * t.x ** k),
          okrugl(m.f(t.x)),
        ),
      ],
    });
  },
  chisla: (p) => ({
    f: poly(p).f,
    otrezok: [konecT(p, 'lo').x, konecT(p, 'hi').x],
    cel: C(p),
    chto: 'znachenie',
  }),
};

/* ── Степень x^{3/2} ─────────────────────────────────────────────── */

/** «\frac{3}{2}», «3», «6»: коэффициент 1,5·A. */
function poltora(A: number): string {
  const v = 1.5 * A;
  return Number.isInteger(v) ? (v === 1 ? '' : num(v)) : `\\frac{${3 * A}}{2}`;
}

/** P24: Ax^{3/2} − Bx + C (min) или C + Bx − Ax^{3/2} (max), B = 1,5At. */
function step24(p: Params) {
  const A = N(p, 'A');
  const t = N(p, 't');
  const c = N(p, 'c');
  const B = 1.5 * A * t;
  const max = C(p) === 'max';
  const s = max ? -1 : 1;
  return {
    fn: max
      ? `y = ${summa([
          [c, ''],
          [B, 'x'],
          [-A, 'x^{3/2}'],
        ])}`
      : `y = ${summa([
          [A, 'x^{3/2}'],
          [-B, 'x'],
          [c, ''],
        ])}`,
    d: max ? `${num(B)}-${poltora(A)}\\sqrt{x}` : `${poltora(A)}\\sqrt{x}-${num(B)}`,
    x0: t * t,
    t,
    f: (x: number) => s * (A * x ** 1.5 - B * x) + c,
    df: (x: number) => s * (1.5 * A * Math.sqrt(x) - B),
  };
}

const ODZ_STEP =
  'Область определения: $x \\ge 0$. Степень $x^{3/2} = x\\sqrt{x}$, её производная $\\frac32x^{1/2} = \\frac32\\sqrt{x}$.';

const P24: Prototype = {
  id: 'P24',
  vid: 2,
  vopros: 'A',
  title: 'Точка экстремума: степень $x^{3/2}$',
  primer: 'y = x^{3/2} - 18x + 29',
  gen: (r) => {
    const A = r.pick([1, 1, 2, 2, 4]);
    const t = A === 1 ? 2 * r.int(1, 9) : r.int(2, 14);
    return { A, t, c: r.int(-20, 30), cel: slCel(r) };
  },
  uslovie: (p) => uslovieTochki(C(p), step24(p).fn),
  solve: (p) => {
    const s = step24(p);
    return tochkaPoZnakam({
      cel: C(p),
      fn: s.fn,
      d: s.d,
      odz: ODZ_STEP,
      nuli: [`$\\sqrt{x} = ${num(s.t)}$, $x = ${num(s.x0)}$.`],
      korni: [drobT(s.x0)],
      granica: { t: drobT(0), zakryta: true },
      df: s.df,
    });
  },
  chisla: (p) => {
    const s = step24(p);
    return { f: s.f, otrezok: [s.x0 / 16, 4 * s.x0], cel: C(p), chto: 'tochka' };
  },
};

/** P25: Ax\sqrt{x} + Bx + C на отрезке, A — число или «2/3». */
function koren25(p: Params) {
  const A23 = S(p, 'A') === '2/3';
  const A = A23 ? 2 / 3 : N(p, 'A');
  const t = N(p, 't');
  const c = N(p, 'c');
  const max = C(p) === 'max';
  const s = max ? -1 : 1;
  const B = 1.5 * A * t;
  const xs = A23 ? '\\frac{2}{3}x\\sqrt{x}' : 'x\\sqrt{x}';
  const kA = A23 ? 1 : A;
  const dA = A23 ? '' : poltora(A);
  return {
    fn: max
      ? `y = ${summa([
          [c, ''],
          [B, 'x'],
          [-kA, xs],
        ])}`
      : `y = ${summa([
          [kA, xs],
          [-B, 'x'],
          [c, ''],
        ])}`,
    d: max ? `${num(B)}-${dA}\\sqrt{x}` : `${dA}\\sqrt{x}-${num(B)}`,
    x0: t * t,
    t,
    A,
    B,
    s,
    c,
    f: (x: number) => s * (A * x * Math.sqrt(x) - B * x) + c,
    df: (x: number) => s * (1.5 * A * Math.sqrt(x) - B),
  };
}

const P25: Prototype = {
  id: 'P25',
  vid: 2,
  vopros: 'B',
  title: 'Функция с корнем на отрезке: общий вид',
  primer: 'y = x\\sqrt{x} - 9x + 23,\\ [1;\\,49]',
  gen: (r) =>
    poka(r, (): Params | null => {
      const A = r.pick(['1', '2', '4', '2/3'] as const);
      const t = A === '1' ? 2 * r.int(1, 6) : A === '2/3' ? 3 * r.int(1, 4) : r.int(1, 9);
      const x0 = t * t;
      const lo = r.pick([0, Math.max(0, x0 - r.int(1, 20)), r.int(0, x0 - 1)]);
      const hi = r.pick([x0, x0 + r.int(1, 30)]);
      if (!(lo < hi && lo < x0)) return null;
      return { A, t, c: r.int(-20, 30), lo, hi, cel: r.pick(['min', 'min', 'max']) };
    }),
  uslovie: (p) => uslovieOtrezka(C(p), koren25(p).fn, num(N(p, 'lo')), num(N(p, 'hi'))),
  solve: (p) => {
    const k = koren25(p);
    return naOtrezkeObshchiy({
      cel: C(p),
      fn: k.fn,
      d: k.d,
      odz: "Область определения: $x \\ge 0$; отрезок в неё входит. $(x\\sqrt{x})' = (x^{3/2})' = \\frac32\\sqrt{x}$.",
      nuli: [`$\\sqrt{x} = ${num(k.t)}$, $x = ${num(k.x0)}$.`],
      lo: drobT(N(p, 'lo')),
      hi: drobT(N(p, 'hi')),
      korni: [drobT(k.x0)],
      f: k.f,
      df: k.df,
      schet: (t) => [
        schetPoSlagaemym(
          t,
          [k.s * k.A * t.x * Math.sqrt(t.x), -k.s * k.B * t.x, k.c],
          okrugl(k.f(t.x)),
        ),
      ],
    });
  },
  chisla: (p) => ({
    f: koren25(p).f,
    otrezok: [N(p, 'lo'), N(p, 'hi')],
    cel: C(p),
    chto: 'znachenie',
  }),
};

/* ── (x − p)²(x − q) + c ─────────────────────────────────────────── */

function kvLin(p: Params) {
  const pp = N(p, 'p');
  const q = N(p, 'q');
  const c = N(p, 'c');
  const xp = xMinus(pp);
  const xq = xMinus(q);
  const sum = pp + 2 * q;
  const vtoroy = summa([
    [3, 'x'],
    [-sum, ''],
  ]);
  return {
    fn: `y = (${xp})^2(${xq})${plusC(c)}`,
    d:
      `2(${xp})(${xq})+(${xp})^2 = (${xp})(${vtoroy})` +
      (sum % 3 === 0 ? ` = 3(${xp})(${xMinus(sum / 3)})` : ''),
    nuli: `$x = ${num(pp)}$ или $${vtoroy} = 0$, $x = ${drobT(sum, 3).tex}$.`,
    korni: [drobT(pp), drobT(sum, 3)].sort((a, b) => a.x - b.x),
    f: (x: number) => (x - pp) ** 2 * (x - q) + c,
    df: (x: number) => (x - pp) * (3 * x - sum),
  };
}

function genKvLin(r: Rng, naOtrezke: boolean): Params {
  return poka(r, (): Params | null => {
    const pp = znakOt(r, 1, 12);
    const q = r.int(-12, 12);
    if (q === 0 || q === pp) return null;
    const s = (pp + 2 * q) / 3;
    const c = r.int(-15, 15);
    if (!naOtrezke) {
      const ce = slCel(r);
      const otvet = ce === 'max' ? Math.min(pp, s) : Math.max(pp, s);
      if (!goden(otvet)) return null;
      return { p: pp, q, c, cel: ce };
    }
    /* На отрезке: точка p — экстремум, второй нуль — снаружи. */
    const ce: Cel = pp < s ? 'max' : 'min';
    const lo = pp < s ? pp - r.pick([1, 2, 3, 2.5, 1.5]) : Math.max(s, pp - r.pick([0.5, 1, 2]));
    const hi = pp < s ? Math.min(s, pp + r.pick([0.5, 1, 2])) : pp + r.pick([1, 2, 3, 2.5, 1.5]);
    if (!(lo < pp && pp < hi) || !goden(lo) || !goden(hi)) return null;
    return { p: pp, q, c, lo, hi, cel: ce };
  });
}

const P26: Prototype = {
  id: 'P26',
  vid: 1,
  vopros: 'A',
  title: 'Точка экстремума: $(x - p)^2(x - q) + c$',
  primer: 'y = (x - 4)^2(x + 5) + 8',
  gen: (r) => genKvLin(r, false),
  uslovie: (p) => uslovieTochki(C(p), kvLin(p).fn),
  solve: (p) => {
    const k = kvLin(p);
    return tochkaPoZnakam({
      cel: C(p),
      fn: k.fn,
      d: k.d,
      odz: "Производная произведения: $(uv)' = u'v + uv'$.",
      nuli: [k.nuli],
      korni: k.korni,
      df: k.df,
    });
  },
  chisla: (p) => {
    const k = kvLin(p);
    const [a, b] = [(k.korni[0] as Tochka).x, (k.korni[1] as Tochka).x];
    return {
      f: k.f,
      otrezok: oblastDvuh(a, b, P26.solve(p).answer, a - 4, b + 4),
      cel: C(p),
      chto: 'tochka',
    };
  },
};

const P27: Prototype = {
  id: 'P27',
  vid: 1,
  vopros: 'B',
  title: '$(x - p)^2(x - q) + c$ на отрезке',
  primer: 'y = (x + 3)^2(x + 7) + 10,\\ [-5;\\,6]',
  gen: (r) => genKvLin(r, true),
  uslovie: (p) => uslovieOtrezka(C(p), kvLin(p).fn, num(N(p, 'lo')), num(N(p, 'hi'))),
  solve: (p) => {
    const k = kvLin(p);
    return naOtrezkeObshchiy({
      cel: C(p),
      fn: k.fn,
      d: k.d,
      odz: "Производная произведения: $(uv)' = u'v + uv'$.",
      nuli: [k.nuli],
      lo: drobT(N(p, 'lo')),
      hi: drobT(N(p, 'hi')),
      korni: k.korni,
      f: k.f,
      df: k.df,
      schet: (t) => [
        `$y(${t.tex}) = (${num(t.x)}${plusC(-N(p, 'p'))})^2\\cdot(${num(t.x)}${plusC(-N(p, 'q'))})${plusC(N(p, 'c'))} = ${num(okrugl(k.f(t.x)))}$.`,
      ],
    });
  },
  chisla: (p) => ({
    f: kvLin(p).f,
    otrezok: [N(p, 'lo'), N(p, 'hi')],
    cel: C(p),
    chto: 'znachenie',
  }),
};

/* ── Многочлен на e^{kx + b} ─────────────────────────────────────── */

/**
 * Множитель: vid 'lin' — u·x + v (при u < 0 пишется «v − x»),
 * 'kv' — (x + a)^2, 'tri' — a2·x^2 + a1·x + a0.
 */
function mnozhitel(p: Params): { c: number[]; tex: string; dTex: string } {
  const vid = S(p, 'vid');
  if (vid === 'kv') {
    const a = N(p, 'a');
    const xa = summa([
      [1, 'x'],
      [a, ''],
    ]);
    return { c: [a * a, 2 * a, 1], tex: `(${xa})^2`, dTex: `2(${xa})` };
  }
  if (vid === 'lin') {
    const u = N(p, 'u');
    const v = N(p, 'v');
    const t =
      u < 0
        ? summa([
            [v, ''],
            [u, 'x'],
          ])
        : summa([
            [u, 'x'],
            [v, ''],
          ]);
    return { c: [v, u], tex: `(${t})`, dTex: u === 1 ? '' : u === -1 ? '-' : num(u) };
  }
  const c = [N(p, 'a0'), N(p, 'a1'), N(p, 'a2')];
  return { c, tex: `(${pTex(c)})`, dTex: `(${pTex(pDer(c))})` };
}

function pokaz(k: number, b: number): string {
  return k < 0
    ? summa([
        [b, ''],
        [k, 'x'],
      ])
    : summa([
        [k, 'x'],
        [b, ''],
      ]);
}

function eksp(p: Params) {
  const k = N(p, 'k');
  const b = N(p, 'b');
  const m = mnozhitel(p);
  const E = pokaz(k, b);
  const e = `e^{${E}}`;
  const Q = pDer(m.c).map((a, i) => a + k * (m.c[i] ?? 0));
  Q.push(k * (m.c[m.c.length - 1] ?? 0));
  const q = Q.slice(0, pStepen(Q) + 1).map(okrugl);
  const qTex = pTex(q);
  const razl = pRazlozhenie(q);
  const korni = korniPoly(q);
  const kPart = `${k < 0 ? '-' : '+'}${Math.abs(k) === 1 ? '' : num(Math.abs(k))}${m.tex}${e}`;
  return {
    fn: `y = ${m.tex}${e}`,
    E,
    d: `${m.dTex}${e}${kPart} = (${qTex})${e}`,
    nuli: [
      `$${e} > 0$, поэтому $y' = 0$ при $${qTex} = 0$: ${razl === qTex ? '' : `$${razl} = 0$, `}${korni.map((t) => `$x = ${t.tex}$`).join(' или ')}.`,
    ],
    korni,
    c: m.c,
    f: (x: number) => pVal(m.c, x) * Math.exp(k * x + b),
    df: (x: number) => pVal(q, x) * Math.exp(k * x + b),
  };
}

const P28: Prototype = {
  id: 'P28',
  vid: 4,
  vopros: 'A',
  title: 'Точка экстремума: многочлен на $e^{kx + b}$',
  primer: 'y = (x + 5)^2e^{2 - x}',
  gen: (r) =>
    poka(r, (): Params | null => {
      const forma = r.pick(['linMinus', 'linPlus', 'kv', 'tri'] as const);
      const b = znakOt(r, 1, 25);
      const a = znakOt(r, 1, 15);
      if (forma === 'linMinus') return { vid: 'lin', u: 1, v: a, k: -1, b, cel: 'max' };
      if (forma === 'linPlus') return { vid: 'lin', u: -1, v: a, k: -1, b, cel: 'min' };
      if (forma === 'kv') return { vid: 'kv', a, k: -1, b, cel: slCel(r) };
      /* (x^2 − (m + 2)x + m + 2)e^{x + b}: y' = x(x − m)e^{x+b}. */
      const m = znakOt(r, 2, 14);
      return { vid: 'tri', a2: 1, a1: -(m + 2), a0: m + 2, k: 1, b, cel: slCel(r) };
    }),
  uslovie: (p) => uslovieTochki(C(p), eksp(p).fn),
  solve: (p) => {
    const e = eksp(p);
    return tochkaPoZnakam({
      cel: C(p),
      fn: e.fn,
      d: e.d,
      odz: "Производная произведения: $(uv)' = u'v + uv'$, $(e^{kx+b})' = ke^{kx+b}$.",
      nuli: e.nuli,
      korni: e.korni,
      df: e.df,
    });
  },
  chisla: (p) => {
    const e = eksp(p);
    const a = (e.korni[0] as Tochka).x;
    const b = (e.korni[e.korni.length - 1] as Tochka).x;
    return {
      f: e.f,
      otrezok: a === b ? [a - 6, a + 6] : oblastDvuh(a, b, P28.solve(p).answer, a - 4, b + 4),
      cel: C(p),
      chto: 'tochka',
    };
  },
};

const P29: Prototype = {
  id: 'P29',
  vid: 4,
  vopros: 'B',
  title: 'Многочлен на $e^{kx + b}$ на отрезке',
  primer: 'y = (x^2 - 39x + 39)e^{2 - x},\\ [0;\\,6]',
  gen: (r) =>
    poka(r, (): Params | null => {
      if (r.int(0, 2) === 0) {
        /* (ux + v)e^{kx + b}: нуль производной там, где показатель равен нулю. */
        const k = r.pick([1, -1, 2, -2, -4, 4]);
        const u = r.pick([1, 2, -1, -2]);
        const x0 = r.int(-30, 30) / (r.int(0, 1) === 0 ? 1 : 2 * Math.abs(k));
        const b = -k * x0;
        const v = -u / k - u * x0;
        if (!Number.isInteger(b) || !Number.isInteger(v) || !goden(-u / k)) return null;
        const ce: Cel = k * u > 0 ? 'min' : 'max';
        const lo = x0 - r.pick([1, 2, 3, 4, 0.5]);
        const hi = x0 + r.int(1, 12);
        if (!goden(lo) || !goden(hi)) return null;
        return { vid: 'lin', u, v, k, b, lo, hi, cel: ce };
      }
      /* (ax^2 + px + q)e^{k(x − x0)}: нули производной x0 и r. */
      const k = r.pick([1, -1]);
      const a = r.pick([1, 1, 2, 3]);
      const x0 = r.int(-12, 12);
      const rr = x0 + znakOt(r, 3, 40);
      const pp = -a * (x0 + rr) - (2 * a) / k;
      const q = a * x0 * rr - pp / k;
      const val = a * x0 * x0 + pp * x0 + q;
      if (Math.abs(val) > 2000 || val === 0) return null;
      /* Знак Q = ka(x − x0)(x − r) левее x0. */
      const levee = k * a * (rr > x0 ? 1 : -1) > 0 ? '+' : '-';
      const ce: Cel = levee === '+' ? 'max' : 'min';
      const lo = rr < x0 ? Math.max(rr, x0 - r.int(1, 8)) : x0 - r.int(1, 6);
      const hi = rr > x0 ? Math.min(rr, x0 + r.int(1, 8)) : x0 + r.int(1, 6);
      return { vid: 'tri', a2: a, a1: pp, a0: q, k, b: -k * x0, lo, hi, cel: ce };
    }),
  uslovie: (p) => uslovieOtrezka(C(p), eksp(p).fn, num(N(p, 'lo')), num(N(p, 'hi'))),
  solve: (p) => {
    const e = eksp(p);
    return naOtrezkeObshchiy({
      cel: C(p),
      fn: e.fn,
      d: e.d,
      odz: "Производная произведения: $(uv)' = u'v + uv'$, $(e^{kx+b})' = ke^{kx+b}$.",
      nuli: e.nuli,
      lo: drobT(N(p, 'lo')),
      hi: drobT(N(p, 'hi')),
      korni: e.korni,
      f: e.f,
      df: e.df,
      schet: (t) => {
        const nol = Math.abs(N(p, 'k') * t.x + N(p, 'b')) < 1e-9;
        const v = okrugl(Math.round(e.f(t.x) * 1e6) / 1e6);
        if (!nol) return [`$y(${t.tex}) = ${num(v)}$.`];
        return [
          `В точке $x = ${t.tex}$ показатель $${e.E}$ равен нулю, $e^0 = 1$:`,
          schetPoSlagaemym(t, e.c.map((a, i) => a * t.x ** i).reverse(), v),
        ];
      },
    });
  },
  chisla: (p) => ({
    f: eksp(p).f,
    otrezok: [N(p, 'lo'), N(p, 'hi')],
    cel: C(p),
    chto: 'znachenie',
  }),
};

/* ── Логарифм ────────────────────────────────────────────────────── */

/** P30: ax^2 + bx + c\ln x + d, нули производной r1 < r2. */
function log30(p: Params) {
  const a = N(p, 'a');
  const r1 = N(p, 'r1');
  const r2 = N(p, 'r2');
  const d = N(p, 'd');
  const b = okrugl(-2 * a * (r1 + r2));
  const c = okrugl(2 * a * r1 * r2);
  const chisl = [c, b, 2 * a];
  const razl = pRazlozhenie(chisl);
  const ct = pTex(chisl);
  return {
    fn: `y = ${summa([
      [a, 'x^2'],
      [b, 'x'],
      [c, '\\ln x'],
      [d, ''],
    ])}`,
    d:
      `${summa([
        [2 * a, 'x'],
        [b, ''],
      ])}+\\frac{${num(c)}}{x} = \\frac{${ct}}{x}` + (razl === ct ? '' : ` = \\frac{${razl}}{x}`),
    nuli: `$${ct} = 0$: $x = ${num(r1)}$ или $x = ${num(r2)}$ — оба больше нуля.`,
    korni: [drobT(r1 * 4, 4), drobT(r2 * 4, 4)],
    f: (x: number) => a * x * x + b * x + c * Math.log(x) + d,
    df: (x: number) => (2 * a * x * x + b * x + c) / x,
  };
}

const P30: Prototype = {
  id: 'P30',
  vid: 5,
  vopros: 'A',
  title: 'Точка экстремума: $ax^2 + bx + c\\ln x$',
  primer: 'y = 0{,}5x^2 - 11x + 28\\ln x + 9',
  gen: (r) =>
    poka(r, (): Params | null => {
      const a = r.pick([0.5, 0.5, 1.5, 2, 1]);
      const r1 = r.int(1, 10);
      const r2 = a === 1 ? r1 + 0.5 : r1 + r.int(1, 8);
      if (!Number.isInteger(2 * a * (r1 + r2)) || !Number.isInteger(2 * a * r1 * r2)) return null;
      return { a, r1, r2, d: r.int(-20, 40), cel: slCel(r) };
    }),
  uslovie: (p) => uslovieTochki(C(p), log30(p).fn),
  solve: (p) => {
    const l = log30(p);
    return tochkaPoZnakam({
      cel: C(p),
      fn: l.fn,
      d: l.d,
      odz: 'Область определения: $x > 0$.',
      nuli: [l.nuli],
      korni: l.korni,
      granica: { t: drobT(0), zakryta: false },
      df: l.df,
    });
  },
  chisla: (p) => {
    const l = log30(p);
    const r1 = N(p, 'r1');
    const r2 = N(p, 'r2');
    return {
      f: l.f,
      otrezok: oblastDvuh(r1, r2, P30.solve(p).answer, r1 / 4, r2 + 3 * (r2 - r1)),
      cel: C(p),
      chto: 'tochka',
    };
  },
};

/** \ln(x + a) или \ln(x + a)^{n}. */
function lnTex(a: number, n: number): string {
  const xa = summa([
    [1, 'x'],
    [a, ''],
  ]);
  return n === 1 ? `\\ln(${xa})` : `\\ln(${xa})^{${n}}`;
}

/** P31: K\ln(x + a)^n − mx + c (max) или mx − K\ln(x + a)^n + c (min). */
function log31(p: Params) {
  const K = N(p, 'K');
  const n = N(p, 'n');
  const a = N(p, 'a');
  const m = N(p, 'm');
  const c = N(p, 'c');
  const L = K * n;
  const max = C(p) === 'max';
  const ln = lnTex(a, n);
  const xa = summa([
    [1, 'x'],
    [a, ''],
  ]);
  const x0 = drobT(L - a * m, m);
  const s = max ? 1 : -1;
  return {
    fn: max
      ? `y = ${summa([
          [K, ln],
          [-m, 'x'],
          [c, ''],
        ])}`
      : `y = ${summa([
          [m, 'x'],
          [-K, ln],
          [c, ''],
        ])}`,
    d: max ? `\\frac{${L}}{${xa}}-${num(m)}` : `${num(m)}-\\frac{${L}}{${xa}}`,
    odz:
      n === 1
        ? `Область определения: $x > ${num(-a)}$.`
        : n % 2 === 1
          ? `Область определения: $x > ${num(-a)}$; $${ln} = ${n}\\ln(${xa})$.`
          : `$${ln} = ${n}\\ln|${xa}|$. При $x < ${num(-a)}$ производная не меняет знак — рассматриваем $x > ${num(-a)}$.`,
    nuli: [`$\\frac{${L}}{${xa}} = ${num(m)}$, $${xa} = ${drobT(L, m).tex}$, $x = ${x0.tex}$.`],
    x0,
    a,
    f: (x: number) => s * (K * n * Math.log(Math.abs(x + a)) - m * x) + c,
    df: (x: number) => s * (L / (x + a) - m),
    sdvig: L / m,
  };
}

const P31: Prototype = {
  id: 'P31',
  vid: 5,
  vopros: 'A',
  title: 'Точка экстремума: $K\\ln(x + a)^n$ и линейная функция',
  primer: 'y = \\ln(x + 11) - 4x + 5',
  gen: (r) =>
    poka(r, (): Params | null => {
      const n = r.pick([1, 1, 1, 2, 3, 5, 6, 8, 9]);
      const K = n === 1 ? r.pick([1, 1, 2, 3, 9]) : r.pick([1, 1, 2, 4]);
      const L = K * n;
      const m = r.pick([1, 2, 4, 5, 8, 10, 20, 25, L, L, 2 * L]);
      if (!goden(L / m)) return null;
      return { K, n, a: znakOt(r, 1, 15), m, c: r.int(-15, 15), cel: slCel(r) };
    }),
  uslovie: (p) => uslovieTochki(C(p), log31(p).fn),
  solve: (p) => {
    const l = log31(p);
    return tochkaPoZnakam({
      cel: C(p),
      fn: l.fn,
      d: l.d,
      odz: l.odz,
      nuli: l.nuli,
      korni: [l.x0],
      granica: { t: drobT(-l.a), zakryta: false },
      df: l.df,
    });
  },
  chisla: (p) => {
    const l = log31(p);
    return {
      f: l.f,
      otrezok: [-l.a + l.sdvig / 20, l.x0.x + 3 * l.sdvig + 2],
      cel: C(p),
      chto: 'tochka',
    };
  },
};

/** Конец отрезка дробью: «lo» = p/q (loq), иначе число. */
function konecDrob(p: Params, k: 'lo' | 'hi'): Tochka {
  return p[`${k}q`] === undefined ? drobT(N(p, k)) : drobObyknovennaya(N(p, k), N(p, `${k}q`));
}

/** P32: \ln(kx) или \ln(x + a)^n и линейная функция на любом отрезке. */
function log32(p: Params) {
  const c = N(p, 'c');
  const max = C(p) === 'max';
  const s = max ? 1 : -1;
  if (S(p, 'forma') === 'lnk') {
    const k = N(p, 'k');
    const ln = `\\ln(${k}x)`;
    return {
      fn: max
        ? `y = ${summa([
            [1, ln],
            [-k, 'x'],
            [c, ''],
          ])}`
        : `y = ${summa([
            [k, 'x'],
            [-1, ln],
            [c, ''],
          ])}`,
      d: max ? `\\frac{1}{x}-${k}` : `${k}-\\frac{1}{x}`,
      odz: 'Область определения: $x > 0$; отрезок в неё входит.',
      nuli: [`$\\frac{1}{x} = ${k}$, $x = \\frac{1}{${k}}$.`],
      x0: tochkaT(1 / k, `\\frac{1}{${k}}`, `1/${k}`),
      sch: (t: Tochka) =>
        `$${k}\\cdot${t.tex} = 1$, $\\ln 1 = 0$: $y(${t.tex}) = ${max ? '-1' : '1'}${plusC(c)} = ${num(c + s * -1)}$.`,
      f: (x: number) => s * (Math.log(k * x) - k * x) + c,
      df: (x: number) => s * (1 / x - k),
    };
  }
  const n = N(p, 'n');
  const a = N(p, 'a');
  const ln = lnTex(a, n);
  const xa = summa([
    [1, 'x'],
    [a, ''],
  ]);
  const x0 = 1 - a;
  return {
    fn: max
      ? `y = ${summa([
          [1, ln],
          [-n, 'x'],
          [c, ''],
        ])}`
      : `y = ${summa([
          [n, 'x'],
          [-1, ln],
          [c, ''],
        ])}`,
    d: max ? `\\frac{${n}}{${xa}}-${n}` : `${n}-\\frac{${n}}{${xa}}`,
    odz: `На отрезке $${xa} > 0$, и $${ln} = ${n}\\ln(${xa})$.`,
    nuli: [`$\\frac{1}{${xa}} = 1$, $x = ${num(x0)}$.`],
    x0: drobT(x0),
    sch: (t: Tochka) =>
      `$\\ln 1 = 0$: $y(${t.tex}) = ${num(-s * n * x0)}${c === 0 ? '' : `${plusC(c)} = ${num(-s * n * x0 + c)}`}$.`,
    f: (x: number) => s * (n * Math.log(Math.abs(x + a)) - n * x) + c,
    df: (x: number) => s * (n / (x + a) - n),
  };
}

const P32: Prototype = {
  id: 'P32',
  vid: 5,
  vopros: 'B',
  title: 'Логарифм и линейная функция на отрезке: общий вид',
  primer: 'y = 9x - \\ln(x + 4)^{9},\\ [-3{,}5;\\,0]',
  gen: (r) =>
    poka(r, (): Params | null => {
      const ce = slCel(r);
      const c = r.int(-15, 20);
      if (r.int(0, 1) === 0) {
        const k = r.int(2, 20);
        const lq = k + r.int(1, 8);
        const hiVar =
          r.int(0, 1) === 0 && k > 2
            ? { hi: 1, hiq: k - r.int(1, k - 2) }
            : { hi: r.pick([2, 3]), hiq: k };
        if (hiVar.hi / hiVar.hiq <= 1 / k) return null;
        return { forma: 'lnk', k, c, lo: 1, loq: lq, ...hiVar, cel: ce };
      }
      const n = r.int(2, 11);
      const a = r.int(2, 12);
      const x0 = 1 - a;
      const lo = r.pick([-a + 0.5, -a + 0.5, x0 - 0.5]);
      const hi = r.pick([0, x0 + r.int(1, 4)]);
      if (!(lo < x0 && x0 < hi)) return null;
      return { forma: 'step', n, a, c, lo, hi, cel: ce };
    }),
  uslovie: (p) => uslovieOtrezka(C(p), log32(p).fn, konecDrob(p, 'lo').tex, konecDrob(p, 'hi').tex),
  solve: (p) => {
    const l = log32(p);
    return naOtrezkeObshchiy({
      cel: C(p),
      fn: l.fn,
      d: l.d,
      odz: l.odz,
      nuli: l.nuli,
      lo: konecDrob(p, 'lo'),
      hi: konecDrob(p, 'hi'),
      korni: [l.x0],
      f: l.f,
      df: l.df,
      schet: (t) => [l.sch(t)],
    });
  },
  chisla: (p) => ({
    f: log32(p).f,
    otrezok: [konecDrob(p, 'lo').x, konecDrob(p, 'hi').x],
    cel: C(p),
    chto: 'znachenie',
  }),
};

/* ── e^{2x} − 2me^x + c: замена t = e^x ───────────────────────────── */

function eks33(p: Params) {
  const m = N(p, 'm');
  const c = N(p, 'c');
  return {
    fn: `y = ${summa([
      [1, 'e^{2x}'],
      [-2 * m, 'e^{x}'],
      [c, ''],
    ])}`,
    d: `${summa([
      [2, 'e^{2x}'],
      [-2 * m, 'e^{x}'],
    ])} = 2e^{x}(e^{x}${plusC(-m)})`,
    x0: m === 1 ? drobT(0) : tochkaT(Math.log(m), `\\ln ${m}`, `ln ${m}`),
    m,
    c,
    f: (x: number) => Math.exp(2 * x) - 2 * m * Math.exp(x) + c,
    df: (x: number) => 2 * Math.exp(x) * (Math.exp(x) - m),
  };
}

const P33: Prototype = {
  id: 'P33',
  vid: 4,
  vopros: 'B',
  title: 'Наименьшее значение: $e^{2x}$ и $e^x$ на отрезке',
  primer: 'y = e^{2x} - 4e^{x} - 5,\\ [-1;\\,2]',
  gen: (r) =>
    poka(r, (): Params | null => {
      const m = r.int(1, 9);
      const l = Math.log(m);
      const lo = (m === 1 ? -1 : Math.ceil(l) - 1) - r.int(0, 2);
      const hi = (m === 1 ? 1 : Math.floor(l) + 1) + r.int(0, 1);
      if (!(lo < l && l < hi)) return null;
      return { m, c: r.int(-20, 20), lo, hi, cel: 'min' };
    }),
  uslovie: (p) => uslovieOtrezka('min', eks33(p).fn, num(N(p, 'lo')), num(N(p, 'hi'))),
  solve: (p) => {
    const e = eks33(p);
    const lnm = e.m === 1 ? '0' : `\\ln ${e.m}`;
    return naOtrezkeObshchiy({
      cel: 'min',
      fn: e.fn,
      d: e.d,
      odz: "Удобно обозначить $t = e^{x}$: тогда $e^{2x} = t^2$. Производная: $(e^{2x})' = 2e^{2x}$, $(e^{x})' = e^{x}$.",
      nuli: [
        `$e^{x} > 0$, поэтому $e^{x} = ${e.m}$, $x = ${lnm}$` +
          (e.m === 1
            ? '.'
            : ` ($\\ln ${e.m} \\approx ${num(Math.round(Math.log(e.m) * 100) / 100)}$).`),
      ],
      lo: drobT(N(p, 'lo')),
      hi: drobT(N(p, 'hi')),
      korni: [e.x0],
      f: e.f,
      df: e.df,
      schet: () => [
        e.m === 1
          ? `$y(0) = 1 - 2${plusC(e.c)} = ${num(e.c - 1)}$.`
          : `$e^{${lnm}} = ${e.m}$, $e^{2${lnm}} = ${e.m}^2 = ${e.m * e.m}$: $y(${lnm}) = ${e.m * e.m} - ${2 * e.m * e.m}${plusC(e.c)} = ${num(e.c - e.m * e.m)}$.`,
      ],
    });
  },
  chisla: (p) => ({
    f: eks33(p).f,
    otrezok: [N(p, 'lo'), N(p, 'hi')],
    cel: 'min',
    chto: 'znachenie',
  }),
};

/* ── Тригонометрия: монотонная на отрезке ───────────────────────── */

const PI = Math.PI;

/** Концы отрезков: x, TeX, подпись, x/π и значения sin, cos, tg (если рациональны). */
interface Ugol {
  t: Tochka;
  xpi: number;
  sin?: number;
  cos?: number;
  tg?: number;
}

const UG = (xpi: number, tex: string, podpis: string, z: Omit<Ugol, 't' | 'xpi'>): Ugol => ({
  t: tochkaT(xpi * PI, tex, podpis),
  xpi,
  ...z,
});

const UGLY: Record<string, Ugol> = {
  '0': UG(0, '0', '0', { sin: 0, cos: 1, tg: 0 }),
  '-pi/2': UG(-0.5, '-\\frac{\\pi}{2}', '−π/2', { sin: -1, cos: 0 }),
  'pi/2': UG(0.5, '\\frac{\\pi}{2}', 'π/2', { sin: 1, cos: 0 }),
  '-3pi/2': UG(-1.5, '-\\frac{3\\pi}{2}', '−3π/2', { sin: 1, cos: 0 }),
  '3pi/2': UG(1.5, '\\frac{3\\pi}{2}', '3π/2', { sin: -1, cos: 0 }),
  '-5pi/6': UG(-5 / 6, '-\\frac{5\\pi}{6}', '−5π/6', { sin: -0.5 }),
  '-2pi/3': UG(-2 / 3, '-\\frac{2\\pi}{3}', '−2π/3', { cos: -0.5 }),
  'pi/4': UG(0.25, '\\frac{\\pi}{4}', 'π/4', { tg: 1 }),
  '-pi/4': UG(-0.25, '-\\frac{\\pi}{4}', '−π/4', { tg: -1 }),
};

const TRIG_TEX = { sin: '\\sin x', cos: '\\cos x', tg: '\\operatorname{tg} x' } as const;
const TRIG_IMYA = { sin: '\\sin', cos: '\\cos', tg: '\\operatorname{tg}' } as const;
const DROB_TEX: Record<string, string> = { '-0.5': '-\\frac12', '0.5': '\\frac12' };

/**
 * P34: A·T(x) + (Bx или ±Kx/π) + C, T — sin, cos или tg; производная
 * не меняет знак на отрезке. Параметры: T, A, B, K, zapis ('xpi' —
 * «\frac{Kx}{\pi}», 'pix' — «\frac{K}{\pi}x»), por ('Tx' / 'xT'), lo, hi.
 */
function trig34(p: Params) {
  const T = S(p, 'T') as 'sin' | 'cos' | 'tg';
  const A = N(p, 'A');
  const B = N(p, 'B');
  const K = N(p, 'K');
  const c = N(p, 'c');
  const lo = UGLY[S(p, 'lo')] as Ugol;
  const hi = UGLY[S(p, 'hi')] as Ugol;
  const xT: readonly [number, string] =
    K !== 0
      ? [
          Math.sign(K),
          S(p, 'zapis') === 'xpi'
            ? `\\frac{${Math.abs(K)}x}{\\pi}`
            : `\\frac{${Math.abs(K)}}{\\pi}x`,
        ]
      : [B, 'x'];
  const tT: readonly [number, string] = [A, TRIG_TEX[T]];
  const xFirst = S(p, 'por') === 'xT';
  const fn = `y = ${summa(xFirst ? [xT, tT, [c, '']] : [tT, xT, [c, '']])}`;
  const Beff = K !== 0 ? K / PI : B;
  const dX: readonly [number, string] =
    K !== 0 ? [Math.sign(K), `\\frac{${Math.abs(K)}}{\\pi}`] : [B, ''];
  const dT: readonly [number, string] =
    T === 'sin'
      ? [A, '\\cos x']
      : T === 'cos'
        ? [-A, '\\sin x']
        : [Math.sign(A), `\\frac{${Math.abs(A)}}{\\cos^2 x}`];
  const d = summa(xFirst ? [dX, dT] : [dT, dX]);
  const Tf = T === 'sin' ? Math.sin : T === 'cos' ? Math.cos : Math.tan;
  const f = (x: number) => A * Tf(x) + Beff * x + c;
  const df = (x: number) =>
    T === 'sin'
      ? A * Math.cos(x) + Beff
      : T === 'cos'
        ? -A * Math.sin(x) + Beff
        : A / Math.cos(x) ** 2 + Beff;
  const bAbs =
    K !== 0
      ? `\\frac{${Math.abs(K)}}{\\pi} \\approx ${num(Math.floor((Math.abs(K) / PI) * 100) / 100)}`
      : num(Math.abs(B));
  const vozr = df((lo.t.x + hi.t.x) / 2) > 0;
  const nuli =
    T === 'tg'
      ? [
          `$\\cos^2 x \\le 1$, поэтому $\\frac{${Math.abs(A)}}{\\cos^2 x} \\ge ${Math.abs(A)}$: производная ${vozr ? 'не меньше' : 'не больше'} нуля и равна нулю только при $x = 0$ — знак не меняется.`,
        ]
      : [
          `$|${num(Math.abs(A))}${T === 'sin' ? '\\cos x' : '\\sin x'}| \\le ${num(Math.abs(A))}$, а $${bAbs} > ${num(Math.abs(A))}$, поэтому $y' ${vozr ? '>' : '<'} 0$ на всём отрезке: нулей нет.`,
        ];
  /** Значение на конце: слагаемые по порядку записи и строка подсчёта. */
  const schet = (t: Tochka): string[] => {
    const u = t === lo.t ? lo : hi;
    const tv = u[T];
    if (tv === undefined) throw new Error('№21: на конце нет точного значения');
    const vx = K !== 0 ? K * u.xpi : B * t.x;
    if (K === 0 && t.x !== 0) throw new Error('№21: π не сокращается');
    const slag = xFirst ? [vx, A * tv, c] : [A * tv, vx, c];
    const v = okrugl(slag.reduce((s, a) => s + a, 0));
    const arg = t.tex === '0' ? ' 0' : `\\left(${t.tex}\\right)`;
    const tvTex = DROB_TEX[String(tv)] ?? num(tv);
    return [`$${TRIG_IMYA[T]}${arg} = ${tvTex}$: ${schetPoSlagaemym(t, slag, v)}`];
  };
  return { fn, d, nuli, f, df, lo, hi, schet };
}

/** Шаблоны P34 (как в задачах): T, знаки A и B, отрезок, что ищем. */
const SHABLONY34 = [
  { T: 'sin', sA: -1, sB: 1, lo: '-pi/2', hi: '0', cel: 'max', por: 'xT' },
  { T: 'sin', sA: -1, sB: 1, lo: '0', hi: 'pi/2', cel: 'min', por: 'xT' },
  { T: 'sin', sA: 1, sB: -1, lo: '-3pi/2', hi: '0', cel: 'min', por: 'Tx' },
  { T: 'cos', sA: 1, sB: 1, lo: '0', hi: '3pi/2', cel: 'min', por: 'Tx' },
  { T: 'cos', sA: 1, sB: -1, lo: '-3pi/2', hi: '0', cel: 'min', por: 'Tx' },
  { T: 'sin', sA: 1, sB: -1, lo: '-5pi/6', hi: '0', cel: 'max', por: 'Tx', pi: 6 },
  { T: 'cos', sA: 1, sB: 1, lo: '-2pi/3', hi: '0', cel: 'min', por: 'Tx', pi: 3 },
  { T: 'tg', sA: -1, sB: 1, lo: '0', hi: 'pi/4', cel: 'max', por: 'xT' },
] as const;

const P34: Prototype = {
  id: 'P34',
  vid: 6,
  vopros: 'B',
  title: 'Тригонометрия и линейная функция: монотонна на отрезке',
  primer: 'y = 43x - 40\\sin x + 34,\\ \\left[-\\frac{\\pi}{2};\\,0\\right]',
  gen: (r) =>
    poka(r, (): Params | null => {
      const sh = r.pick(SHABLONY34);
      const c = r.int(-30, 40);
      const base = { T: sh.T, lo: sh.lo, hi: sh.hi, cel: sh.cel, por: sh.por, c };
      if ('pi' in sh) {
        const K = sh.pi * r.int(1, 10);
        const A = r.int(2, 14);
        if (K / PI <= A) return null;
        return { ...base, A: sh.sA * A, B: 0, K: sh.sB * K, zapis: r.pick(['xpi', 'pix']) };
      }
      const A = r.int(2, 60);
      const B = sh.T === 'tg' ? A : A + r.int(1, 12);
      return { ...base, A: sh.sA * A, B: sh.sB * B, K: 0 };
    }),
  uslovie: (p) => {
    const t = trig34(p);
    return uslovieOtrezka(C(p), t.fn, t.lo.t.tex, t.hi.t.tex);
  },
  solve: (p) => {
    const t = trig34(p);
    return naOtrezkeObshchiy({
      cel: C(p),
      fn: t.fn,
      d: t.d,
      nuli: t.nuli,
      lo: t.lo.t,
      hi: t.hi.t,
      korni: [],
      f: t.f,
      df: t.df,
      schet: t.schet,
    });
  },
  chisla: (p) => {
    const t = trig34(p);
    return { f: t.f, otrezok: [t.lo.t.x, t.hi.t.x], cel: C(p), chto: 'znachenie' };
  },
};

/** «\frac{7\pi}{6}», «2\pi», «\pi»: nπ/d после сокращения. */
function piDrob(n: number, d: number): string {
  const g = nod(n, d);
  const a = n / g;
  const b = d / g;
  const ch = a === 1 ? '\\pi' : `${a}\\pi`;
  return b === 1 ? ch : `\\frac{${ch}}{${b}}`;
}

/** P35: ∓(k·tg x − 2kx) ∓ (k/2)π + c на [−π/3; π/3], нули ±π/4. */
function tg35(p: Params) {
  const k = N(p, 'k');
  const c = N(p, 'c');
  const max = C(p) === 'max';
  const s = max ? -1 : 1;
  const pol = k / 2;
  const piT = `${pol === 1 ? '' : num(pol)}\\pi`;
  const tg = '\\operatorname{tg} x';
  const fn = `y = ${summa([
    [s * k, tg],
    [-s * 2 * k, 'x'],
  ])}${max ? '-' : '+'}${piT}${plusC(c)}`;
  const lo = tochkaT(-PI / 3, '-\\frac{\\pi}{3}', '−π/3');
  const hi = tochkaT(PI / 3, '\\frac{\\pi}{3}', 'π/3');
  const kor = [
    tochkaT(-PI / 4, '-\\frac{\\pi}{4}', '−π/4'),
    tochkaT(PI / 4, '\\frac{\\pi}{4}', 'π/4'),
  ];
  const kk = k === 1 ? '' : String(k);
  return {
    fn,
    d: `${max ? '-' : ''}\\frac{${k}}{\\cos^2 x}${max ? '+' : '-'}${2 * k}`,
    lo,
    hi,
    kor,
    f: (x: number) => s * (k * Math.tan(x) - 2 * k * x) + (max ? -1 : 1) * pol * PI + c,
    df: (x: number) => s * (k / Math.cos(x) ** 2 - 2 * k),
    znach: (t: Tochka) => {
      /* Концы ±π/3: tg = ±√3, слагаемые с π не сокращаются. */
      /* lo: s(−k√3 + 7kπ/6), hi: s(k√3 − kπ/6), s = −1 у максимума. */
      const koren = `${kk}\\sqrt{3}`;
      if (t === lo)
        return max
          ? `${koren} - ${piDrob(7 * k, 6)}${plusC(c)}`
          : `-${koren} + ${piDrob(7 * k, 6)}${plusC(c)}`;
      if (t === hi)
        return max
          ? `-${koren} + ${piDrob(k, 6)}${plusC(c)}`
          : `${koren} - ${piDrob(k, 6)}${plusC(c)}`;
      return undefined;
    },
    schet: () => [
      max
        ? `$\\operatorname{tg}\\frac{\\pi}{4} = 1$: $y\\left(\\frac{\\pi}{4}\\right) = -${k} + ${piT} - ${piT}${plusC(c)} = ${num(c - k)}$.`
        : `$\\operatorname{tg}\\frac{\\pi}{4} = 1$: $y\\left(\\frac{\\pi}{4}\\right) = ${k} - ${piT} + ${piT}${plusC(c)} = ${num(c + k)}$.`,
    ],
  };
}

const P35: Prototype = {
  id: 'P35',
  vid: 6,
  vopros: 'B',
  title: 'Тангенс и линейная функция: два нуля производной на отрезке',
  primer:
    'y = 10\\operatorname{tg} x - 20x + 5\\pi - 3,\\ \\left[-\\frac{\\pi}{3};\\,\\frac{\\pi}{3}\\right]',
  gen: (r) => ({ k: r.int(1, 30), c: r.int(-20, 30), cel: slCel(r) }),
  uslovie: (p) => {
    const t = tg35(p);
    return uslovieOtrezka(C(p), t.fn, t.lo.tex, t.hi.tex);
  },
  solve: (p) => {
    const t = tg35(p);
    const k = N(p, 'k');
    return naOtrezkeObshchiy({
      cel: C(p),
      fn: t.fn,
      d: t.d,
      nuli: [
        `$\\frac{${k}}{\\cos^2 x} = ${2 * k}$, $\\cos^2 x = \\frac12$: на отрезке это $x = -\\frac{\\pi}{4}$ и $x = \\frac{\\pi}{4}$.`,
      ],
      lo: t.lo,
      hi: t.hi,
      korni: t.kor,
      f: t.f,
      df: t.df,
      znach: t.znach,
      schet: t.schet,
    });
  },
  chisla: (p) => {
    const t = tg35(p);
    return { f: t.f, otrezok: [t.lo.x, t.hi.x], cel: C(p), chto: 'znachenie' } satisfies Chisla;
  },
};

export const PROTOTYPES22: readonly Prototype[] = [
  P22,
  P23,
  P24,
  P25,
  P26,
  P27,
  P28,
  P29,
  P30,
  P31,
  P32,
  P33,
  P34,
  P35,
];
