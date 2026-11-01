/**
 * №14 (варианты 13–14): показательное уравнение с косинусом в показателе.
 *
 * b^{2cos x} − (b^{c1} + b^{c2})·b^{cos x} + b^{c1+c2} = 0, t = b^{cos x}:
 * (t − b^{c1})(t − b^{c2}) = 0 ⇒ cos x = c1 или cos x = c2,
 * c ∈ {−1, −1/2, 0, 1/2, 1}; b — квадрат, чтобы b^{±1/2} было рациональным.
 * б) Отбор корней на [lo·π/2; hi·π/2].
 */

import { add, mul, rat, ratTex, toNumber, type Rat } from '@/lib/zadanie15/core/rational';
import { piTex } from './tex';
import type { Chast2Zadacha, Shablon2 } from './types';

export interface PO14 {
  /** Основание: 4, 9, 16 или 25. */
  b: number;
  /** cos x = c1/2 и c2/2 (c ∈ {−2, −1, 0, 1, 2}). */
  c1: number;
  c2: number;
  lo: number;
  hi: number;
}

const KOREN: Record<number, number> = { 4: 2, 9: 3, 16: 4, 25: 5 };

/** b^{c/2} точно. */
function stepen(b: number, c: number): Rat {
  const r = KOREN[b];
  if (r === undefined) throw new Error('o14: основание');
  return c >= 0 ? rat(r ** c) : rat(1, r ** -c);
}

/** Серии cos x = c/2 в долях π: [x0, период]. */
function serii(c: number): { x0: Rat; T: number }[] {
  switch (c) {
    case 2:
      return [{ x0: rat(0), T: 2 }];
    case -2:
      return [{ x0: rat(1), T: 2 }];
    case 0:
      return [{ x0: rat(1, 2), T: 1 }];
    case 1:
      return [
        { x0: rat(1, 3), T: 2 },
        { x0: rat(-1, 3), T: 2 },
      ];
    case -1:
      return [
        { x0: rat(2, 3), T: 2 },
        { x0: rat(-2, 3), T: 2 },
      ];
    default:
      throw new Error('o14: значение косинуса');
  }
}

const BUKVY = ['k', 'n', 'm', 'l'];

function seriyaTex(x0: Rat, T: number, b: string): string {
  const per = T === 1 ? `\\pi ${b}` : `${T}\\pi ${b}`;
  return x0.n === 0n ? per : `${piTex(x0)}+${per}`;
}

export function chislaO14(p: PO14) {
  if (!(p.c1 < p.c2)) throw new Error('o14: c1 < c2');
  if (!(p.lo < p.hi)) throw new Error('o14: отрезок');
  const t1 = stepen(p.b, p.c1);
  const t2 = stepen(p.b, p.c2);
  const S = add(t1, t2);
  const P = mul(t1, t2);
  const vse = [...serii(p.c1), ...serii(p.c2)];
  const L = rat(p.lo, 2);
  const H = rat(p.hi, 2);
  const vybor: Rat[] = [];
  for (const s of vse)
    for (let j = -12; j <= 12; j += 1) {
      const x = add(s.x0, rat(j * s.T));
      const v = toNumber(x);
      if (v >= toNumber(L) - 1e-12 && v <= toNumber(H) + 1e-12) vybor.push(x);
    }
  vybor.sort((a, b) => toNumber(a) - toNumber(b));
  return { t1, t2, S, P, vse, L, H, vybor };
}

function sobrat(p: PO14): Chast2Zadacha {
  const ch = chislaO14(p);
  if (ch.vybor.length === 0) throw new Error('o14: на отрезке нет корней');
  const ur = `${p.b}^{2\\cos x}-${ratTex(ch.S)}\\cdot ${p.b}^{\\cos x}+${ratTex(ch.P)}=0`;
  const seriiT = ch.vse.map((s, i) => seriyaTex(s.x0, s.T, BUKVY[i]!));
  const vTex = ch.vybor.map(piTex);
  const cT = (c: number) => (c % 2 === 0 ? String(c / 2) : `${c < 0 ? '-' : ''}\\dfrac{1}{2}`);
  return {
    no: 14,
    shablon: 'o14.pokazKos',
    uslovie: `а) Решите уравнение $${ur}$.\nб) Найдите все корни этого уравнения, принадлежащие отрезку $\\left[${piTex(ch.L)};\\ ${piTex(ch.H)}\\right]$.`,
    risunok: null,
    punkty: [
      { bukva: 'а', podpis: 'Серии решений', pole: { vid: 'serii', verno: seriiT } },
      { bukva: 'б', podpis: 'Корни на отрезке', pole: { vid: 'korni', verno: vTex } },
    ],
    otvet: `а) $${seriiT.join(';\\ ')}$, $${BUKVY.slice(0, seriiT.length).join(',')}\\in\\mathbb{Z}$; б) $${vTex.join(';\\ ')}$`,
    reshenie: [
      {
        title: 'а) Замена',
        lines: [
          `Пусть $t=${p.b}^{\\cos x}$, $t>0$. Так как $${p.b}^{2\\cos x}=t^2$, получаем $t^2-${ratTex(ch.S)}t+${ratTex(ch.P)}=0$.`,
          `По теореме Виета $t=${ratTex(ch.t1)}$ или $t=${ratTex(ch.t2)}$; оба корня положительны.`,
        ],
      },
      {
        title: 'а) Обратная замена',
        lines: [
          `$${p.b}^{\\cos x}=${ratTex(ch.t1)}=${p.b}^{${cT(p.c1)}}$, откуда $\\cos x=${cT(p.c1)}$; $${p.b}^{\\cos x}=${ratTex(ch.t2)}$, откуда $\\cos x=${cT(p.c2)}$.`,
          `Ответ а): $${seriiT.join(';\\ ')}$.`,
        ],
      },
      {
        title: 'б) Отбор корней',
        lines: [
          `Отмечаем на единичной окружности точки серий и дугу отрезка $\\left[${piTex(ch.L)};\\ ${piTex(ch.H)}\\right]$; подставляем целые значения параметров.`,
          `Ответ б): $${vTex.join(';\\ ')}$.`,
        ],
      },
    ],
    razbor: [
      { slovo: 'Замена', formula: `t=${p.b}^{\\cos x},\\ t>0` },
      { slovo: 'Квадратное уравнение', formula: `t^2-${ratTex(ch.S)}t+${ratTex(ch.P)}=0` },
      {
        slovo: 'Значения косинуса',
        formula: `\\cos x=${cT(p.c1)}\\ \\text{или}\\ \\cos x=${cT(p.c2)}`,
      },
      { slovo: 'Отбор на отрезке', formula: vTex.join(';\\ ') },
    ],
    kontrol: {
      S: toNumber(ch.S),
      P: toNumber(ch.P),
      vybor: ch.vybor.map((x) => toNumber(x) * Math.PI),
    },
  };
}

export const O14_POKAZ_KOS: Shablon2<PO14> = {
  no: 14,
  prototip: 'Показательное уравнение с косинусом в показателе: замена t = b^{cos x}, отбор корней',
  sobrat,
};
