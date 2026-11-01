/**
 * №18 (варианты 7–8): прямоугольный треугольник ABC (∠C = 90°),
 * BC = a, AC = b, AB = c (пифагорова тройка), CH — высота.
 * r, r₁, r₂ — радиусы вписанных окружностей треугольников ABC, ACH, BCH.
 *
 * а) Радиус вписанной окружности прямоугольного треугольника равен
 *    полусумме катетов без гипотенузы (отрезки касательных):
 *    r + r₁ + r₂ = ((a + b − c) + (AH + CH − b) + (BH + CH − a))/2 = CH,
 *    так как AH + BH = c.
 * б) Треугольник ACH подобен ABC с коэффициентом b/c, BCH — с a/c:
 *    r₁ = r·b/c, r₂ = r·a/c.
 */

import { renderPlan } from '@/lib/planimetriya/render';
import type { Element } from '@/lib/planimetriya/types';
import { rat, ratTex, toNumber } from '@/lib/zadanie15/core/rational';
import type { Chast2Zadacha, Shablon2 } from './types';

export interface PX18 {
  a: number;
  b: number;
  c: number;
  nado: 'r1' | 'r2';
}

export function chislaX18(p: PX18) {
  if (p.a * p.a + p.b * p.b !== p.c * p.c) throw new Error('x18: не прямоугольный');
  const r = rat(p.a + p.b - p.c, 2);
  const r1 = rat((p.a + p.b - p.c) * p.b, 2 * p.c);
  const r2 = rat((p.a + p.b - p.c) * p.a, 2 * p.c);
  const CH = rat(p.a * p.b, p.c);
  const AH = rat(p.b * p.b, p.c);
  const BH = rat(p.a * p.a, p.c);
  return { r, r1, r2, CH, AH, BH };
}

type P2 = [number, number];
function incentr(A: P2, B: P2, C: P2): { I: P2; r: number } {
  const d = (u: P2, v: P2) => Math.hypot(u[0] - v[0], u[1] - v[1]);
  const la = d(B, C);
  const lb = d(A, C);
  const lc = d(A, B);
  const s = la + lb + lc;
  const I: P2 = [(la * A[0] + lb * B[0] + lc * C[0]) / s, (la * A[1] + lb * B[1] + lc * C[1]) / s];
  const S = Math.abs((B[0] - A[0]) * (C[1] - A[1]) - (C[0] - A[0]) * (B[1] - A[1])) / 2;
  return { I, r: (2 * S) / s };
}

function chertezh(p: PX18, punkt: 'a' | 'b'): string {
  const k = 6 / Math.max(p.a, p.b);
  const C: P2 = [0, 0];
  const B: P2 = [p.a * k, 0];
  const A: P2 = [0, p.b * k];
  /* H — основание перпендикуляра из C на AB. */
  const t = (B[0] * (B[0] - A[0]) + 0) / ((B[0] - A[0]) ** 2 + (B[1] - A[1]) ** 2);
  const H: P2 = [A[0] + (1 - t) * (B[0] - A[0]), A[1] + (1 - t) * (B[1] - A[1])];
  const w1 = incentr(A, C, H);
  const w2 = incentr(B, C, H);
  const el: Element[] = [
    { tip: 'mnogougolnik', tochki: ['A', 'B', 'C'] },
    { tip: 'otrezok', a: 'C', b: 'H' },
    { tip: 'ugol', a: 'A', v: 'C', b: 'B', pryamoy: true },
    { tip: 'ugol', a: 'C', v: 'H', b: 'B', pryamoy: true },
    { tip: 'okruzhnost', okr: 'w1' },
    { tip: 'okruzhnost', okr: 'w2' },
    { tip: 'tochka', t: 'I1' },
    { tip: 'tochka', t: 'I2' },
  ];
  if (punkt === 'b') el.push({ tip: 'okruzhnost', okr: 'w', sloy: 'reshenie' });
  const w = incentr(A, B, C);
  return renderPlan(
    {
      tochki: { A, B, C, H, I1: w1.I, I2: w2.I, I: w.I },
      okruzhnosti: {
        w1: { centr: 'I1', radius: w1.r },
        w2: { centr: 'I2', radius: w2.r },
        w: { centr: 'I', radius: w.r },
      },
      elementy: el,
      podpisi: ['A', 'B', 'C', 'H', 'I1', 'I2'],
    },
    { rezhim: { rezhim: 'uchitel' } },
  );
}

function sobrat(p: PX18): Chast2Zadacha {
  const ch = chislaX18(p);
  const r1 = p.nado === 'r1';
  const otvR = r1 ? ch.r1 : ch.r2;
  const otv = ratTex(otvR);
  const uslovie =
    `В прямоугольном треугольнике $ABC$ с прямым углом $C$ проведена высота $CH$. Окружности, вписанные в треугольники $ACH$ и $BCH$, имеют центры $I_1$ и $I_2$ и радиусы $r_1$ и $r_2$; $r$ — радиус окружности, вписанной в треугольник $ABC$.\n` +
    `а) Докажите, что $r+r_1+r_2=CH$.\n` +
    `б) Найдите ${r1 ? '$r_1$' : '$r_2$'}, если $BC=${p.a}$, $AC=${p.b}$.`;
  return {
    no: 18,
    shablon: 'x18.trivpisannye',
    uslovie,
    risunok: null,
    punkty: [
      { bukva: 'а', pole: null },
      {
        bukva: 'б',
        podpis: r1 ? 'Радиус $r_1$' : 'Радиус $r_2$',
        pole: { vid: 'chislo', verno: otv.replace(/\\dfrac/g, '\\frac') },
      },
    ],
    otvet: `б) $${otv}$`,
    reshenie: [
      {
        title: 'а) Радиус вписанной окружности прямоугольного треугольника',
        risunok: chertezh(p, 'a'),
        lines: [
          `В прямоугольном треугольнике с катетами $u$, $v$ и гипотенузой $w$ вписанная окружность касается катетов в точках, удалённых от вершины прямого угла на $\\rho$, поэтому по {{t:kasatelnye-otrezki|свойству отрезков касательных}} $w=(u-\\rho)+(v-\\rho)$, то есть $\\rho=\\dfrac{u+v-w}{2}$.`,
          'Треугольники $ACH$ и $BCH$ прямоугольные с прямым углом $H$, гипотенузы — $AC$ и $BC$.',
        ],
      },
      {
        title: 'а) Складываем',
        lines: [
          '$r=\\dfrac{BC+AC-AB}{2}$, $r_1=\\dfrac{AH+CH-AC}{2}$, $r_2=\\dfrac{BH+CH-BC}{2}$.',
          '$r+r_1+r_2=\\dfrac{(AH+BH)-AB+2CH}{2}=CH$, так как $AH+BH=AB$. Что и требовалось доказать.',
        ],
      },
      {
        title: 'б) Подобие',
        risunok: chertezh(p, 'b'),
        lines: [
          `$AB=\\sqrt{${p.a}^2+${p.b}^2}=${p.c}$ ({{t:pifagor|теорема Пифагора}}), $r=\\dfrac{${p.a}+${p.b}-${p.c}}{2}=${ratTex(ch.r)}$.`,
          `Высота прямоугольного треугольника делит его на два треугольника, подобных исходному ({{t:vysota-pryamougolnogo|высота из вершины прямого угла}}, {{t:podobie-uu|подобие по двум углам}}): $\\triangle ${r1 ? 'ACH' : 'CBH'}\\sim\\triangle ABC$ с коэффициентом $\\dfrac{${r1 ? 'AC' : 'BC'}}{AB}=${ratTex(rat(r1 ? p.b : p.a, p.c))}$.`,
          `Радиусы вписанных окружностей подобных треугольников относятся как соответствующие стороны: ${r1 ? '$r_1' : '$r_2'}=${ratTex(ch.r)}\\cdot${ratTex(rat(r1 ? p.b : p.a, p.c))}=${otv}$.`,
          `Проверка по пункту а): $CH=\\dfrac{${p.a}\\cdot${p.b}}{${p.c}}=${ratTex(ch.CH)}$ и $r+r_1+r_2=${ratTex(ch.r)}+${ratTex(ch.r1)}+${ratTex(ch.r2)}=${ratTex(ch.CH)}$.`,
        ],
      },
    ],
    razbor: [
      {
        slovo: 'а) Радиус вписанной окружности прямоугольного треугольника',
        formula: '\\rho=\\frac{u+v-w}{2}',
      },
      { slovo: 'а) Сумма трёх радиусов', formula: 'r+r_1+r_2=CH' },
      { slovo: 'б) Подобие треугольников', formula: `k=${ratTex(rat(r1 ? p.b : p.a, p.c))}` },
      { slovo: 'Ответ', formula: otv },
    ],
    kontrol: { otvet: toNumber(otvR), r: toNumber(ch.r), CH: toNumber(ch.CH) },
  };
}

export const X18_TRI_VPISANNYE: Shablon2<PX18> = {
  no: 18,
  prototip:
    'Прямоугольный треугольник с высотой: сумма радиусов трёх вписанных окружностей равна высоте; радиус через подобие',
  sobrat,
};
