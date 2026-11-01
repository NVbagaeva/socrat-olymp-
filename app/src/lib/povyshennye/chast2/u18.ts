/**
 * №18 (варианты 1–2): две окружности радиусов R и r касаются внешним
 * образом в точке K, общая внешняя касательная касается их в A и B.
 * а) ∠AKB = 90° (касательная в K делит AB пополам: отрезки касательных).
 * б) Расстояние от K до прямой AB равно 2Rr/(R + r):
 *    K делит O₁O₂ в отношении R : r, расстояния от O₁ и O₂ до AB — R и r.
 */

import { renderPlan } from '@/lib/planimetriya/render';
import type { Element } from '@/lib/planimetriya/types';
import { rat, ratTex, toNumber } from '@/lib/zadanie15/core/rational';
import type { Chast2Zadacha, Shablon2 } from './types';

export interface PU18 {
  R: number;
  r: number;
}

export function chislaU18(p: PU18) {
  if (!(p.R > p.r && p.r > 0)) throw new Error('u18: R > r > 0');
  const h = rat(2 * p.R * p.r, p.R + p.r);
  return { h, AB: 2 * Math.sqrt(p.R * p.r) };
}

function chertezh(p: PU18, punkt: 'a' | 'b'): string {
  const k = 5 / (p.R + p.r);
  const R = p.R * k;
  const r = p.r * k;
  const d = 2 * Math.sqrt(R * r);
  const O1: [number, number] = [0, R];
  const O2: [number, number] = [d, r];
  const A: [number, number] = [0, 0];
  const B: [number, number] = [d, 0];
  const t = R / (R + r);
  const K: [number, number] = [O1[0] + (O2[0] - O1[0]) * t, O1[1] + (O2[1] - O1[1]) * t];
  const M: [number, number] = [d / 2, 0];
  const H: [number, number] = [K[0], 0];
  const el: Element[] = [
    { tip: 'okruzhnost', okr: 'w1' },
    { tip: 'okruzhnost', okr: 'w2' },
    { tip: 'otrezok', a: 'A', b: 'B' },
    { tip: 'otrezok', a: 'A', b: 'K' },
    { tip: 'otrezok', a: 'K', b: 'B' },
    { tip: 'tochka', t: 'K' },
    { tip: 'tochka', t: 'O1' },
    { tip: 'tochka', t: 'O2' },
  ];
  if (punkt === 'a') {
    el.push({ tip: 'otrezok', a: 'K', b: 'M', sloy: 'reshenie' });
    el.push({ tip: 'ugol', a: 'A', v: 'K', b: 'B', pryamoy: true, sloy: 'reshenie' });
  } else {
    el.push({ tip: 'otrezok', a: 'O1', b: 'O2', sloy: 'reshenie' });
    el.push({ tip: 'otrezok', a: 'K', b: 'H', sloy: 'reshenie' });
    el.push({ tip: 'ugol', a: 'A', v: 'H', b: 'K', pryamoy: true, sloy: 'reshenie' });
  }
  return renderPlan(
    {
      tochki: { A, B, K, O1, O2, M, H },
      okruzhnosti: { w1: { centr: 'O1', radius: R }, w2: { centr: 'O2', radius: r } },
      elementy: el,
      podpisi: punkt === 'a' ? ['A', 'B', 'K', 'O1', 'O2', 'M'] : ['A', 'B', 'K', 'O1', 'O2', 'H'],
    },
    { rezhim: { rezhim: 'uchitel' } },
  );
}

function sobrat(p: PU18): Chast2Zadacha {
  const ch = chislaU18(p);
  const hT = ratTex(ch.h);
  return {
    no: 18,
    shablon: 'u18.dveOkrKasat',
    uslovie:
      `Окружности радиусов $${p.R}$ и $${p.r}$ касаются внешним образом в точке $K$. Прямая касается первой окружности в точке $A$, второй — в точке $B$ и не проходит через $K$.\n` +
      `а) Докажите, что угол $AKB$ прямой.\n` +
      `б) Найдите расстояние от точки $K$ до прямой $AB$.`,
    risunok: null,
    punkty: [
      { bukva: 'а', pole: null },
      {
        bukva: 'б',
        podpis: 'Расстояние',
        pole: { vid: 'chislo', verno: hT.replace(/\\dfrac/g, '\\frac') },
      },
    ],
    otvet: `б) $${hT}$`,
    reshenie: [
      {
        title: 'а) Общая касательная в точке $K$',
        risunok: chertezh(p, 'a'),
        lines: [
          `Проведём через $K$ общую касательную окружностей; пусть она пересекает $AB$ в точке $M$. По свойству {{t:kasatelnye-otrezki|отрезков касательных}} $MA=MK$ (к первой окружности) и $MB=MK$ (ко второй).`,
          `Значит, $M$ — середина $AB$ и медиана $KM$ треугольника $AKB$ равна половине стороны $AB$. Поэтому треугольник $AKB$ прямоугольный с прямым углом $K$ (обратное к свойству {{t:mediana-gipotenuza|медианы к гипотенузе}}).`,
        ],
      },
      {
        title: 'б) Расстояния от центров',
        risunok: chertezh(p, 'b'),
        lines: [
          `Радиусы $O_1A$ и $O_2B$ перпендикулярны прямой $AB$ ({{t:kasatelnaya-radius|касательная перпендикулярна радиусу}}), их длины $${p.R}$ и $${p.r}$ — расстояния от центров до $AB$.`,
          `Точка касания $K$ лежит на линии центров $O_1O_2$ и делит её в отношении $O_1K:KO_2=${p.R}:${p.r}$. Длина $O_1O_2=${p.R + p.r}$, и по {{t:pifagor|теореме Пифагора}} $AB=\\sqrt{(${p.R}+${p.r})^2-(${p.R}-${p.r})^2}=2\\sqrt{${p.R}\\cdot${p.r}}$.`,
          `Проведём через $K$ прямую, параллельную $AB$; из {{t:podobie-uu|подобия треугольников}}, отсекаемых от трапеции $O_1ABO_2$, высота точки $K$ над $AB$ — взвешенное среднее высот $${p.R}$ и $${p.r}$. Расстояние от точки отрезка до прямой меняется линейно, поэтому $KH=\\dfrac{${p.r}\\cdot${p.R}+${p.R}\\cdot${p.r}}{${p.R}+${p.r}}=\\dfrac{2\\cdot${p.R}\\cdot${p.r}}{${p.R + p.r}}=${hT}$.`,
          `Ответ: $${hT}$.`,
        ],
      },
      { title: 'Ответ', lines: [`Ответ: $${hT}$.`] },
    ],
    razbor: [
      { slovo: 'а) Касательная в $K$ пересекает $AB$ в $M$', formula: 'MA=MK=MB' },
      { slovo: 'а) Медиана равна половине стороны', formula: '\\angle AKB=90^\\circ' },
      { slovo: 'б) $K$ делит $O_1O_2$ как $R:r$', formula: 'KH=\\frac{2Rr}{R+r}' },
      { slovo: 'Ответ', formula: hT },
    ],
    kontrol: { otvet: toNumber(ch.h) },
  };
}

export const U18_DVE_OKR_KASAT: Shablon2<PU18> = {
  no: 18,
  prototip:
    'Две касающиеся окружности и общая внешняя касательная: прямой угол AKB и расстояние от K до касательной',
  sobrat,
};
