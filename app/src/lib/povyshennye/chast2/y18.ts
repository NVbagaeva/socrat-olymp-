/**
 * №18 (варианты 9–10): трапеция ABCD (BC ∥ AD), диагонали пересекаются
 * в точке O; S(BOC) = u², S(AOD) = w².
 *
 * а) S(ABD) = S(ACD) (общее основание AD, равные высоты) ⇒
 *    S(AOB) = S(ABD) − S(AOD) = S(ACD) − S(AOD) = S(COD).
 * б) △BOC ∼ △DOA с коэффициентом u/w ⇒ BO/OD = u/w;
 *    S(AOB)/S(AOD) = BO/OD (общая высота из A) ⇒ S(AOB) = uw.
 *    S(ABCD) = u² + w² + 2uw = (u + w)².
 */

import { renderPlan } from '@/lib/planimetriya/render';
import type { Element } from '@/lib/planimetriya/types';
import type { Chast2Zadacha, Shablon2 } from './types';

export interface PY18 {
  u: number;
  w: number;
  nado: 'S' | 'AOB';
}

export function chislaY18(p: PY18) {
  if (!(p.u > 0 && p.w > 0 && p.u !== p.w)) throw new Error('y18: параметры');
  return { S1: p.u * p.u, S2: p.w * p.w, Sb: p.u * p.w, S: (p.u + p.w) ** 2 };
}

function chertezh(p: PY18, punkt: 'a' | 'b'): string {
  const k = 6 / Math.max(p.u, p.w);
  const AD = p.w * k;
  const BC = p.u * k;
  const h = 3.2;
  const A: [number, number] = [0, 0];
  const D: [number, number] = [AD, 0];
  /* Верхнее основание — посередине со сдвигом: трапеция не вырождается и при BC > AD. */
  const B: [number, number] = [(AD - BC) / 2 + 0.6, h];
  const C: [number, number] = [B[0] + BC, h];
  /* O делит диагонали в отношении BC : AD от вершин верхнего основания. */
  const t = BC / (BC + AD);
  const O: [number, number] = [B[0] + t * (D[0] - B[0]), B[1] + t * (D[1] - B[1])];
  const el: Element[] = [
    { tip: 'mnogougolnik', tochki: ['A', 'B', 'C', 'D'] },
    { tip: 'otrezok', a: 'A', b: 'C' },
    { tip: 'otrezok', a: 'B', b: 'D' },
    { tip: 'tochka', t: 'O' },
  ];
  if (punkt === 'a') {
    el.push({ tip: 'oblast', tochki: ['A', 'O', 'B'] });
    el.push({ tip: 'oblast', tochki: ['C', 'O', 'D'] });
  } else {
    el.push({ tip: 'oblast', tochki: ['B', 'O', 'C'] });
    el.push({ tip: 'oblast', tochki: ['A', 'O', 'D'] });
  }
  return renderPlan(
    { tochki: { A, B, C, D, O }, elementy: el, podpisi: ['A', 'B', 'C', 'D', 'O'] },
    { rezhim: { rezhim: 'uchitel' } },
  );
}

function sobrat(p: PY18): Chast2Zadacha {
  const ch = chislaY18(p);
  const vse = p.nado === 'S';
  const otv = String(vse ? ch.S : ch.Sb);
  return {
    no: 18,
    shablon: 'y18.trapeciyaDiagonali',
    uslovie:
      `Диагонали трапеции $ABCD$ с основаниями $BC$ и $AD$ пересекаются в точке $O$.\n` +
      `а) Докажите, что площади треугольников $AOB$ и $COD$ равны.\n` +
      `б) Найдите ${vse ? 'площадь трапеции' : 'площадь треугольника $AOB$'}, если площади треугольников $BOC$ и $AOD$ равны $${ch.S1}$ и $${ch.S2}$.`,
    risunok: null,
    punkty: [
      { bukva: 'а', pole: null },
      { bukva: 'б', podpis: 'Площадь', pole: { vid: 'chislo', verno: otv } },
    ],
    otvet: `б) $${otv}$`,
    reshenie: [
      {
        title: 'а) Треугольники с общим основанием',
        risunok: chertezh(p, 'a'),
        lines: [
          `У треугольников $ABD$ и $ACD$ общее основание $AD$, а высоты равны расстоянию между параллельными прямыми $BC$ и $AD$. Значит, $S_{ABD}=S_{ACD}$ ({{t:ploshchad-treugolnika|площадь треугольника}}).`,
          '$S_{AOB}=S_{ABD}-S_{AOD}=S_{ACD}-S_{AOD}=S_{COD}$. Что и требовалось доказать.',
        ],
      },
      {
        title: 'б) Подобие треугольников $BOC$ и $DOA$',
        risunok: chertezh(p, 'b'),
        lines: [
          `$\\angle OBC=\\angle ODA$ и $\\angle OCB=\\angle OAD$ ({{t:nakrest-ugly|накрест лежащие углы при параллельных}}), поэтому $\\triangle BOC\\sim\\triangle DOA$ ({{t:podobie-uu|по двум углам}}).`,
          `Отношение площадей подобных треугольников равно квадрату коэффициента: $k^2=\\dfrac{${ch.S1}}{${ch.S2}}$, $k=\\dfrac{${p.u}}{${p.w}}$, то есть $\\dfrac{BO}{OD}=\\dfrac{${p.u}}{${p.w}}$.`,
        ],
      },
      {
        title: 'б) Площади',
        lines: [
          `Треугольники $AOB$ и $AOD$ имеют общую высоту из вершины $A$, поэтому их площади относятся как основания ({{t:ploshchad-treugolnika|площадь треугольника}} — половина основания на высоту): $S_{AOB}=S_{AOD}\\cdot\\dfrac{BO}{OD}=${ch.S2}\\cdot\\dfrac{${p.u}}{${p.w}}=${ch.Sb}$.`,
          vse
            ? `По пункту а) $S_{COD}=${ch.Sb}$; $S_{ABCD}=${ch.S1}+${ch.S2}+2\\cdot${ch.Sb}=${ch.S}$.`
            : `Ответ: $${ch.Sb}$.`,
        ],
      },
    ],
    razbor: [
      {
        slovo: 'а) Общее основание и равные высоты',
        formula: 'S_{ABD}=S_{ACD}\\Rightarrow S_{AOB}=S_{COD}',
      },
      { slovo: 'б) Подобие по двум углам', formula: `\\frac{BO}{OD}=\\frac{${p.u}}{${p.w}}` },
      { slovo: 'б) Общая высота', formula: `S_{AOB}=${ch.Sb}` },
      { slovo: 'Ответ', formula: otv },
    ],
    kontrol: { otvet: vse ? ch.S : ch.Sb },
  };
}

export const Y18_TRAPECIYA_DIAGONALI: Shablon2<PY18> = {
  no: 18,
  prototip:
    'Трапеция с диагоналями: равновеликие боковые треугольники, площадь по площадям треугольников при основаниях',
  sobrat,
};
