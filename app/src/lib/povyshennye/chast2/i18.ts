/**
 * №18 (варианты 15–16): две окружности радиусов r и R касаются внешним
 * образом в точке K; общая внешняя касательная касается их в A и B.
 * а) Касательная в K пересекает AB в M: MA = MK = MB (отрезки касательных),
 *    K лежит на окружности с диаметром AB, ∠AKB = 90°.
 * б) AB² = (R + r)² − (R − r)² = 4Rr; KM = AB/2 = √(Rr).
 */

import { renderPlan } from '@/lib/planimetriya/render';
import type { Element } from '@/lib/planimetriya/types';
import type { Chast2Zadacha, Shablon2 } from './types';

export interface PI18 {
  r: number;
  R: number;
  nado: 'AB' | 'KM';
}

export function chislaI18(p: PI18) {
  if (!(p.r > 0 && p.R > p.r)) throw new Error('i18: R > r > 0');
  const AB = 2 * Math.sqrt(p.r * p.R);
  if (!Number.isInteger(AB)) throw new Error('i18: AB не целое');
  return { AB, KM: AB / 2 };
}

function chertezh(p: PI18): string {
  const ch = chislaI18(p);
  const s = 6 / (ch.AB + p.r + p.R);
  const A: [number, number] = [0, 0];
  const B: [number, number] = [ch.AB * s, 0];
  const O1: [number, number] = [0, p.r * s];
  const O2: [number, number] = [ch.AB * s, p.R * s];
  const t = p.r / (p.r + p.R);
  const K: [number, number] = [O1[0] + (O2[0] - O1[0]) * t, O1[1] + (O2[1] - O1[1]) * t];
  const M: [number, number] = [(A[0] + B[0]) / 2, 0];
  const el: Element[] = [
    { tip: 'okruzhnost', okr: 'w1' },
    { tip: 'okruzhnost', okr: 'w2' },
    { tip: 'otrezok', a: 'A', b: 'B' },
    { tip: 'otrezok', a: 'A', b: 'K' },
    { tip: 'otrezok', a: 'K', b: 'B' },
    { tip: 'otrezok', a: 'M', b: 'K' },
    { tip: 'tochka', t: 'K' },
    { tip: 'tochka', t: 'M' },
  ];
  return renderPlan(
    {
      tochki: { A, B, K, M, O1, O2 },
      okruzhnosti: { w1: { centr: 'O1', radius: p.r * s }, w2: { centr: 'O2', radius: p.R * s } },
      elementy: el,
      podpisi: ['A', 'B', 'K', 'M'],
    },
    { rezhim: { rezhim: 'uchitel' } },
  );
}

function sobrat(p: PI18): Chast2Zadacha {
  const ch = chislaI18(p);
  const otv = p.nado === 'AB' ? ch.AB : ch.KM;
  return {
    no: 18,
    shablon: 'i18.dveOkrKasanie',
    uslovie:
      `Две окружности радиусов $${p.r}$ и $${p.R}$ касаются внешним образом в точке $K$. Их общая внешняя касательная касается меньшей окружности в точке $A$, а большей — в точке $B$. Общая касательная, проведённая через $K$, пересекает $AB$ в точке $M$.\n` +
      `а) Докажите, что угол $AKB$ прямой.\n` +
      `б) Найдите ${p.nado === 'AB' ? '$AB$' : '$KM$'}.`,
    risunok: chertezh(p),
    punkty: [
      { bukva: 'а', pole: null },
      { bukva: 'б', podpis: p.nado, pole: { vid: 'chislo', verno: String(otv) } },
    ],
    otvet: `б) $${otv}$`,
    reshenie: [
      {
        title: 'а) Отрезки касательных',
        lines: [
          `Из точки $M$ к меньшей окружности проведены касательные $MA$ и $MK$, к большей — $MB$ и $MK$. {{t:kasatelnye-otrezki|Отрезки касательных}} из одной точки равны: $MA=MK=MB$.`,
          `Значит, в треугольнике $AKB$ медиана $KM$ равна половине стороны $AB$, и точка $K$ лежит на окружности с диаметром $AB$: $\\angle AKB=90^\\circ$ ({{t:mediana-gipotenuza|медиана к гипотенузе}}).`,
        ],
      },
      {
        title: 'б) Длина общей касательной',
        lines: [
          `Радиусы $O_1A$ и $O_2B$ перпендикулярны касательной $AB$ ({{t:kasatelnaya-radius|касательная и радиус}}), $O_1O_2=${p.r}+${p.R}=${p.r + p.R}$ (линия центров проходит через точку касания).`,
          `Опускаем перпендикуляр из $O_1$ на $O_2B$: по {{t:pifagor|теореме Пифагора}} $AB^2=O_1O_2^2-(${p.R}-${p.r})^2=${(p.r + p.R) ** 2}-${(p.R - p.r) ** 2}=${ch.AB * ch.AB}$, $AB=${ch.AB}$.`,
          p.nado === 'AB'
            ? `Ответ: $${ch.AB}$.`
            : `$KM=\\dfrac{AB}{2}=${ch.KM}$. Ответ: $${ch.KM}$.`,
        ],
      },
      {
        title: 'Ответ',
        lines: [`б) $${otv}$.`],
      },
    ],
    razbor: [
      { slovo: 'а) Отрезки касательных из $M$ равны', formula: 'MA=MK=MB' },
      { slovo: 'а) Медиана равна половине стороны', formula: '\\angle AKB=90^\\circ' },
      { slovo: 'б) Общая касательная', formula: `AB^2=(R+r)^2-(R-r)^2=4Rr` },
      { slovo: 'Ответ', formula: String(otv) },
    ],
    kontrol: { otvet: otv },
  };
}

export const I18_DVE_OKR_KASANIE: Shablon2<PI18> = {
  no: 18,
  prototip:
    'Две касающиеся окружности и общая внешняя касательная: прямой угол и длина касательной',
  sobrat,
};
