/**
 * №18 (варианты 13–14): прямоугольный треугольник ABC (∠C = 90°),
 * BC = a, AC = b, AB = c (пифагорова тройка), CH — высота, CL —
 * биссектриса, M — середина AB.
 * а) ∠ACH = ∠B (оба дополняют ∠A до 90°), ∠BCM = ∠B (CM = MB), поэтому
 *    CL делит пополам и угол HCM.
 * б) AH = b²/c, AL = bc/(a + b) ⇒ HL = ab|a − b| / (c(a + b)).
 */

import { renderPlan } from '@/lib/planimetriya/render';
import type { Element } from '@/lib/planimetriya/types';
import { rat, ratTex, toNumber } from '@/lib/zadanie15/core/rational';
import type { Chast2Zadacha, Shablon2 } from './types';

export interface PO18 {
  a: number;
  b: number;
  /** Что найти: HL или HM. */
  nado: 'HL' | 'HM';
}

export function chislaO18(p: PO18) {
  const c = Math.sqrt(p.a * p.a + p.b * p.b);
  if (!Number.isInteger(c)) throw new Error('o18: гипотенуза не целая');
  if (p.a === p.b) throw new Error('o18: треугольник равнобедренный');
  const AH = rat(p.b * p.b, c);
  const AL = rat(p.b * c, p.a + p.b);
  const HL = rat(p.a * p.b * Math.abs(p.a - p.b), c * (p.a + p.b));
  /* HM = |c/2 − b²/c| = |a² − b²|/(2c). */
  const HM = rat(Math.abs(p.a * p.a - p.b * p.b), 2 * c);
  return { c, AH, AL, HL, HM };
}

function chertezh(p: PO18): string {
  const ch = chislaO18(p);
  const k = 6 / ch.c;
  const A: [number, number] = [0, p.b * k];
  const C: [number, number] = [0, 0];
  const B: [number, number] = [p.a * k, 0];
  const na = (t: number): [number, number] => [A[0] + (B[0] - A[0]) * t, A[1] + (B[1] - A[1]) * t];
  const H = na(toNumber(ch.AH) / ch.c);
  const L = na(toNumber(ch.AL) / ch.c);
  const M = na(0.5);
  const el: Element[] = [
    { tip: 'mnogougolnik', tochki: ['A', 'B', 'C'] },
    { tip: 'ugol', a: 'A', v: 'C', b: 'B', pryamoy: true },
    { tip: 'otrezok', a: 'C', b: 'H' },
    { tip: 'ugol', a: 'C', v: 'H', b: 'B', pryamoy: true },
    { tip: 'otrezok', a: 'C', b: 'L' },
    { tip: 'otrezok', a: 'C', b: 'M' },
    { tip: 'tochka', t: 'H' },
    { tip: 'tochka', t: 'L' },
    { tip: 'tochka', t: 'M' },
  ];
  return renderPlan(
    { tochki: { A, B, C, H, L, M }, elementy: el, podpisi: ['A', 'B', 'C', 'H', 'L', 'M'] },
    { rezhim: { rezhim: 'uchitel' } },
  );
}

function sobrat(p: PO18): Chast2Zadacha {
  const ch = chislaO18(p);
  const otv = p.nado === 'HL' ? ch.HL : ch.HM;
  const otvT = ratTex(otv);
  return {
    no: 18,
    shablon: 'o18.bissVysotaMediana',
    uslovie:
      `В прямоугольном треугольнике $ABC$ с прямым углом $C$ проведены высота $CH$, биссектриса $CL$ и медиана $CM$.\n` +
      `а) Докажите, что $CL$ — биссектриса угла $HCM$.\n` +
      `б) Найдите $${p.nado}$, если $BC=${p.a}$, $AC=${p.b}$.`,
    risunok: chertezh(p),
    punkty: [
      { bukva: 'а', pole: null },
      {
        bukva: 'б',
        podpis: p.nado,
        pole: { vid: 'chislo', verno: otvT.replace(/\\dfrac/g, '\\frac') },
      },
    ],
    otvet: `б) $${otvT}$`,
    reshenie: [
      {
        title: 'а) Равные углы',
        lines: [
          `В прямоугольном треугольнике $ACH$ $\\angle ACH=90^\\circ-\\angle A=\\angle B$.`,
          `Медиана, проведённая к гипотенузе, равна её половине ({{t:mediana-gipotenuza|медиана к гипотенузе}}): $CM=MB$, и в равнобедренном треугольнике $CMB$ ({{t:ravnobedr-ugly|углы при основании}}) $\\angle MCB=\\angle B$.`,
          `Так как $\\angle ACL=\\angle LCB=45^\\circ$, получаем $\\angle HCL=45^\\circ-\\angle ACH=45^\\circ-\\angle B=\\angle LCB-\\angle MCB=\\angle LCM$. Значит, $CL$ — биссектриса угла $HCM$.`,
        ],
      },
      {
        title: 'б) Отрезки на гипотенузе',
        lines: [
          `По {{t:pifagor|теореме Пифагора}} $AB=${ch.c}$. Катет есть среднее пропорциональное между гипотенузой и своей проекцией ({{t:vysota-pryamougolnogo|высота прямоугольного треугольника}}): $AH=\\dfrac{AC^2}{AB}=${ratTex(ch.AH)}$.`,
          `{{t:bissektrisa-otrezki|Биссектриса делит сторону}} пропорционально прилежащим сторонам: $\\dfrac{AL}{LB}=\\dfrac{AC}{BC}$, $AL=\\dfrac{AB\\cdot AC}{AC+BC}=${ratTex(ch.AL)}$; $AM=\\dfrac{AB}{2}$.`,
          p.nado === 'HL'
            ? `$HL=|AL-AH|=${otvT}$.`
            : `$HM=\\left|\\dfrac{AB}{2}-AH\\right|=${otvT}$.`,
          `Ответ: $${otvT}$.`,
        ],
      },
      {
        title: 'Ответ',
        lines: [`б) $${otvT}$.`],
      },
    ],
    razbor: [
      { slovo: 'а) $\\angle ACH=\\angle B=\\angle MCB$', formula: '\\angle HCL=\\angle LCM' },
      { slovo: 'б) Проекция катета', formula: `AH=\\frac{AC^2}{AB}=${ratTex(ch.AH)}` },
      { slovo: 'Свойство биссектрисы', formula: `AL=${ratTex(ch.AL)}` },
      { slovo: 'Ответ', formula: otvT },
    ],
    kontrol: { otvet: toNumber(otv), c: ch.c },
  };
}

export const O18_BISS_VYSOTA_MEDIANA: Shablon2<PO18> = {
  no: 18,
  prototip:
    'Прямоугольный треугольник: высота, биссектриса и медиана из вершины прямого угла; отрезки на гипотенузе',
  sobrat,
};
