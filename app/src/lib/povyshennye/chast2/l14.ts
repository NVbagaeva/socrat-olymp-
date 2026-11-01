/**
 * №14 (варианты 21–22): сумма четвёртых степеней синуса и косинуса.
 *
 * sin⁴x + cos⁴x = A. (sin²x + cos²x)² − 2sin²x cos²x = 1 − ½ sin²2x,
 * откуда sin²2x = 2(1 − A) = K и по формуле понижения cos 4x = 1 − 2K.
 * K = 1/4 → cos 4x = 1/2: x = ±π/12 + πn/2;
 * K = 1/2 → cos 4x = 0:   x = π/8 + πn/4;
 * K = 3/4 → cos 4x = −1/2: x = ±π/6 + πn/2;
 * K = 1   → cos 4x = −1:  x = π/4 + πn/2.
 * б) Отрезок [lo·π/4; hi·π/4] — точный перебор в долях π.
 */

import { add, rat, sub, toNumber, type Rat } from '@/lib/zadanie15/core/rational';
import { piTex } from './tex';
import type { Chast2Zadacha, Shablon2 } from './types';

export interface PL14 {
  /** K = sin²2x: 1, 2, 3 или 4 четверти. */
  K4: 1 | 2 | 3 | 4;
  lo: number;
  hi: number;
}

const A_TEX: Record<number, string> = {
  1: '\\dfrac{7}{8}',
  2: '\\dfrac{3}{4}',
  3: '\\dfrac{5}{8}',
  4: '\\dfrac{1}{2}',
};
const COS4: Record<number, string> = { 1: '\\dfrac{1}{2}', 2: '0', 3: '-\\dfrac{1}{2}', 4: '-1' };

/** Серии: x0 и период (в долях π). */
function serii(K4: number): { x0: Rat; T: Rat }[] {
  if (K4 === 1)
    return [
      { x0: rat(1, 12), T: rat(1, 2) },
      { x0: rat(-1, 12), T: rat(1, 2) },
    ];
  if (K4 === 2) return [{ x0: rat(1, 8), T: rat(1, 4) }];
  if (K4 === 3)
    return [
      { x0: rat(1, 6), T: rat(1, 2) },
      { x0: rat(-1, 6), T: rat(1, 2) },
    ];
  return [{ x0: rat(1, 4), T: rat(1, 2) }];
}

function seriyaTex(x0: Rat, T: Rat): string {
  const per =
    T.d === 1n
      ? T.n === 1n
        ? '\\pi n'
        : `${T.n}\\pi n`
      : `\\dfrac{${T.n === 1n ? '' : T.n}\\pi n}{${T.d}}`;
  return `${piTex(x0)}+${per}`;
}

export function chislaL14(p: PL14) {
  if (!(p.lo < p.hi)) throw new Error('l14: отрезок');
  const L = rat(p.lo, 4);
  const H = rat(p.hi, 4);
  const ss = serii(p.K4);
  const vybor: Rat[] = [];
  for (const s of ss) {
    for (let j = -60; j <= 60; j += 1) {
      const x = add(s.x0, rat(j * Number(s.T.n), Number(s.T.d)));
      const v = toNumber(x);
      if (v >= toNumber(L) - 1e-12 && v <= toNumber(H) + 1e-12) vybor.push(x);
    }
  }
  vybor.sort((a, b) => toNumber(a) - toNumber(b));
  return { L, H, ss, vybor };
}

function sobrat(p: PL14): Chast2Zadacha {
  const ch = chislaL14(p);
  if (ch.vybor.length === 0) throw new Error('l14: на отрезке нет корней');
  const sT = ch.ss.map((s) => seriyaTex(s.x0, s.T));
  const vTex = ch.vybor.map(piTex);
  const KT = p.K4 === 4 ? '1' : `\\dfrac{${p.K4 === 2 ? 1 : p.K4}}{${p.K4 === 2 ? 2 : 4}}`;
  return {
    no: 14,
    shablon: 'l14.chetvertye',
    uslovie: `а) Решите уравнение $\\sin^4x+\\cos^4x=${A_TEX[p.K4]}$.\nб) Найдите все корни этого уравнения, принадлежащие отрезку $\\left[${piTex(ch.L)};\\ ${piTex(ch.H)}\\right]$.`,
    risunok: null,
    punkty: [
      { bukva: 'а', podpis: 'Серии решений', pole: { vid: 'serii', verno: sT } },
      { bukva: 'б', podpis: 'Корни на отрезке', pole: { vid: 'korni', verno: vTex } },
    ],
    otvet: `а) $${sT.join(';\\ ')}$, $n\\in\\mathbb{Z}$; б) $${vTex.join(';\\ ')}$`,
    reshenie: [
      {
        title: 'а) Выделяем полный квадрат',
        lines: [
          `$\\sin^4x+\\cos^4x=\\left(\\sin^2x+\\cos^2x\\right)^2-2\\sin^2x\\cos^2x=1-\\dfrac12\\sin^22x$.`,
          `Уравнение принимает вид $1-\\dfrac12\\sin^22x=${A_TEX[p.K4]}$, то есть $\\sin^22x=${KT}$.`,
        ],
      },
      {
        title: 'а) Понижение степени',
        lines: [
          `$\\sin^22x=\\dfrac{1-\\cos4x}{2}$, поэтому $\\cos4x=1-2\\sin^22x=${COS4[p.K4]}$.`,
          `Решения: $x=${sT.join('$ и $x=')}$, $n\\in\\mathbb{Z}$.`,
          `Ответ а): $${sT.join(';\\ ')}$.`,
        ],
      },
      {
        title: 'б) Отбор корней',
        lines: [
          `Перебираем целые $n$ так, чтобы значения попали в отрезок $\\left[${piTex(ch.L)};\\ ${piTex(ch.H)}\\right]$ (длина $${piTex(sub(ch.H, ch.L))}$).`,
          `Ответ б): $${vTex.join(';\\ ')}$.`,
        ],
      },
    ],
    razbor: [
      { slovo: 'Сумма четвёртых степеней через квадрат суммы', formula: '1-\\frac12\\sin^22x' },
      { slovo: 'Квадрат синуса двойного угла', formula: `\\sin^22x=${KT}` },
      { slovo: 'Понижаем степень', formula: `\\cos4x=${COS4[p.K4]}` },
      { slovo: 'Отбор на отрезке', formula: vTex.join(';\\ ') },
    ],
    kontrol: { vybor: ch.vybor.map((x) => toNumber(x) * Math.PI), K: p.K4 / 4 },
  };
}

export const L14_CHETVERTYE: Shablon2<PL14> = {
  no: 14,
  prototip:
    'Тригонометрическое уравнение: сумма четвёртых степеней синуса и косинуса, понижение степени, отбор корней',
  sobrat,
};
