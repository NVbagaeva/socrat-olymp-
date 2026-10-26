/**
 * №14 (варианты 11–12): √(L·F³ − B·G² + C·F + σG + c₀) = √(σG), где
 * F, G — sin x и cos x (в каком-то порядке), σ = ±1, правая часть
 * записана формулой приведения.
 *
 * Равносильно: σG ≥ 0 и L·F³ + B·F² + C·F + D = 0 (G² = 1 − F²),
 * многочлен = Π(qᵢt − pᵢ), корни rᵢ = pᵢ/qᵢ ∈ {0, ±½, ±1}. Для каждого
 * корня — серия с условием на знак σG, серии с разностью π склеиваются.
 */

import { add, cmp, mul, rat, sub, toNumber, type Rat } from '@/lib/zadanie15/core/rational';
import { otborD14, seriyaTex, type Seriya } from './d14';
import { piTex, ratTex } from './tex';
import type { Chast2Zadacha, Shablon2 } from './types';

type Dr = readonly [number, number];
const R = (d: Dr) => rat(d[0], d[1]);

export interface PF14 {
  F: 'sin' | 'cos';
  /** Корни многочлена: [p, q] — дробь p/q. */
  korni: readonly [Dr, Dr, Dr];
  /** Правая часть √(σ·G). */
  sg: 1 | -1;
  /** Какая формула приведения в правой части (0 или 1). */
  pr: 0 | 1;
  lo: Dr;
  hi: Dr;
}

/** Формулы приведения: [G][σ] → два варианта записи. */
const PRIVED: Record<'sin' | 'cos', Record<'1' | '-1', [string, string]>> = {
  sin: {
    '1': ['\\cos\\left(\\dfrac{\\pi}{2}-x\\right)', '\\sin(\\pi-x)'],
    '-1': ['\\cos\\left(\\dfrac{\\pi}{2}+x\\right)', '\\sin(x-\\pi)'],
  },
  cos: {
    '1': ['\\sin\\left(\\dfrac{\\pi}{2}+x\\right)', '\\sin\\left(\\dfrac{\\pi}{2}-x\\right)'],
    '-1': ['\\sin\\left(x-\\dfrac{\\pi}{2}\\right)', '\\cos(\\pi-x)'],
  },
};

/** Коэффициенты Π(qt − p): [L, B, C, D] при t³, t², t, 1. */
export function mnogochlenF14(korni: readonly Dr[]): [number, number, number, number] {
  let c = [1];
  for (const [p, q] of korni) {
    const n = new Array(c.length + 1).fill(0);
    c.forEach((v, i) => {
      n[i] += v * q;
      n[i + 1] -= v * p;
    });
    c = n;
  }
  return c as [number, number, number, number];
}

/** a в (−1; 1] (в долях π) по модулю 2. */
function norm(a: Rat): Rat {
  let x = a;
  while (toNumber(x) > 1) x = sub(x, rat(2));
  while (toNumber(x) <= -1) x = add(x, rat(2));
  return x;
}

const ARCSIN: Record<string, Rat> = {
  '-1': rat(-1, 2),
  '-1/2': rat(-1, 6),
  '0': rat(0),
  '1/2': rat(1, 6),
  '1': rat(1, 2),
};
const key = (r: Rat) => (r.d === 1n ? `${r.n}` : `${r.n}/${r.d}`);

export function seriiF14(p: PF14): { r: Rat; s: Seriya | null; otbrosheno: Rat | null }[] {
  const out: { r: Rat; s: Seriya | null; otbrosheno: Rat | null }[] = [];
  for (const d of p.korni) {
    const r = R(d);
    const as = ARCSIN[key(r)];
    if (as === undefined) throw new Error('f14: корень вне {0, ±1/2, ±1}');
    if (p.F === 'sin') {
      /* x = θ + 2πn (cos ≥ 0) или π − θ + 2πn (cos ≤ 0). */
      if (cmp(mul(as, as), rat(1, 4)) === 0)
        out.push({ r, s: { a: norm(as), b: rat(2) }, otbrosheno: null });
      else {
        const plus = norm(as);
        const minus = norm(sub(rat(1), as));
        out.push(
          p.sg > 0
            ? { r, s: { a: plus, b: rat(2) }, otbrosheno: minus }
            : { r, s: { a: minus, b: rat(2) }, otbrosheno: plus },
        );
      }
    } else {
      const th = sub(rat(1, 2), as); // arccos r
      if (th.n === 0n || cmp(th, rat(1)) === 0)
        out.push({ r, s: { a: norm(th), b: rat(2) }, otbrosheno: null });
      else
        out.push(
          p.sg > 0
            ? { r, s: { a: norm(th), b: rat(2) }, otbrosheno: norm(mul(th, rat(-1))) }
            : { r, s: { a: norm(mul(th, rat(-1))), b: rat(2) }, otbrosheno: norm(th) },
        );
    }
  }
  return out;
}

/** Склеиваем серии a + 2πn и a + π + 2πn в a + πn. */
export function itogF14(p: PF14): Seriya[] {
  const s = seriiF14(p)
    .map((x) => x.s!)
    .sort((x, y) => toNumber(x.a) - toNumber(y.a));
  const res: Seriya[] = [];
  const used = new Set<number>();
  for (let i = 0; i < s.length; i += 1) {
    if (used.has(i)) continue;
    const j = s.findIndex(
      (t, k) => k > i && !used.has(k) && cmp(norm(sub(t.a, s[i]!.a)), rat(1)) === 0,
    );
    if (j >= 0) {
      used.add(j);
      /* Представитель склеенной серии — в [0; π). */
      let a = s[i]!.a;
      while (toNumber(a) < 0) a = add(a, rat(1));
      while (toNumber(a) >= 1) a = sub(a, rat(1));
      res.push({ a, b: rat(1) });
    } else res.push(s[i]!);
  }
  return res;
}

const chl = (k: number, t: string, pervyy = false) =>
  k === 0 ? '' : `${k < 0 ? '-' : pervyy ? '' : '+'}${Math.abs(k) === 1 ? '' : Math.abs(k)}${t}`;
const svob = (k: number) => (k === 0 ? '' : k > 0 ? `+${k}` : `${k}`);

function sobrat(p: PF14): Chast2Zadacha {
  const [L, B, C, D] = mnogochlenF14(p.korni);
  if (B === 0) throw new Error('f14: нет квадрата');
  const F = p.F;
  const G = F === 'sin' ? 'cos' : 'sin';
  const f = (st: string) => (st === '' ? `\\${F} x` : `\\${F}${st}x`);
  const g = (st: string) => (st === '' ? `\\${G} x` : `\\${G}${st}x`);
  const lev = `${chl(L, f('^3'), true)}${chl(-B, g('^2'))}${chl(C, f(''))}${chl(p.sg, g(''))}${svob(D + B)}`;
  const prav = PRIVED[G][String(p.sg) as '1' | '-1'][p.pr];
  const ur = `\\sqrt{${lev}}=\\sqrt{${prav}}`;
  const lo = R(p.lo);
  const hi = R(p.hi);
  const uslovie =
    `а) Решите уравнение $${ur}$.\n` +
    `б) Найдите все корни этого уравнения, принадлежащие отрезку $\\left[${piTex(lo)};\\ ${piTex(hi)}\\right]$.`;
  const sgG = `${p.sg < 0 ? '-' : ''}\\${G} x`;
  const serii = seriiF14(p);
  const itog = itogF14(p);
  const bukvy = ['k', 'n', 'm'];
  const serTex = itog.map((s, i) =>
    cmp(s.b, rat(1)) === 0
      ? s.a.n === 0n
        ? `\\pi ${bukvy[i]}`
        : `${piTex(s.a)}+\\pi ${bukvy[i]}`
      : seriyaTex(s, bukvy[i]),
  );
  const otb = itog
    .flatMap((s) => otborD14(s, lo, hi).map((o) => o.x))
    .sort((x, y) => toNumber(x) - toNumber(y));
  if (otb.length === 0) throw new Error('f14: на отрезке нет корней');
  const vTex = otb.map(piTex);
  const kv = (st: (k: string) => string) =>
    `${chl(L, st('^3'), true)}${chl(B, st('^2'))}${chl(C, st(''))}${svob(D)}`;
  const tt = (k: string) => `t${k}`;
  /* Корень подбором: целый, если есть. */
  const iP = Math.max(
    0,
    p.korni.findIndex(([, q]) => q === 1),
  );
  const [p1, q1] = p.korni[iP]!;
  const ost = p.korni.filter((_, i) => i !== iP);
  const [a2, b2, c2] = mnogochlenF14(ost) as unknown as [number, number, number];
  const kvTr = `${chl(a2, 't^2', true)}${chl(b2, 't')}${svob(c2)}`;
  const mn1 = p1 === 0 ? 't' : `(${q1 === 1 ? '' : q1}t${p1 > 0 ? '-' : '+'}${Math.abs(p1)})`;
  const mnozh = p.korni
    .map(([pp, q]) =>
      pp === 0 ? 't' : `(${q === 1 ? '' : q}t${pp > 0 ? '-' : '+'}${Math.abs(pp)})`,
    )
    .join('');
  const znakNa = (x: Rat) => {
    const v = F === 'sin' ? Math.cos(Math.PI * toNumber(x)) : Math.sin(Math.PI * toNumber(x));
    return p.sg * v > 0 ? '>0' : '<0';
  };
  const korLines = serii.map(({ r, s: ser, otbrosheno }) => {
    const rT = ratTex(r);
    if (otbrosheno === null)
      return `$\\${F} x=${rT}$: $x=${seriyaTex(ser!)}$; здесь $\\${G} x=0$, условие выполнено.`;
    return `$\\${F} x=${rT}$: $x=${seriyaTex(ser!)}$ или $x=${seriyaTex({ a: otbrosheno, b: rat(2) })}$. Условию $${sgG}\\ge0$ удовлетворяет только первая серия (на второй $${sgG}${znakNa(otbrosheno)}$).`;
  });

  return {
    no: 14,
    shablon: 'f14.koren3',
    uslovie,
    risunok: null,
    punkty: [
      { bukva: 'а', podpis: 'Серии решений', pole: { vid: 'serii', verno: serTex } },
      { bukva: 'б', podpis: 'Корни на отрезке', pole: { vid: 'korni', verno: vTex } },
    ],
    otvet: `а) $${serTex.join(';\\ ')}$, $${bukvy.slice(0, itog.length).join(',')}\\in\\mathbb Z$; б) $${vTex.join(';\\ ')}$`,
    reshenie: [
      {
        title: 'а) Переход к системе',
        lines: [
          `По формуле приведения $${prav}=${sgG}$. Уравнение $\\sqrt{A}=\\sqrt{B}$ равносильно системе $A=B$, $B\\ge0$.`,
          `Слагаемое $${chl(p.sg, g(''), true)}$ есть в обеих частях и сокращается; заменим $\\${G}^2x=1-\\${F}^2x$: $${kv(f)}=0$, $${sgG}\\ge0$.`,
        ],
      },
      {
        title: 'а) Кубическое уравнение',
        lines: [
          `Пусть $t=\\${F} x$, $|t|\\le1$: $${kv(tt)}=0$. Подбором находим корень $t=${ratTex(R([p1, q1]))}$; делим многочлен на $${mn1}$: $${mn1}\\left(${kvTr}\\right)=0$.`,
          `Корни квадратного трёхчлена: $t=${ost.map((d) => ratTex(R(d))).join('$ и $t=')}$. Итак, $${mnozh}=0$.`,
        ],
      },
      {
        title: 'а) Серии и условие',
        lines: [
          ...korLines,
          `Ответ а): $${serTex.join('$; $')}$${itog.some((x) => cmp(x.b, rat(1)) === 0) ? ' (серии, отличающиеся на $\\pi$, записаны одной)' : ''}.`,
        ],
      },
      {
        title: 'б) Отбор',
        lines: [
          ...itog.map((s, i) => {
            const o = otborD14(s, lo, hi);
            return o.length === 0
              ? `Серия $${serTex[i]}$: на отрезке корней нет.`
              : `Серия $${serTex[i]}$: ${o.map((z) => `$${bukvy[i]}=${z.n}$: $x=${piTex(z.x)}$`).join(', ')}.`;
          }),
          `Ответ б): $${vTex.join(';\\ ')}$.`,
        ],
      },
    ],
    razbor: [
      { slovo: 'Формула приведения и переход к системе', formula: `${kv(f)}=0,\\ ${sgG}\\ge0` },
      { slovo: 'Разложение многочлена', formula: `${mnozh}=0` },
      { slovo: 'Серии с учётом условия', formula: serTex.join(';\\ ') },
      { slovo: 'Отбор на отрезке', formula: vTex.join(';\\ ') },
    ],
    kontrol: {
      serii: itog.flatMap((s) => [toNumber(s.a), toNumber(s.b)]),
      otbor: otb.map(toNumber),
    },
  };
}

export const F14_KOREN3: Shablon2<PF14> = {
  no: 14,
  prototip:
    'Уравнение √A = √B с тригонометрическим многочленом третьей степени и формулой приведения',
  sobrat,
};
