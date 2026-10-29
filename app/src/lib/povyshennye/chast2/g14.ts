/**
 * №14 (варианты 13–14): показательное уравнение, сводящееся к квадратному.
 *
 * B₁^{(e + 2σkx)/u₁} − S·B₂^{(e + σkx)/u₂} + c·P = 0, где B₁ = q^{u₁},
 * B₂ = q^{u₂}, c = q^e. Оба слагаемых с x — степени q: q^{e + 2σkx} =
 * c·t² и q^{e + σkx} = c·t при t = q^{σkx} > 0. Делим на c:
 * t² − St + P = 0, корни t₁, t₂ > 0, x = log_q t / (σk).
 * б) Отрезок [lo; hi] с целыми k·lo, k·hi: x на отрезке ⇔ t между
 * степенями q — отбор без приближённых значений логарифмов.
 */

import { rat, ratTex, toNumber, type Rat } from '@/lib/zadanie15/core/rational';
import { dec } from './tex';
import type { Chast2Zadacha, Shablon2 } from './types';

export interface PG14 {
  /** Основание q (2 или 3). */
  q: number;
  /** c = q^e — общий множитель. */
  e: number;
  /** Основания слагаемых: q^{u1} и q^{u2}. */
  u1: number;
  u2: number;
  /** t = q^{σkx}. */
  k: number;
  sg: 1 | -1;
  /** Корни квадратного уравнения t² − St + P = 0 (натуральные, t1 < t2). */
  t1: number;
  t2: number;
  /** Концы отрезка: k·lo и k·hi — целые. */
  lo: number;
  hi: number;
}

/** Показатель q, если n = q^j, иначе null. */
function stepenQ(n: number, q: number): number | null {
  let j = 0;
  let m = n;
  while (m > 1 && m % q === 0) {
    m /= q;
    j += 1;
  }
  return m === 1 ? j : null;
}

/** n = m^r с наибольшим r (25 → 5², 8 → 2³). */
function stepenChisla(n: number): { m: number; r: number } {
  for (let r = 6; r >= 2; r -= 1) {
    const m = Math.round(n ** (1 / r));
    if (m ** r === n) return { m, r };
  }
  return { m: n, r: 1 };
}

/** Корень x = log_q t / (σk): TeX, строка для поля и число. */
function koren(p: PG14, t: number): { tex: string; v: number; rac: boolean } {
  const d = p.sg * p.k;
  const j = stepenQ(t, p.q);
  if (j !== null) {
    const x = rat(j, d);
    return { tex: ratTex(x), v: toNumber(x), rac: true };
  }
  const { m, r } = stepenChisla(t);
  const kf = rat(r, d);
  const neg = kf.n < 0n;
  const a = neg ? -kf.n : kf.n;
  const kT = a === 1n && kf.d === 1n ? '' : kf.d === 1n ? `${a}` : `\\frac{${a}}{${kf.d}}`;
  return {
    tex: `${neg ? '-' : ''}${kT}\\log_{${p.q}}${m}`,
    v: (r / d) * (Math.log(m) / Math.log(p.q)),
    rac: false,
  };
}

/** Линейный показатель a + bx: «1{,}5-3x», «-2x», «0{,}4+2x». */
function pokaz(a: Rat, b: Rat): string {
  const bv = toNumber(b);
  const bAbs = Math.abs(bv);
  const bT = bAbs === 1 ? 'x' : `${dec(bAbs)}x`;
  if (a.n === 0n) return `${bv < 0 ? '-' : ''}${bT}`;
  return `${dec(toNumber(a))}${bv < 0 ? '-' : '+'}${bT}`;
}

export function chislaG14(p: PG14) {
  const S = p.t1 + p.t2;
  const P = p.t1 * p.t2;
  const c = p.q ** p.e;
  if (!(p.t1 < p.t2) || p.t1 < 1) throw new Error('g14: корни');
  if (!Number.isInteger(p.k * p.lo) || !Number.isInteger(p.k * p.hi) || !(p.lo < p.hi))
    throw new Error('g14: отрезок');
  const korni = [p.t1, p.t2].map((t) => ({ t, ...koren(p, t) })).sort((a, b) => a.v - b.v);
  /* x ∈ [lo; hi] ⇔ σkx ∈ [σk·lo; σk·hi] ⇔ t ∈ [q^a; q^b]. */
  const a = Math.min(p.sg * p.k * p.lo, p.sg * p.k * p.hi);
  const b = Math.max(p.sg * p.k * p.lo, p.sg * p.k * p.hi);
  const lo = a >= 0 ? rat(p.q ** a) : rat(1, p.q ** -a);
  const hi = b >= 0 ? rat(p.q ** b) : rat(1, p.q ** -b);
  const vybor = korni.filter((x) => toNumber(lo) <= x.t && x.t <= toNumber(hi));
  return { S, P, c, korni, a, b, lo, hi, vybor };
}

function sobrat(p: PG14): Chast2Zadacha {
  const ch = chislaG14(p);
  const B1 = p.q ** p.u1;
  const B2 = p.q ** p.u2;
  const sk = p.sg * p.k;
  const e1 = pokaz(rat(p.e, p.u1), rat(2 * sk, p.u1));
  const e2 = pokaz(rat(p.e, p.u2), rat(sk, p.u2));
  const ur = `${B1}^{${e1}}-${ch.S}\\cdot${B2}^{${e2}}+${ch.c * ch.P}=0`;
  const loT = dec(p.lo);
  const hiT = dec(p.hi);
  const uslovie = `а) Решите уравнение $${ur}$.\nб) Найдите все корни этого уравнения, принадлежащие отрезку $\\left[${loT};\\ ${hiT}\\right]$.`;
  const tT = `${p.q}^{${sk === 1 ? '' : sk === -1 ? '-' : sk}x}`;
  const kx = sk === 1 ? 'x' : sk === -1 ? '-x' : `${sk}x`;
  const vseTex = ch.korni.map((x) => x.tex);
  const vTex = ch.vybor.map((x) => x.tex);
  if (vTex.length === 0) throw new Error('g14: на отрезке нет корней');
  const qa = ratTex(ch.lo);
  const qb = ratTex(ch.hi);
  const kxLo = dec(sk * p.lo);
  const kxHi = dec(sk * p.hi);
  const otbor = ch.korni.map((x) => {
    const da = ch.vybor.includes(x);
    return `$t=${x.t}$: ${da ? `$${qa}\\le ${x.t}\\le ${qb}$ — корень $x=${x.tex}$ лежит на отрезке` : `$${x.t}${x.t < toNumber(ch.lo) ? '<' + qa : '>' + qb}$ — корень $x=${x.tex}$ не лежит на отрезке`}.`;
  });
  return {
    no: 14,
    shablon: 'g14.pokazKvadrat',
    uslovie,
    risunok: null,
    punkty: [
      { bukva: 'а', podpis: 'Корни уравнения', pole: { vid: 'korni', verno: vseTex } },
      { bukva: 'б', podpis: 'Корни на отрезке', pole: { vid: 'korni', verno: vTex } },
    ],
    otvet: `а) $${vseTex.join(';\\ ')}$; б) $${vTex.join(';\\ ')}$`,
    reshenie: [
      {
        title: `а) Степени с основанием $${p.q}$`,
        lines: [
          `$${B1}=${p.q}^{${p.u1}}$ и $${B2}=${p.q}^{${p.u2}}$, поэтому $${B1}^{${e1}}=${p.q}^{${pokaz(rat(p.e), rat(2 * sk))}}=${ch.c}\\cdot\\left(${tT}\\right)^2$ и $${B2}^{${e2}}=${p.q}^{${pokaz(rat(p.e), rat(sk))}}=${ch.c}\\cdot${tT}$.`,
          `Пусть $t=${tT}$, $t>0$. Уравнение принимает вид $${ch.c}t^2-${ch.S * ch.c}t+${ch.c * ch.P}=0$, то есть $t^2-${ch.S}t+${ch.P}=0$.`,
        ],
      },
      {
        title: 'а) Корни',
        lines: [
          `По теореме Виета $t_1+t_2=${ch.S}$, $t_1t_2=${ch.P}$: $t=${p.t1}$ или $t=${p.t2}$ — оба положительны.`,
          ...ch.korni.map(
            (x) => `$${tT}=${x.t}$, откуда $${kx}=\\log_{${p.q}}${x.t}$ и $x=${x.tex}$.`,
          ),
          `Ответ а): $${vseTex.join(';\\ ')}$.`,
        ],
      },
      {
        title: 'б) Отбор корней',
        lines: [
          `При $${loT}\\le x\\le ${hiT}$ показатель $${kx}$ меняется от $${kxLo}$ до $${kxHi}$, а функция $y=${p.q}^{u}$ возрастает. Значит, $x$ лежит на отрезке тогда и только тогда, когда $${qa}\\le t\\le ${qb}$.`,
          ...otbor,
          `Ответ б): $${vTex.join(';\\ ')}$.`,
        ],
      },
    ],
    razbor: [
      { slovo: `Все степени — с основанием $${p.q}$`, formula: `t=${tT}>0` },
      { slovo: 'Квадратное уравнение', formula: `t^2-${ch.S}t+${ch.P}=0` },
      { slovo: 'Возвращаемся к $x$', formula: vseTex.join(';\\ ') },
      { slovo: 'Отбор: сравниваем $t$ со степенями', formula: `${qa}\\le t\\le ${qb}` },
    ],
    kontrol: { korni: ch.korni.map((x) => x.v), vybor: ch.vybor.map((x) => x.v) },
  };
}

export const G14_POKAZ_KVADRAT: Shablon2<PG14> = {
  no: 14,
  prototip:
    'Показательное уравнение: степени одного основания, замена t = q^{kx}, квадратное уравнение',
  sobrat,
};
