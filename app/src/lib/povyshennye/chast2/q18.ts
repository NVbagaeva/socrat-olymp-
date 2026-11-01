/**
 * №18 (варианты 29–30): квадрат ABCD со стороной s, M на BC, N на CD,
 * BM = CN = t·s; AM ∩ BN = P.
 *
 * а) △ABM = △BCN (два катета) ⇒ ∠BAM = ∠CBN ⇒ ∠PBA + ∠PAB = 90° ⇒ AM ⊥ BN.
 * б) BP — высота прямоугольного треугольника ABM: BP = s·t/√(1 + t²),
 *    PM = t²s/√(1 + t²); S(BPM) = t³s²/(2(1 + t²)), S(BCN) = ts²/2.
 *    «PMCN»: S(PMCN)/s² = t/(2(1 + t²));
 *    «APND»: 1 − (2t + t³)/(2(1 + t²)) (квадрат без ABP, BPM, PMCN, S(ABP) = S(PMCN)).
 */

import { renderPlan } from '@/lib/planimetriya/render';
import type { Element } from '@/lib/planimetriya/types';
import { add, div, mul, rat, ratTex, sub, toNumber } from '@/lib/zadanie15/core/rational';
import type { Chast2Zadacha, Shablon2 } from './types';

export interface PQ18 {
  /** BM : BC = u : w. */
  u: number;
  w: number;
  nado: 'PMCN' | 'APND';
}

export function chislaQ18(p: PQ18) {
  const t = rat(p.u, p.w);
  const t2 = mul(t, t);
  const zn = mul(rat(2), add(rat(1), t2));
  const pmcn = div(t, zn);
  const bpm = div(mul(t, t2), zn);
  const apnd = sub(rat(1), div(add(mul(rat(2), t), mul(t, t2)), zn));
  return { t, pmcn, bpm, apnd, abp: pmcn };
}

function chertezh(p: PQ18, punkt: 'a' | 'b'): string {
  const s = 4;
  const t = p.u / p.w;
  const A: [number, number] = [0, 0];
  const B: [number, number] = [0, s];
  const C: [number, number] = [s, s];
  const D: [number, number] = [s, 0];
  const M: [number, number] = [t * s, s];
  const N: [number, number] = [s, s - t * s];
  /* P = AM ∩ BN. */
  const k = 1 / (1 + t * t);
  const P: [number, number] = [t * s * k, s * k];
  const el: Element[] = [
    { tip: 'mnogougolnik', tochki: ['A', 'B', 'C', 'D'] },
    { tip: 'otrezok', a: 'A', b: 'M' },
    { tip: 'otrezok', a: 'B', b: 'N' },
    { tip: 'tochka', t: 'M' },
    { tip: 'tochka', t: 'N' },
    { tip: 'tochka', t: 'P' },
  ];
  if (punkt === 'a')
    el.push({ tip: 'ugol', a: 'B', v: 'P', b: 'A', pryamoy: true, sloy: 'reshenie' });
  else
    el.push({
      tip: 'mnogougolnik',
      tochki: p.nado === 'PMCN' ? ['P', 'M', 'C', 'N'] : ['A', 'P', 'N', 'D'],
      sloy: 'reshenie',
    });
  return renderPlan(
    { tochki: { A, B, C, D, M, N, P }, elementy: el, podpisi: ['A', 'B', 'C', 'D', 'M', 'N', 'P'] },
    {
      rezhim: { rezhim: 'uchitel' },
      shirina: 260,
      vysota: 240,
      alt: 'Квадрат ABCD, точки M на BC и N на CD, отрезки AM и BN пересекаются в точке P',
    },
  );
}

function sobrat(p: PQ18): Chast2Zadacha {
  if (!(p.u > 0 && p.u < p.w)) throw new Error('q18: отношение');
  const ch = chislaQ18(p);
  const tT = ratTex(ch.t);
  const otv = p.nado === 'PMCN' ? ch.pmcn : ch.apnd;
  const otvT = ratTex(otv);
  const figura = p.nado === 'PMCN' ? 'четырёхугольника $PMCN$' : 'четырёхугольника $APND$';
  const uslovie =
    `На сторонах $BC$ и $CD$ квадрата $ABCD$ отмечены точки $M$ и $N$ так, что $BM=CN$ и $BM:MC=${p.u}:${p.w - p.u}$. Отрезки $AM$ и $BN$ пересекаются в точке $P$.\n` +
    `а) Докажите, что прямые $AM$ и $BN$ перпендикулярны.\n` +
    `б) Найдите отношение площади ${figura} к площади квадрата.`;
  const bLast =
    p.nado === 'PMCN'
      ? `$S_{PMCN}=S_{BCN}-S_{BPM}=\\dfrac{t}{2}a^2-\\dfrac{t^3}{2(1+t^2)}a^2=\\dfrac{t}{2(1+t^2)}a^2$, при $t=${tT}$ отношение равно $${otvT}$.`
      : `$S_{ABP}=S_{ABM}-S_{BPM}=\\dfrac{t}{2}a^2-\\dfrac{t^3}{2(1+t^2)}a^2=\\dfrac{t}{2(1+t^2)}a^2$, и так же $S_{PMCN}=\\dfrac{t}{2(1+t^2)}a^2$. $S_{APND}=a^2-S_{ABP}-S_{BPM}-S_{PMCN}=a^2\\left(1-\\dfrac{2t+t^3}{2(1+t^2)}\\right)$; при $t=${tT}$ отношение равно $${otvT}$.`;
  return {
    no: 18,
    shablon: 'q18.kvadratPerp',
    uslovie,
    risunok: null,
    punkty: [
      { bukva: 'а', pole: null },
      {
        bukva: 'б',
        podpis: 'Отношение площадей',
        pole: { vid: 'chislo', verno: otvT.replace(/\\dfrac/g, '\\frac') },
      },
    ],
    otvet: `б) $${otvT}$`,
    reshenie: [
      {
        title: 'а) Равные треугольники',
        risunok: chertezh(p, 'a'),
        lines: [
          `Прямоугольные треугольники $ABM$ и $BCN$ равны по двум катетам: $AB=BC$, $BM=CN$. Значит, $\\angle BAM=\\angle CBN$.`,
          `$\\angle PBA+\\angle PAB=\\angle PBA+\\angle CBN=\\angle ABC=90^\\circ$, поэтому в треугольнике $ABP$ угол $APB$ равен $180^\\circ-90^\\circ=90^\\circ$: $AM\\perp BN$.`,
        ],
      },
      {
        title: 'б) Отрезки в прямоугольном треугольнике $ABM$',
        risunok: chertezh(p, 'b'),
        lines: [
          `Пусть $AB=a$, $BM=ta$, $t=${tT}$. По {{t:pifagor|теореме Пифагора}} $AM=a\\sqrt{1+t^2}$.`,
          `$BP$ — {{t:vysota-pryamougolnogo|высота прямоугольного треугольника}} $ABM$: $BM^2=PM\\cdot AM$, откуда $PM=\\dfrac{t^2a}{\\sqrt{1+t^2}}$, и $BP=\\dfrac{AB\\cdot BM}{AM}=\\dfrac{ta}{\\sqrt{1+t^2}}$.`,
          `Треугольник $BPM$ прямоугольный: {{t:ploshchad-treugolnika|площадь}} $S_{BPM}=\\dfrac12 BP\\cdot PM=\\dfrac{t^3}{2(1+t^2)}a^2$; $S_{BCN}=S_{ABM}=\\dfrac{t}{2}a^2$ (треугольники {{t:podobie-uu|подобны}} с коэффициентом 1 — равны).`,
        ],
      },
      { title: 'б) Ответ', lines: [bLast, `Ответ: $${otvT}$.`] },
    ],
    razbor: [
      { slovo: 'а) Равные прямоугольные треугольники', formula: '\\angle BAM=\\angle CBN' },
      { slovo: 'а) Сумма острых углов', formula: '\\angle APB=90^\\circ' },
      { slovo: 'б) Высота к гипотенузе $AM$', formula: 'S_{BPM}=\\dfrac{t^3}{2(1+t^2)}a^2' },
      { slovo: 'б) Ответ', formula: otvT },
    ],
    kontrol: { otvet: toNumber(otv), t: toNumber(ch.t) },
  };
}

export const Q18_KVADRAT_PERP: Shablon2<PQ18> = {
  no: 18,
  prototip:
    'Квадрат: BM = CN ⇒ AM ⊥ BN; доля площади четырёхугольника через высоту прямоугольного треугольника',
  sobrat,
};
