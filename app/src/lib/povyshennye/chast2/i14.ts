/**
 * №14 (варианты 15–16): cos 3x + cos x = c·cos 2x.
 *
 * Слева сумма косинусов: 2cos 2x·cos x, поэтому cos 2x(2cos x − c) = 0:
 * cos 2x = 0 ⇒ x = π/4 + πk/2; cos x = c/2 = σ·cos(π/u), u ∈ {3, 6}
 * (при u = 4 серии совпали бы с первой).
 * б) Отбор на [lo·π/2; hi·π/2].
 */

import { add, rat, sub, toNumber, type Rat } from '@/lib/zadanie15/core/rational';
import { piTex } from './tex';
import type { Chast2Zadacha, Shablon2 } from './types';

export interface PI14 {
  u: 3 | 6;
  sg: 1 | -1;
  lo: number;
  hi: number;
}

const COS_T: Record<number, string> = { 3: '\\dfrac{1}{2}', 6: '\\dfrac{\\sqrt3}{2}' };
const C_T: Record<number, string> = { 3: '', 6: '\\sqrt3' };

function ost2(x: Rat): Rat {
  const k = Math.floor(toNumber(x) / 2);
  return sub(x, rat(2 * k));
}

export function chislaI14(p: PI14) {
  if (!(p.lo < p.hi)) throw new Error('i14: отрезок');
  const th = p.sg > 0 ? rat(1, p.u) : sub(rat(1), rat(1, p.u));
  const serii = [
    { x0: rat(1, 4), T: rat(1, 2), b: 'k' },
    { x0: th, T: rat(2), b: 'n' },
    { x0: ost2(sub(rat(0), th)), T: rat(2), b: 'm' },
  ];
  const L = rat(p.lo, 2);
  const H = rat(p.hi, 2);
  const vybor: Rat[] = [];
  for (const s of serii)
    for (let j = -30; j <= 30; j += 1) {
      const x = add(s.x0, rat(j * Number(s.T.n), Number(s.T.d)));
      const v = toNumber(x);
      if (v >= toNumber(L) - 1e-12 && v <= toNumber(H) + 1e-12) vybor.push(x);
    }
  vybor.sort((a, b) => toNumber(a) - toNumber(b));
  return { th, serii, L, H, vybor, c: p.sg * 2 * Math.cos(Math.PI / p.u) };
}

function sobrat(p: PI14): Chast2Zadacha {
  const ch = chislaI14(p);
  if (ch.vybor.length === 0) throw new Error('i14: нет корней на отрезке');
  const znak = p.sg < 0 ? '-' : '';
  const cT = `${znak}${C_T[p.u]}`;
  const ur = `\\cos 3x+\\cos x=${cT === '' ? '' : cT === '-' ? '-' : cT}\\cos 2x`;
  const seriiT = [
    '\\dfrac{\\pi}{4}+\\dfrac{\\pi k}{2}',
    `${piTex(ch.serii[1]!.x0)}+2\\pi n`,
    `${piTex(ch.serii[2]!.x0)}+2\\pi m`,
  ];
  const vTex = ch.vybor.map(piTex);
  return {
    no: 14,
    shablon: 'i14.kosTroynoy',
    uslovie: `а) Решите уравнение $${ur}$.\nб) Найдите все корни этого уравнения, принадлежащие отрезку $\\left[${piTex(ch.L)};\\ ${piTex(ch.H)}\\right]$.`,
    risunok: null,
    punkty: [
      { bukva: 'а', podpis: 'Серии решений', pole: { vid: 'serii', verno: seriiT } },
      { bukva: 'б', podpis: 'Корни на отрезке', pole: { vid: 'korni', verno: vTex } },
    ],
    otvet: `а) $${seriiT.join(';\\ ')}$, $k,n,m\\in\\mathbb{Z}$; б) $${vTex.join(';\\ ')}$`,
    reshenie: [
      {
        title: 'а) Сумма косинусов',
        lines: [
          `По формуле суммы косинусов $\\cos 3x+\\cos x=2\\cos 2x\\cos x$. Уравнение принимает вид $2\\cos 2x\\cos x-${cT === '' ? '1' : cT}\\cos 2x=0$, то есть $\\cos 2x\\left(2\\cos x-${cT === '' ? '1' : cT}\\right)=0$.`,
        ],
      },
      {
        title: 'а) Два случая',
        lines: [
          `$\\cos 2x=0$: $2x=\\dfrac{\\pi}{2}+\\pi k$, $x=\\dfrac{\\pi}{4}+\\dfrac{\\pi k}{2}$.`,
          `$\\cos x=${znak}${COS_T[p.u]}$: $x=\\pm${piTex(ch.th)}+2\\pi n$; эти точки не входят в первую серию.`,
          `Ответ а): $${seriiT.join(';\\ ')}$.`,
        ],
      },
      {
        title: 'б) Отбор корней',
        lines: [
          `На единичной окружности отмечаем точки серий и дугу $\\left[${piTex(ch.L)};\\ ${piTex(ch.H)}\\right]$, перебираем целые значения параметров.`,
          `Ответ б): $${vTex.join(';\\ ')}$.`,
        ],
      },
    ],
    razbor: [
      { slovo: 'Сумма косинусов', formula: '\\cos 3x+\\cos x=2\\cos 2x\\cos x' },
      {
        slovo: 'Выносим $\\cos 2x$',
        formula: `\\cos 2x=0\\ \\text{или}\\ \\cos x=${znak}${COS_T[p.u]}`,
      },
      { slovo: 'Серии', formula: seriiT.join(';\\ ') },
      { slovo: 'Отбор', formula: vTex.join(';\\ ') },
    ],
    kontrol: { c: ch.c, vybor: ch.vybor.map((x) => toNumber(x) * Math.PI) },
  };
}

export const I14_KOS_TROYNOY: Shablon2<PI14> = {
  no: 14,
  prototip:
    'Тригонометрическое уравнение: сумма косинусов тройного и одинарного угла против косинуса двойного',
  sobrat,
};
