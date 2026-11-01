/**
 * №18 (варианты 11–12): хорды AB и CD окружности перпендикулярны
 * и пересекаются в точке E; AE = p, EB = q, CE = s, ED = t, pq = st.
 *
 * а) ∠CAB = ∠CDB (вписанные, опираются на дугу CB), ∠AEC = ∠DEB ⇒
 *    △AEC ∼ △DEB ⇒ AE·EB = CE·ED.
 * б) Центр O лежит на серединных перпендикулярах к AB и CD; в системе
 *    E = (0; 0), AB — ось x: O = ((q − p)/2; (s − t)/2),
 *    R² = OB² = ((p + q)/2)² + ((s − t)/2)² = (p² + q² + s² + t²)/4.
 */

import { renderPlan } from '@/lib/planimetriya/render';
import type { Element } from '@/lib/planimetriya/types';
import { rat, toNumber } from '@/lib/zadanie15/core/rational';
import { sqrtRat, surdTex } from '@/lib/zadanie15/core/surd';
import type { Chast2Zadacha, Shablon2 } from './types';

export interface PA18 {
  p: number;
  q: number;
  s: number;
  t: number;
  /** Что дано в б): «ED» неизвестно и его находим (nado = 'R') — дано всё, кроме ED. */
  nado: 'R' | 'D';
}

export function chislaA18(p: PA18) {
  if (p.p * p.q !== p.s * p.t) throw new Error('a18: pq ≠ st');
  if (p.p === p.q && p.s === p.t) throw new Error('a18: диаметры');
  const R2 = rat(p.p ** 2 + p.q ** 2 + p.s ** 2 + p.t ** 2, 4);
  return { R2, D2: rat(p.p ** 2 + p.q ** 2 + p.s ** 2 + p.t ** 2) };
}

function chertezh(p: PA18, punkt: 'a' | 'b'): string {
  const k = 6 / (p.p + p.q);
  const A: [number, number] = [-p.p * k, 0];
  const B: [number, number] = [p.q * k, 0];
  const C: [number, number] = [0, p.s * k];
  const D: [number, number] = [0, -p.t * k];
  const E: [number, number] = [0, 0];
  const O: [number, number] = [((p.q - p.p) * k) / 2, ((p.s - p.t) * k) / 2];
  const R = Math.hypot(B[0] - O[0], B[1] - O[1]);
  const el: Element[] = [
    { tip: 'okruzhnost', okr: 'w' },
    { tip: 'otrezok', a: 'A', b: 'B' },
    { tip: 'otrezok', a: 'C', b: 'D' },
    { tip: 'ugol', a: 'B', v: 'E', b: 'C', pryamoy: true },
    { tip: 'tochka', t: 'E' },
  ];
  if (punkt === 'a') {
    el.push({ tip: 'otrezok', a: 'A', b: 'C', sloy: 'reshenie' });
    el.push({ tip: 'otrezok', a: 'D', b: 'B', sloy: 'reshenie' });
  } else {
    el.push({ tip: 'tochka', t: 'O' });
    el.push({ tip: 'otrezok', a: 'O', b: 'B', sloy: 'reshenie' });
  }
  return renderPlan(
    {
      tochki: { A, B, C, D, E, O },
      okruzhnosti: { w: { centr: 'O', radius: R } },
      elementy: el,
      podpisi: punkt === 'a' ? ['A', 'B', 'C', 'D', 'E'] : ['A', 'B', 'C', 'D', 'E', 'O'],
    },
    { rezhim: { rezhim: 'uchitel' } },
  );
}

function sobrat(p: PA18): Chast2Zadacha {
  const ch = chislaA18(p);
  const radius = p.nado === 'R';
  const otv = surdTex(sqrtRat(radius ? ch.R2 : ch.D2));
  const dano = radius
    ? `$AE=${p.p}$, $EB=${p.q}$, $CE=${p.s}$`
    : `$AE=${p.p}$, $EB=${p.q}$, $CE=${p.s}$`;
  return {
    no: 18,
    shablon: 'a18.perpHordy',
    uslovie:
      `Хорды $AB$ и $CD$ окружности перпендикулярны и пересекаются в точке $E$.\n` +
      `а) Докажите, что $AE\\cdot EB=CE\\cdot ED$.\n` +
      `б) Найдите ${radius ? 'радиус окружности' : 'диаметр окружности'}, если ${dano}.`,
    risunok: null,
    punkty: [
      { bukva: 'а', pole: null },
      {
        bukva: 'б',
        podpis: radius ? 'Радиус' : 'Диаметр',
        pole: { vid: 'chislo', verno: otv.replace(/\\dfrac/g, '\\frac') },
      },
    ],
    otvet: `б) $${otv}$`,
    reshenie: [
      {
        title: 'а) Подобные треугольники',
        risunok: chertezh(p, 'a'),
        lines: [
          'Углы $CAB$ и $CDB$ вписанные и опираются на одну дугу $CB$, поэтому равны. Углы $AEC$ и $DEB$ вертикальные.',
          'Значит, $\\triangle AEC\\sim\\triangle DEB$ ({{t:podobie-uu|подобие по двум углам}}) и $\\dfrac{AE}{DE}=\\dfrac{CE}{BE}$, то есть $AE\\cdot EB=CE\\cdot ED$.',
        ],
      },
      {
        title: 'б) Находим $ED$',
        lines: [
          `По пункту а) $ED=\\dfrac{AE\\cdot EB}{CE}=\\dfrac{${p.p}\\cdot${p.q}}{${p.s}}=${p.t}$.`,
        ],
      },
      {
        title: 'б) Центр окружности',
        risunok: chertezh(p, 'b'),
        lines: [
          `Центр $O$ лежит на серединном перпендикуляре к хорде $AB$ ({{t:seredinnyy-perp|точка, равноудалённая от концов отрезка}}), поэтому его расстояние до прямой $CD$ равно $\\left|\\dfrac{AB}{2}-AE\\right|=\\dfrac{|${p.q}-${p.p}|}{2}$; аналогично по хорде $CD$ ({{t:seredinnyy-perp|серединный перпендикуляр}}) расстояние до прямой $AB$ равно $\\dfrac{|${p.s}-${p.t}|}{2}$.`,
          `Проекция $O$ на $AB$ — середина $AB$, поэтому по {{t:pifagor|теореме Пифагора}} $R^2=\\left(\\dfrac{AB}{2}\\right)^2+\\left(\\dfrac{${p.s}-${p.t}}{2}\\right)^2=\\dfrac{${p.p}^2+${p.q}^2+${p.s}^2+${p.t}^2}{4}$.`,
          radius
            ? `$R=${otv}$. Ответ: $${otv}$.`
            : `$R=${surdTex(sqrtRat(ch.R2))}$, диаметр $2R=${otv}$. Ответ: $${otv}$.`,
        ],
      },
    ],
    razbor: [
      {
        slovo: 'а) Вписанные углы и вертикальные углы',
        formula: '\\triangle AEC\\sim\\triangle DEB',
      },
      { slovo: 'б) Четвёртый отрезок', formula: `ED=${p.t}` },
      {
        slovo: 'б) Центр на серединных перпендикулярах',
        formula: 'R^2=\\frac{AE^2+EB^2+CE^2+ED^2}{4}',
      },
      { slovo: 'Ответ', formula: otv },
    ],
    kontrol: { otvet: Math.sqrt(toNumber(radius ? ch.R2 : ch.D2)) },
  };
}

export const A18_PERP_HORDY: Shablon2<PA18> = {
  no: 18,
  prototip: 'Перпендикулярные хорды окружности: произведения отрезков, радиус по четырём отрезкам',
  sobrat,
};
