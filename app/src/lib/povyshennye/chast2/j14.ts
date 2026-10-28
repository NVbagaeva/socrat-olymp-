/**
 * №14 (варианты 17–18): дробь, числитель которой сводится к −sin²x·cos²x,
 * а знаменатель — к квадратному трёхчлену от cos u или sin u,
 * u = x/4 + φ (φ кратно π/8).
 *
 * Числитель: sin⁴x + cos 2x − cos²x = sin⁴x − sin²x = −sin²x cos²x
 * (или cos⁴x − cos 2x − sin²x = −sin²x cos²x): ноль при x = πk/2.
 * Знаменатель «cos»: 2sin²u + B cos u − 2 = cos u (B − 2cos u), |B| > 2 —
 * ноль при cos u = 0; «sin»: 2cos²u − B sin u − 2 = −sin u (2 sin u + B).
 * Корни знаменателя: x = e + 4πn; e — кратно π/2, исключаем его из πk/2.
 * Остаётся 7 остатков из 8 по модулю 4π — три серии.
 */

import { add, rat, sub, toNumber, type Rat } from '@/lib/zadanie15/core/rational';
import { piTex } from './tex';
import type { Chast2Zadacha, Shablon2 } from './types';

export interface PJ14 {
  /** Числитель: через sin⁴x или cos⁴x; номер записи cos 2x. */
  chisl: 'sin' | 'cos';
  zapis: 0 | 1 | 2 | 3;
  /** Знаменатель: через cos u или sin u, u = x/4 + φ, φ = fi·π/8. */
  znam: 'cos' | 'sin';
  fi: number;
  B: number;
  /** Запись аргумента: u или −u (в sin² / cos² и в линейном слагаемом). */
  minus1: boolean;
  minus2: boolean;
  /** Отрезок [lo·π/2; hi·π/2]. */
  lo: number;
  hi: number;
}

/* Записи +cos 2x и −cos 2x. */
const PLUS_COS2 = [
  '-\\sin\\left(2x-\\dfrac{\\pi}{2}\\right)',
  '+\\sin\\left(2x+\\dfrac{\\pi}{2}\\right)',
  '-\\cos(\\pi-2x)',
  '+\\sin\\left(\\dfrac{\\pi}{2}-2x\\right)',
];
const MINUS_COS2 = [
  '+\\sin\\left(\\dfrac{3\\pi}{2}+2x\\right)',
  '+\\sin\\left(2x-\\dfrac{\\pi}{2}\\right)',
  '+\\cos(\\pi-2x)',
  '-\\sin\\left(\\dfrac{\\pi}{2}+2x\\right)',
];
const PRIVEDENIE_PLUS = [
  '\\sin\\left(2x-\\frac{\\pi}{2}\\right)=-\\cos2x',
  '\\sin\\left(2x+\\frac{\\pi}{2}\\right)=\\cos2x',
  '\\cos(\\pi-2x)=-\\cos2x',
  '\\sin\\left(\\frac{\\pi}{2}-2x\\right)=\\cos2x',
];
const PRIVEDENIE_MINUS = [
  '\\sin\\left(\\frac{3\\pi}{2}+2x\\right)=-\\cos2x',
  '\\sin\\left(2x-\\frac{\\pi}{2}\\right)=-\\cos2x',
  '\\cos(\\pi-2x)=-\\cos2x',
  '\\sin\\left(\\frac{\\pi}{2}+2x\\right)=\\cos2x',
];

/** Аргумент u = x/4 + φ или −u в TeX. */
function argTex(fi: number, minus: boolean): string {
  const f = rat(fi, 8);
  const fT = piTex(f.n < 0n ? rat(-f.n, f.d) : f).replace(/\\dfrac/g, '\\frac');
  if (fi === 0) return minus ? '-\\frac{x}{4}' : '\\frac{x}{4}';
  if (!minus) return `\\frac{x}{4}${fi > 0 ? '+' : '-'}${fT}`;
  return fi > 0 ? `-${fT}-\\frac{x}{4}` : `${fT}-\\frac{x}{4}`;
}

/** Остаток x по модулю m (кратные π): дробь в [0; m). */
function ostatok(x: Rat, m: number): Rat {
  const M = BigInt(m);
  /* x = n/d: n mod (m·d), неотрицательный. */
  const md = M * x.d;
  return rat(((x.n % md) + md) % md, x.d);
}

export function chislaJ14(p: PJ14) {
  if (Math.abs(p.B) <= 2) throw new Error('j14: |B| ≤ 2');
  /* e = (2π − 4φ) или (−4φ), в единицах π. */
  const fi = rat(p.fi, 8);
  const e0 = p.znam === 'cos' ? sub(rat(2), mul4(fi)) : sub(rat(0), mul4(fi));
  const e = ostatok(e0, 4);
  const j = Number(e.n * 2n) / Number(e.d);
  if (!Number.isInteger(j)) throw new Error('j14: e не кратно π/2');
  const s1 = ostatok(add(e, rat(1)), 2);
  const s2 = ostatok(add(e, rat(2)), 4);
  const serii: { x0: Rat; T: number; bukva: string }[] =
    j % 2 === 1
      ? [
          { x0: rat(0), T: 1, bukva: 'k' },
          { x0: s1, T: 2, bukva: 'n' },
          { x0: s2, T: 4, bukva: 'm' },
        ]
      : [
          { x0: rat(1, 2), T: 1, bukva: 'k' },
          { x0: s1, T: 2, bukva: 'n' },
          { x0: s2, T: 4, bukva: 'm' },
        ];
  /* б) Корни на отрезке. */
  const vybor: Rat[] = [];
  for (let i = p.lo; i <= p.hi; i += 1) {
    const x = rat(i, 2);
    if (ostatok(x, 4).n * e.d !== e.n * ostatok(x, 4).d) vybor.push(x);
  }
  return { e, j, serii, vybor };
}

function mul4(x: Rat): Rat {
  return add(add(x, x), add(x, x));
}

function seriyaTex(x0: Rat, T: number, b: string): string {
  const per = T === 1 ? `\\pi ${b}` : `${T}\\pi ${b}`;
  if (x0.n === 0n) return per;
  return `${piTex(x0)}+${per}`;
}

function sobrat(p: PJ14): Chast2Zadacha {
  const ch = chislaJ14(p);
  const sinN = p.chisl === 'sin';
  const chislT = sinN
    ? `\\sin^4x${PLUS_COS2[p.zapis]}-\\cos^2x`
    : `\\cos^4x${MINUS_COS2[p.zapis]}-\\sin^2x`;
  const u1 = argTex(p.fi, p.minus1);
  const u2 = argTex(p.fi, p.minus2);
  const znamT =
    p.znam === 'cos'
      ? `2\\sin^2\\left(${u1}\\right)${p.B > 0 ? '+' : '-'}${Math.abs(p.B)}\\cos\\left(${u2}\\right)-2`
      : `2\\cos^2\\left(${u1}\\right)${p.B > 0 ? '-' : '+'}${Math.abs(p.B)}\\sin\\left(${u2}\\right)-2`;
  /* У «sin»-знаменателя при −u знак линейного слагаемого меняется: sin(−u) = −sin u. */
  const Bef = p.znam === 'sin' && p.minus2 ? -p.B : p.B;
  const lo = rat(p.lo, 2);
  const hi = rat(p.hi, 2);
  const uslovie = `а) Решите уравнение $\\dfrac{${chislT}}{${znamT}}=0$.\nб) Найдите все корни этого уравнения, принадлежащие отрезку $\\left[${piTex(lo)};\\ ${piTex(hi)}\\right]$.`;
  const serii = ch.serii.map((s) => seriyaTex(s.x0, s.T, s.bukva));
  const vTex = ch.vybor.map(piTex);
  const uT = argTex(p.fi, false);
  const eT = piTex(ch.e);
  const znamSv =
    p.znam === 'cos'
      ? `2-2\\cos^2u${Bef > 0 ? '+' : '-'}${Math.abs(Bef)}\\cos u-2=\\cos u\\left(${Bef}-2\\cos u\\right)`.replace(
          '(-',
          '(-',
        )
      : `2-2\\sin^2u${Bef > 0 ? '-' : '+'}${Math.abs(Bef)}\\sin u-2=-\\sin u\\left(2\\sin u${Bef > 0 ? '+' : '-'}${Math.abs(Bef)}\\right)`;
  const nolZn =
    p.znam === 'cos'
      ? `$\\cos u=0$ ($|\\cos u|\\le1<\\frac{${Math.abs(Bef)}}{2}$, второй множитель не ноль): $u=\\frac{\\pi}{2}+\\pi n$`
      : `$\\sin u=0$ ($|\\sin u|\\le1<\\frac{${Math.abs(Bef)}}{2}$, второй множитель не ноль): $u=\\pi n$`;
  return {
    no: 14,
    shablon: 'j14.trigDrob',
    uslovie,
    risunok: null,
    punkty: [
      { bukva: 'а', podpis: 'Серии решений', pole: { vid: 'serii', verno: serii } },
      { bukva: 'б', podpis: 'Корни на отрезке', pole: { vid: 'korni', verno: vTex } },
    ],
    otvet: `а) $${serii.join(';\\ ')}$, $k,n,m\\in\\mathbb Z$; б) $${vTex.join(';\\ ')}$`,
    reshenie: [
      {
        title: 'а) Числитель',
        lines: [
          `По формуле приведения $${sinN ? PRIVEDENIE_PLUS[p.zapis] : PRIVEDENIE_MINUS[p.zapis]}$.`,
          sinN
            ? `Числитель равен $\\sin^4x+\\cos2x-\\cos^2x=\\sin^4x+\\cos^2x-\\sin^2x-\\cos^2x=\\sin^2x\\left(\\sin^2x-1\\right)=-\\sin^2x\\cos^2x=-\\frac14\\sin^22x$.`
            : `Числитель равен $\\cos^4x-\\cos2x-\\sin^2x=\\cos^4x-\\cos^2x+\\sin^2x-\\sin^2x=\\cos^2x\\left(\\cos^2x-1\\right)=-\\sin^2x\\cos^2x=-\\frac14\\sin^22x$.`,
          'Числитель равен нулю при $\\sin2x=0$, то есть $x=\\dfrac{\\pi k}{2}$, $k\\in\\mathbb Z$.',
        ],
      },
      {
        title: 'а) Знаменатель',
        lines: [
          `Пусть $u=${uT}$; ${p.minus1 || p.minus2 ? `$\\sin^2(-u)=\\sin^2u$, $\\cos^2(-u)=\\cos^2u$, ${p.znam === 'cos' ? '$\\cos(-u)=\\cos u$' : '$\\sin(-u)=-\\sin u$'}; ` : ''}знаменатель равен $${znamSv}$.`,
          `Знаменатель равен нулю, когда ${nolZn}, то есть $x=${eT}+4\\pi n$ (с точностью до $4\\pi$).`,
        ],
      },
      {
        title: 'а) Отбор серий',
        lines: [
          `Из точек $x=\\dfrac{\\pi k}{2}$ исключаем $x=${eT}+4\\pi n$. По модулю $4\\pi$ точек $\\frac{\\pi k}{2}$ восемь: $0,\\frac{\\pi}{2},\\ldots,\\frac{7\\pi}{2}$; остаются семь.`,
          `Их удобно записать тремя сериями: $${serii.join('$; $')}$.`,
        ],
      },
      {
        title: 'б) Корни на отрезке',
        lines: [
          `На отрезке $\\left[${piTex(lo)};\\ ${piTex(hi)}\\right]$ точки $\\frac{\\pi k}{2}$, кроме сравнимых с $${eT}$ по модулю $4\\pi$: $${vTex.join(';\\ ')}$.`,
        ],
      },
    ],
    razbor: [
      { slovo: 'Числитель — формула приведения и вынесение', formula: '-\\sin^2x\\cos^2x' },
      {
        slovo: 'Знаменатель — квадратный трёхчлен',
        formula: p.znam === 'cos' ? '\\cos u=0' : '\\sin u=0',
      },
      { slovo: 'Исключаем корни знаменателя', formula: `x\\ne${eT}+4\\pi n` },
      { slovo: 'б) Отбор', formula: vTex.join(';\\ ') },
    ],
    kontrol: {
      e: toNumber(ch.e) * Math.PI,
      vybor: ch.vybor.map((x) => toNumber(x) * Math.PI),
    },
  };
}

export const J14_TRIG_DROB: Shablon2<PJ14> = {
  no: 14,
  prototip:
    'Тригонометрическая дробь: числитель −sin²x cos²x, знаменатель — трёхчлен от cos(x/4 + φ) или sin(x/4 + φ)',
  sobrat,
};
