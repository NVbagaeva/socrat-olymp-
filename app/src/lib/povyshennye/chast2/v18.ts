/**
 * №18 (варианты 3–4): AB — диаметр окружности, хорда CD ⊥ AB, H — их пересечение.
 * а) AC² = AH·AB (треугольник ACB прямоугольный, CH — высота).
 * б) CD = 2·CH, CH² = AH·HB.
 */

import { renderPlan } from '@/lib/planimetriya/render';
import type { Element } from '@/lib/planimetriya/types';
import { rat } from '@/lib/zadanie15/core/rational';
import { sqrtRat, surdTex, surdToNumber } from '@/lib/zadanie15/core/surd';
import type { Chast2Zadacha, Shablon2 } from './types';

export interface PV18 {
  AH: number;
  HB: number;
}

export function chislaV18(p: PV18) {
  if (!(p.AH > 0 && p.HB > 0 && p.AH !== p.HB)) throw new Error('v18: данные');
  const CD2 = rat(4 * p.AH * p.HB);
  const AC2 = rat(p.AH * (p.AH + p.HB));
  return { CD2, AC2, CD: surdToNumber(sqrtRat(CD2)) };
}

function chertezh(p: PV18, punkt: 'a' | 'b'): string {
  const k = 6 / (p.AH + p.HB);
  const R = 3;
  const A: [number, number] = [-R, 0];
  const B: [number, number] = [R, 0];
  const xH = -R + p.AH * k;
  const yC = Math.sqrt(R * R - xH * xH);
  const H: [number, number] = [xH, 0];
  const C: [number, number] = [xH, yC];
  const D: [number, number] = [xH, -yC];
  const O: [number, number] = [0, 0];
  const el: Element[] = [
    { tip: 'okruzhnost', okr: 'w' },
    { tip: 'otrezok', a: 'A', b: 'B' },
    { tip: 'otrezok', a: 'C', b: 'D' },
    { tip: 'ugol', a: 'B', v: 'H', b: 'C', pryamoy: true },
    { tip: 'tochka', t: 'H' },
    { tip: 'tochka', t: 'O' },
  ];
  if (punkt === 'a') {
    el.push({ tip: 'otrezok', a: 'A', b: 'C', sloy: 'reshenie' });
    el.push({ tip: 'otrezok', a: 'C', b: 'B', sloy: 'reshenie' });
    el.push({ tip: 'ugol', a: 'A', v: 'C', b: 'B', pryamoy: true, sloy: 'reshenie' });
  }
  return renderPlan(
    {
      tochki: { A, B, C, D, H, O },
      okruzhnosti: { w: { centr: 'O', radius: R } },
      elementy: el,
      podpisi: ['A', 'B', 'C', 'D', 'H', 'O'],
    },
    { rezhim: { rezhim: 'uchitel' } },
  );
}

function sobrat(p: PV18): Chast2Zadacha {
  const ch = chislaV18(p);
  const cdT = surdTex(sqrtRat(ch.CD2));
  const chT = surdTex(sqrtRat(rat(p.AH * p.HB)));
  return {
    no: 18,
    shablon: 'v18.diametrHorda',
    uslovie:
      `Отрезок $AB$ — диаметр окружности. Хорда $CD$ перпендикулярна $AB$ и пересекает его в точке $H$.\n` +
      `а) Докажите, что $AC^2=AH\\cdot AB$.\n` +
      `б) Найдите длину хорды $CD$, если $AH=${p.AH}$, $HB=${p.HB}$.`,
    risunok: null,
    punkty: [
      { bukva: 'а', pole: null },
      {
        bukva: 'б',
        podpis: 'Длина хорды',
        pole: { vid: 'chislo', verno: cdT.replace(/\\dfrac/g, '\\frac') },
      },
    ],
    otvet: `б) $${cdT}$`,
    reshenie: [
      {
        title: 'а) Прямоугольный треугольник $ACB$',
        risunok: chertezh(p, 'a'),
        lines: [
          `Угол $ACB$ опирается на диаметр, поэтому он прямой (медиана $CO$ треугольника $ACB$ равна половине $AB$ — {{t:mediana-gipotenuza|признак прямоугольного треугольника}}). В прямоугольном треугольнике $ACB$ отрезок $CH$ — высота к гипотенузе.`,
          `Треугольники $AHC$ и $ACB$ подобны ({{t:podobie-uu|по двум углам}}: общий угол $A$ и прямые углы $AHC$ и $ACB$), откуда $\\dfrac{AC}{AB}=\\dfrac{AH}{AC}$, то есть $AC^2=AH\\cdot AB$.`,
        ],
      },
      {
        title: 'б) Высота к гипотенузе',
        risunok: chertezh(p, 'b'),
        lines: [
          `Высота прямоугольного треугольника, проведённая к гипотенузе ({{t:vysota-pryamougolnogo|высота прямоугольного треугольника}}): $CH^2=AH\\cdot HB=${p.AH}\\cdot${p.HB}$, $CH=${chT}$.`,
          `Треугольник $OCD$ равнобедренный ($OC=OD$ — радиусы), его высота $OH$ является медианой ({{t:ravnobedr-vysota|высота равнобедренного треугольника}}), поэтому $CD=2CH=${cdT}$. Ответ: $${cdT}$.`,
        ],
      },
      { title: 'Ответ', lines: [`Ответ: $${cdT}$.`] },
    ],
    razbor: [
      { slovo: 'а) Угол, опирающийся на диаметр, прямой', formula: '\\angle ACB=90^\\circ' },
      { slovo: 'а) Подобие $AHC$ и $ACB$', formula: 'AC^2=AH\\cdot AB' },
      { slovo: 'б) Высота к гипотенузе', formula: `CH^2=AH\\cdot HB` },
      { slovo: 'Ответ', formula: cdT },
    ],
    kontrol: { otvet: ch.CD },
  };
}

export const V18_DIAMETR_HORDA: Shablon2<PV18> = {
  no: 18,
  prototip:
    'Диаметр и перпендикулярная хорда: квадрат хорды AC и длина хорды CD через высоту к гипотенузе',
  sobrat,
};
