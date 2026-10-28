/**
 * №14 (варианты 15–16): логарифмическое уравнение, кубическое относительно
 * t = log_q(x + c).
 *
 * Слагаемое A·log^k_{q^e}((x + c)^w) при x > −c равно A·(w t / e)^k.
 * Сумма слагаемых минус правая часть — многочлен третьей степени от t
 * с тремя целыми корнями; x = q^r − c.
 * б) Концы отрезка — логарифмы log_b y; сравнение корня x₀ = n/d с ними:
 * log_b y ⋚ x₀ ⇔ y ⋚ b^{x₀} (при b < 1 знак меняется) ⇔ y^d ⋚ b^n.
 */

import {
  add,
  cmp,
  div,
  mul,
  rat,
  ratTex,
  sub,
  toNumber,
  type Rat,
} from '@/lib/zadanie15/core/rational';
import { tochnoTex } from './chisla';
import type { Chast2Zadacha, Shablon2 } from './types';

type Dr = readonly [number, number];
const R = (d: Dr) => rat(d[0], d[1]);

export interface ChlenH14 {
  /** Коэффициент A. */
  A: Dr;
  k: 1 | 2 | 3;
  /** Основание q^e. */
  e: Dr;
  /** Аргумент (x + c)^w. */
  w: number;
  /** Слагаемое в правой части. */
  prav?: boolean;
}

export interface PH14 {
  q: number;
  c: number;
  chleny: readonly ChlenH14[];
  /** Число в правой части (или 0) и число в левой части. */
  Cprav: Dr;
  Clev: Dr;
  /** Концы отрезка: log_{b} y. */
  lo: { b: Dr; y: Dr };
  hi: { b: Dr; y: Dr };
}

/** Целая степень дроби. */
function pw(b: Rat, n: number): Rat {
  let r = rat(1);
  const base = n >= 0 ? b : div(rat(1), b);
  for (let i = 0; i < Math.abs(n); i += 1) r = mul(r, base);
  return r;
}

/** Основание q^e в TeX: 4, 16, 0{,}5, \frac13, \sqrt2. */
function osnTex(q: number, e: Rat): string {
  if (e.d === 1n) {
    const v = pw(rat(q), Number(e.n));
    return tochnoTex(v);
  }
  if (e.d === 2n && e.n === 1n) return `\\sqrt{${q}}`;
  throw new Error('h14: основание');
}

/** (x+c)^w в TeX. */
function argTex(c: number, w: number): string {
  const xc = c === 0 ? 'x' : `(x${c > 0 ? '+' : '-'}${Math.abs(c)})`;
  const xcb = c === 0 ? 'x' : `x${c > 0 ? '+' : '-'}${Math.abs(c)}`;
  if (w === 1) return `\\left(${xcb}\\right)`;
  if (w === -1) return `\\dfrac{1}{${xcb}}`;
  if (w < 0) return `\\dfrac{1}{${xc}^{${-w}}}`;
  return `${xc}^{${w}}`;
}

/** Коэффициенты многочлена Σ A(w/e)^k t^k − C: [t⁰, t¹, t², t³]. */
export function mnogochlenH14(p: PH14): Rat[] {
  const k = [rat(0), rat(0), rat(0), rat(0)];
  for (const ch of p.chleny) {
    const m = pw(div(rat(ch.w), R(ch.e)), ch.k);
    const v = mul(R(ch.A), m);
    k[ch.k] = ch.prav ? sub(k[ch.k]!, v) : add(k[ch.k]!, v);
  }
  k[0] = add(k[0]!, sub(R(p.Clev), R(p.Cprav)));
  return k;
}

/** Целые корни многочлена степени 3 (перебор делителей). */
function korniT(k: Rat[]): number[] {
  const out: number[] = [];
  for (let r = -12; r <= 12; r += 1) {
    const v = add(
      add(k[0]!, mul(k[1]!, rat(r))),
      add(mul(k[2]!, rat(r * r)), mul(k[3]!, rat(r * r * r))),
    );
    if (v.n === 0n) out.push(r);
  }
  return out;
}

/** Знак log_b y − x₀ и пояснение. */
function sravnit(b: Rat, y: Rat, x0: Rat): { znak: number; tex: string } {
  /* log_b y > x₀ ⇔ (b > 1: y > b^{x₀}; b < 1: y < b^{x₀}) ⇔ y^d ? b^n. */
  const n = Number(x0.n);
  const d = Number(x0.d);
  const L = pw(y, d);
  const P = pw(b, n);
  const s = cmp(L, P);
  const bBig = cmp(b, rat(1)) > 0;
  const znak = bBig ? s : -s;
  const bT = tochnoTex(b);
  const yT = tochnoTex(y);
  const x0T = ratTex(x0);
  const dva =
    d === 1
      ? `$${yT}${s > 0 ? '>' : '<'}${tochnoTex(P)}=${bT}^{${n}}$`
      : `$${yT}^{${d}}=${tochnoTex(L)}${s > 0 ? '>' : '<'}${tochnoTex(P)}=${bT}^{${n}}$`;
  return {
    znak,
    tex: `$\\log_{${bT}}${yT}${znak > 0 ? '>' : '<'}${x0T}$, так как ${dva}${bBig ? '' : ` и основание $${bT}<1$`}`,
  };
}

export function chislaH14(p: PH14) {
  const k = mnogochlenH14(p);
  const tk = korniT(k);
  if (tk.length !== 3) throw new Error(`h14: корней t ${tk.length}`);
  const lam = k[3]!;
  const korni = tk.map((r) => {
    const x = sub(pw(rat(p.q), r), rat(p.c));
    return { r, x, tex: ratTex(x), v: toNumber(x) };
  });
  korni.sort((a, b) => a.v - b.v);
  const vybor = korni.filter((x) => {
    const a = sravnit(R(p.lo.b), R(p.lo.y), x.x);
    const b = sravnit(R(p.hi.b), R(p.hi.y), x.x);
    return a.znak < 0 && b.znak > 0;
  });
  return { k, tk, lam, korni, vybor };
}

function sobrat(p: PH14): Chast2Zadacha {
  const ch = chislaH14(p);
  const chT = (c: ChlenH14, pervyy: boolean) => {
    const a = R(c.A);
    const neg = a.n < 0n;
    const ab = neg ? rat(-a.n, a.d) : a;
    const aT = ab.n === 1n && ab.d === 1n ? '' : tochnoTex(ab);
    const st = c.k === 1 ? '' : `^{${c.k}}`;
    return `${neg ? '-' : pervyy ? '' : '+'}${aT}\\log${st}_{${osnTex(p.q, R(c.e))}}${argTex(p.c, c.w)}`;
  };
  const sterna = (spisok: ChlenH14[], C: Rat) => {
    const parts = spisok.map((c, i) => chT(c, i === 0));
    let s = parts.join('');
    if (C.n !== 0n)
      s += `${C.n < 0n ? '-' : s === '' ? '' : '+'}${tochnoTex(C.n < 0n ? rat(-C.n, C.d) : C)}`;
    return s === '' ? '0' : s;
  };
  const lev = sterna(
    p.chleny.filter((c) => !c.prav),
    R(p.Clev),
  );
  const prav = sterna(
    p.chleny.filter((c) => c.prav),
    R(p.Cprav),
  );
  const ur = `${lev}=${prav}`;
  const konec = (e: { b: Dr; y: Dr }) => `\\log_{${tochnoTex(R(e.b))}}${tochnoTex(R(e.y))}`;
  const uslovie = `а) Решите уравнение $${ur}$.\nб) Найдите все корни этого уравнения, принадлежащие отрезку $\\left[${konec(p.lo)};\\ ${konec(p.hi)}\\right]$.`;
  const xc = p.c === 0 ? 'x' : `x${p.c > 0 ? '+' : '-'}${Math.abs(p.c)}`;
  const perevod = p.chleny.map((c) => {
    const kf = div(rat(c.w), R(c.e));
    const kT = ratTex(kf);
    const v = kT === '1' ? 't' : kT === '-1' ? '-t' : `${kT}t`;
    return `$\\log_{${osnTex(p.q, R(c.e))}}${argTex(p.c, c.w)}=${v}$`;
  });
  /* Многочлен после умножения на 1/λ. */
  const norm = ch.k.map((x) => div(x, ch.lam));
  const polyT = (() => {
    const chl: string[] = [];
    const st = ['', 't', 't^2', 't^3'];
    for (let i = 3; i >= 0; i -= 1) {
      const c = norm[i]!;
      if (c.n === 0n) continue;
      const neg = c.n < 0n;
      const a = neg ? rat(-c.n, c.d) : c;
      const aT = a.n === 1n && a.d === 1n && i > 0 ? '' : ratTex(a);
      chl.push(`${neg ? '-' : chl.length ? '+' : ''}${aT}${st[i]}`);
    }
    return chl.join('');
  })();
  const fakt = ch.tk.map((r) => (r === 0 ? 't' : `(t${r > 0 ? '-' : '+'}${Math.abs(r)})`)).join('');
  const vseTex = ch.korni.map((x) => x.tex);
  const vTex = ch.vybor.map((x) => x.tex);
  if (vTex.length === 0) throw new Error('h14: на отрезке нет корней');
  const loV = Math.log(toNumber(R(p.lo.y))) / Math.log(toNumber(R(p.lo.b)));
  const hiV = Math.log(toNumber(R(p.hi.y))) / Math.log(toNumber(R(p.hi.b)));
  const otbor = ch.korni.map((x) => {
    const a = sravnit(R(p.lo.b), R(p.lo.y), x.x);
    const b = sravnit(R(p.hi.b), R(p.hi.y), x.x);
    if (a.znak > 0) return `$x=${x.tex}$ левее отрезка: ${a.tex}.`;
    if (b.znak < 0) return `$x=${x.tex}$ правее отрезка: ${b.tex}.`;
    return `$x=${x.tex}$ на отрезке: ${a.tex}; ${b.tex}.`;
  });
  return {
    no: 14,
    shablon: 'h14.logKub',
    uslovie,
    risunok: null,
    punkty: [
      { bukva: 'а', podpis: 'Корни уравнения', pole: { vid: 'korni', verno: vseTex } },
      { bukva: 'б', podpis: 'Корни на отрезке', pole: { vid: 'korni', verno: vTex } },
    ],
    otvet: `а) $${vseTex.join(';\\ ')}$; б) $${vTex.join(';\\ ')}$`,
    reshenie: [
      {
        title: 'а) Один логарифм',
        lines: [
          `ОДЗ: $${xc}>0$. Пусть $t=\\log_{${p.q}}(${xc})$. По свойствам логарифма при $${xc}>0$: ${perevod.join(', ')}.`,
          `Уравнение принимает вид $${polyT}=0$.`,
        ],
      },
      {
        title: 'а) Корни',
        lines: [
          `Группируем и раскладываем на множители: $${fakt}=0$, $t\\in\\{${ch.tk.join(';\\ ')}\\}$.`,
          ...ch.korni.map(
            (x) =>
              `$\\log_{${p.q}}(${xc})=${x.r}$: $${xc}=${tochnoTex(pw(rat(p.q), x.r))}$, $x=${x.tex}$ — в ОДЗ.`,
          ),
          `Ответ а): $${vseTex.join(';\\ ')}$.`,
        ],
      },
      { title: 'б) Отбор корней', lines: [...otbor, `Ответ б): $${vTex.join(';\\ ')}$.`] },
    ],
    razbor: [
      { slovo: 'Все логарифмы — через один', formula: `t=\\log_{${p.q}}(${xc})` },
      { slovo: 'Кубическое уравнение', formula: `${fakt}=0` },
      { slovo: 'Корни', formula: vseTex.join(';\\ ') },
      { slovo: 'Сравнение с концами через степени', formula: vTex.join(';\\ ') },
    ],
    kontrol: {
      korni: ch.korni.map((x) => x.v),
      vybor: ch.vybor.map((x) => x.v),
      lo: loV,
      hi: hiV,
    },
  };
}

export const H14_LOG_KUB: Shablon2<PH14> = {
  no: 14,
  prototip:
    'Уравнение с логарифмами разных оснований: кубическое относительно log_q(x + c), отбор через степени',
  sobrat,
};
