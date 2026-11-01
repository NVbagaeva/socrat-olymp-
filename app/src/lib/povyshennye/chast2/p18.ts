/**
 * №18 (варианты 27–28): в треугольник ABC (BC = a, AC = b, AB = c) вписана
 * окружность; касательная к ней, параллельная AC, пересекает AB в M и BC в N.
 *
 * а) Отрезки касательных: BK = BL, MK = MT, NT = NL ⇒ P(MBN) = BK + BL =
 *    AB + BC − AC.
 * б) MN ∥ AC ⇒ △MBN ∼ △ABC с коэффициентом k = P(MBN)/P(ABC) =
 *    (a + c − b)/(a + b + c): MN = b·k; площадь трапеции AMNC = S(1 − k²).
 */

import { renderPlan } from '@/lib/planimetriya/render';
import type { Element } from '@/lib/planimetriya/types';
import { div, mul, rat, ratTex, sub, toNumber } from '@/lib/zadanie15/core/rational';
import type { Chast2Zadacha, Shablon2 } from './types';

export interface PP18 {
  a: number;
  b: number;
  c: number;
  /** б) длина MN или площадь трапеции AMNC. */
  nado: 'MN' | 'S';
}

export function chislaP18(p: PP18) {
  const per = p.a + p.b + p.c;
  const k = rat(p.a + p.c - p.b, per);
  const MN = mul(rat(p.b), k);
  /* Площадь по Герону: 16S² = per(−a+b+c)(a−b+c)(a+b−c). */
  const S16 = per * (-p.a + p.b + p.c) * (p.a - p.b + p.c) * (p.a + p.b - p.c);
  const S = Math.sqrt(S16) / 4;
  if (!Number.isInteger(S * 4) || S16 <= 0) throw new Error('p18: площадь не рациональна');
  const Sr = rat(Math.round(S * 4), 4);
  const St = mul(Sr, sub(rat(1), mul(k, k)));
  return { per, k, MN, S: Sr, St };
}

function chertezh(p: PP18, punkt: 'a' | 'b'): string {
  const { a, b, c } = p;
  const A: [number, number] = [0, 0];
  const C: [number, number] = [b, 0];
  const bx = (c * c - a * a + b * b) / (2 * b);
  const B: [number, number] = [bx, Math.sqrt(c * c - bx * bx)];
  const per = a + b + c;
  const I: [number, number] = [
    (a * A[0] + b * B[0] + c * C[0]) / per,
    (a * A[1] + b * B[1] + c * C[1]) / per,
  ];
  const r = I[1];
  const t = (2 * r) / B[1];
  const M: [number, number] = [B[0] * t, B[1] * t];
  const N: [number, number] = [C[0] + (B[0] - C[0]) * t, C[1] + (B[1] - C[1]) * t];
  const tochki: Record<string, [number, number]> = { A, B, C, I, M, N };
  const el: Element[] = [
    { tip: 'mnogougolnik', tochki: ['A', 'B', 'C'] },
    { tip: 'okruzhnost', okr: 'w' },
    { tip: 'otrezok', a: 'M', b: 'N' },
    { tip: 'tochka', t: 'M' },
    { tip: 'tochka', t: 'N' },
  ];
  if (punkt === 'a') {
    /* Точки касания: K на AB, L на BC, T на MN. */
    const bk = (a + c - b) / 2;
    tochki.K = [B[0] + ((A[0] - B[0]) * bk) / c, B[1] + ((A[1] - B[1]) * bk) / c];
    tochki.L = [B[0] + ((C[0] - B[0]) * bk) / a, B[1] + ((C[1] - B[1]) * bk) / a];
    tochki.T = [I[0], 2 * r];
    for (const n of ['K', 'L', 'T']) el.push({ tip: 'tochka', t: n, sloy: 'reshenie' });
  }
  return renderPlan(
    {
      tochki,
      okruzhnosti: { w: { centr: 'I', radius: r } },
      elementy: el,
      podpisi: punkt === 'a' ? ['A', 'B', 'C', 'M', 'N', 'K', 'L', 'T'] : ['A', 'B', 'C', 'M', 'N'],
    },
    {
      rezhim: { rezhim: 'uchitel' },
      shirina: 300,
      vysota: 220,
      alt: 'Треугольник ABC, вписанная окружность и касательная MN, параллельная AC',
    },
  );
}

function sobrat(p: PP18): Chast2Zadacha {
  const ch = chislaP18(p);
  const otv = p.nado === 'MN' ? ch.MN : ch.St;
  const otvT = ratTex(otv);
  const kT = ratTex(ch.k);
  const uslovie =
    `В треугольник $ABC$ вписана окружность. Касательная к этой окружности, параллельная стороне $AC$, пересекает стороны $AB$ и $BC$ в точках $M$ и $N$ соответственно.\n` +
    `а) Докажите, что периметр треугольника $MBN$ равен $AB+BC-AC$.\n` +
    `б) Найдите ${p.nado === 'MN' ? 'длину отрезка $MN$' : 'площадь трапеции $AMNC$'}, если $AB=${p.c}$, $BC=${p.a}$, $AC=${p.b}$.`;
  const bLast =
    p.nado === 'MN'
      ? `$MN=k\\cdot AC=${kT}\\cdot ${p.b}=${otvT}$.`
      : `Площадь $ABC$ по формуле Герона: $p=${ratTex(rat(ch.per, 2))}$, $S=${ratTex(ch.S)}$. {{t:ploshchadi-obshchiy-ugol|Площади подобных треугольников}} относятся как $k^2$: $S_{MBN}=${ratTex(mul(ch.S, mul(ch.k, ch.k)))}$, $S_{AMNC}=S-S_{MBN}=${otvT}$.`;
  return {
    no: 18,
    shablon: 'p18.kasatelnayaParallel',
    uslovie,
    risunok: null,
    punkty: [
      { bukva: 'а', pole: null },
      {
        bukva: 'б',
        podpis: p.nado === 'MN' ? 'Длина $MN$' : 'Площадь трапеции',
        pole: { vid: 'chislo', verno: otvT.replace(/\\dfrac/g, '\\frac') },
      },
    ],
    otvet: `б) $${otvT}$`,
    reshenie: [
      {
        title: 'а) Отрезки касательных',
        risunok: chertezh(p, 'a'),
        lines: [
          `Пусть окружность касается $AB$, $BC$, $MN$ в точках $K$, $L$, $T$. {{t:kasatelnye-otrezki|Отрезки касательных}}, проведённых из одной точки, равны: $BK=BL$, $MK=MT$, $NL=NT$.`,
          `$P_{MBN}=BM+MT+TN+NB=(BM+MK)+(BN+NL)=BK+BL=2BK$.`,
          `Для треугольника $ABC$ по тем же {{t:kasatelnye-otrezki|отрезкам касательных}} $AB+BC-AC=(BK+AK)+(BL+CL)-(AK+CL)=2BK$. Значит, $P_{MBN}=AB+BC-AC$.`,
        ],
      },
      {
        title: 'б) Подобие',
        risunok: chertezh(p, 'b'),
        lines: [
          `$MN\\parallel AC$, поэтому $\\angle BMN=\\angle BAC$ (соответственные углы, {{t:nakrest-ugly|углы при параллельных прямых}}), и $\\triangle MBN\\sim\\triangle ABC$ по {{t:podobie-uu|двум углам}}.`,
          `Коэффициент подобия равен отношению периметров: $k=\\dfrac{AB+BC-AC}{AB+BC+AC}=\\dfrac{${p.c}+${p.a}-${p.b}}{${ch.per}}=${kT}$.`,
        ],
      },
      { title: 'б) Ответ', lines: [bLast, `Ответ: $${otvT}$.`] },
    ],
    razbor: [
      { slovo: 'а) Равные отрезки касательных', formula: 'P_{MBN}=2BK=AB+BC-AC' },
      { slovo: 'б) Подобие с коэффициентом — отношение периметров', formula: `k=${kT}` },
      p.nado === 'MN'
        ? { slovo: 'б) Сходственные стороны', formula: `MN=${kT}\\cdot ${p.b}` }
        : {
            slovo: 'б) Площади — как квадрат коэффициента',
            formula: `S_{AMNC}=S\\left(1-k^2\\right)`,
          },
      { slovo: 'б) Ответ', formula: otvT },
    ],
    kontrol: {
      otvet: toNumber(otv),
      k: toNumber(ch.k),
      S: toNumber(ch.S),
      _d: toNumber(div(ch.MN, rat(1))),
    },
  };
}

export const P18_KASATELNAYA_PARALLEL: Shablon2<PP18> = {
  no: 18,
  prototip:
    'Касательная к вписанной окружности, параллельная стороне: периметр отсечённого треугольника, отрезок или площадь трапеции',
  sobrat,
};
