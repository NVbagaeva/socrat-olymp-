/**
 * №18 (варианты 5–6): равнобедренная трапеция ABCD с основаниями AD = a,
 * BC = b, диагонали перпендикулярны.
 * а) Высота равна средней линии: диагонали с основаниями образуют
 *    равнобедренные прямоугольные треугольники, h = a/2 + b/2.
 * б) Площадь S = h·(a + b)/2 = ((a + b)/2)².
 */

import { renderPlan } from '@/lib/planimetriya/render';
import type { Element } from '@/lib/planimetriya/types';
import { rat, ratTex, toNumber } from '@/lib/zadanie15/core/rational';
import type { Chast2Zadacha, Shablon2 } from './types';

export interface PW18 {
  a: number;
  b: number;
}

export function chislaW18(p: PW18) {
  if (!(p.a > p.b && p.b > 0)) throw new Error('w18: основания');
  const h = rat(p.a + p.b, 2);
  const S = rat((p.a + p.b) * (p.a + p.b), 4);
  return { h, S };
}

function chertezh(p: PW18, punkt: 'a' | 'b'): string {
  const k = 6 / p.a;
  const a = p.a * k;
  const b = p.b * k;
  const h = ((p.a + p.b) / 2) * k;
  const A: [number, number] = [0, 0];
  const D: [number, number] = [a, 0];
  const B: [number, number] = [(a - b) / 2, h];
  const C: [number, number] = [(a + b) / 2, h];
  const O: [number, number] = [a / 2, (a / 2) * (h / (a / 2 + b / 2))];
  const K: [number, number] = [a / 2, h];
  const L: [number, number] = [a / 2, 0];
  const el: Element[] = [
    { tip: 'mnogougolnik', tochki: ['A', 'B', 'C', 'D'] },
    { tip: 'otrezok', a: 'A', b: 'C' },
    { tip: 'otrezok', a: 'B', b: 'D' },
    { tip: 'ugol', a: 'A', v: 'O', b: 'D', pryamoy: true },
    { tip: 'tochka', t: 'O' },
  ];
  if (punkt === 'a') {
    el.push({ tip: 'otrezok', a: 'K', b: 'L', sloy: 'reshenie' });
    el.push({ tip: 'tochka', t: 'K', sloy: 'reshenie' });
    el.push({ tip: 'tochka', t: 'L', sloy: 'reshenie' });
  }
  return renderPlan(
    {
      tochki: { A, B, C, D, O, K, L },
      elementy: el,
      podpisi: punkt === 'a' ? ['A', 'B', 'C', 'D', 'O', 'K', 'L'] : ['A', 'B', 'C', 'D', 'O'],
    },
    { rezhim: { rezhim: 'uchitel' } },
  );
}

function sobrat(p: PW18): Chast2Zadacha {
  const ch = chislaW18(p);
  const ST = ratTex(ch.S);
  return {
    no: 18,
    shablon: 'w18.trapeciyaPerp',
    uslovie:
      `Диагонали равнобедренной трапеции $ABCD$ с основаниями $AD$ и $BC$ перпендикулярны.\n` +
      `а) Докажите, что высота трапеции равна её средней линии.\n` +
      `б) Найдите площадь трапеции, если $AD=${p.a}$, $BC=${p.b}$.`,
    risunok: null,
    punkty: [
      { bukva: 'а', pole: null },
      {
        bukva: 'б',
        podpis: 'Площадь',
        pole: { vid: 'chislo', verno: ST.replace(/\\dfrac/g, '\\frac') },
      },
    ],
    otvet: `б) $${ST}$`,
    reshenie: [
      {
        title: 'а) Высота через точку пересечения диагоналей',
        risunok: chertezh(p, 'a'),
        lines: [
          `Пусть $O$ — точка пересечения диагоналей. Трапеция равнобедренная, поэтому её диагонали равны и $OA=OD$, $OB=OC$ ({{t:ravnobedr-trapeciya-os|ось равнобедренной трапеции}}). Треугольники $AOD$ и $BOC$ — равнобедренные прямоугольные, их острые углы равны $45^\\circ$ ({{t:ravnobedr-ugly|углы при основании равнобедренного треугольника}}).`,
          `Проведём через $O$ высоту $KL$ ($K\\in BC$, $L\\in AD$). Высоты $OL$ и $OK$ этих треугольников — медианы ({{t:ravnobedr-vysota|высота равнобедренного треугольника}}) и равны половинам гипотенуз ({{t:mediana-gipotenuza|медиана к гипотенузе}}): $OL=\\dfrac{AD}{2}$, $OK=\\dfrac{BC}{2}$. Значит, $KL=\\dfrac{AD+BC}{2}$ — длина средней линии ({{t:srednyaya-liniya-trapecii|средняя линия трапеции}}).`,
        ],
      },
      {
        title: 'б) Площадь',
        risunok: chertezh(p, 'b'),
        lines: [
          `$h=\\dfrac{${p.a}+${p.b}}{2}=${ratTex(ch.h)}$, $S=\\dfrac{AD+BC}{2}\\cdot h=h^2=${ST}$. Ответ: $${ST}$.`,
        ],
      },
      { title: 'Ответ', lines: [`Ответ: $${ST}$.`] },
    ],
    razbor: [
      {
        slovo: 'а) Треугольники $AOD$, $BOC$ — равнобедренные прямоугольные',
        formula: 'OL=\\frac{AD}{2},\\ OK=\\frac{BC}{2}',
      },
      { slovo: 'а) Высота', formula: 'h=\\frac{AD+BC}{2}' },
      { slovo: 'б) Площадь', formula: `S=h^2=${ST}` },
    ],
    kontrol: { otvet: toNumber(ch.S) },
  };
}

export const W18_TRAPECIYA_PERP: Shablon2<PW18> = {
  no: 18,
  prototip:
    'Равнобедренная трапеция с перпендикулярными диагоналями: высота равна средней линии, площадь',
  sobrat,
};
