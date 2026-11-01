/**
 * №18 (варианты 21–22): точки касания окружности, вписанной в ромб.
 *
 * Ромб ABCD со стороной s и острым углом α (cos α рационален, sin α тоже).
 * P, Q, R, T — точки касания на AB, BC, CD, DA.
 * а) PR и QT — диаметры (радиусы в точки касания перпендикулярны
 *    параллельным сторонам), диагонали PQRT равны и делятся пополам:
 *    прямоугольник.
 * б) Угол между диаметрами PR и QT равен α; S = 4·½r²sin α = 2r²sin α,
 *    2r = s·sin α (высота ромба): S = s²sin³α/2. «otn» — S/S_ромба = sin²α/2.
 */

import { renderPlan } from '@/lib/planimetriya/render';
import type { Element } from '@/lib/planimetriya/types';
import { div, mul, rat, ratTex, toNumber } from '@/lib/zadanie15/core/rational';
import type { Chast2Zadacha, Shablon2 } from './types';

export interface PL18 {
  s: number;
  /** cos α = c1/c2, sin α = s1/c2 (пифагорова тройка). */
  c1: number;
  s1: number;
  c2: number;
  nado: 'S' | 'otn';
}

export function chislaL18(p: PL18) {
  if (p.c1 * p.c1 + p.s1 * p.s1 !== p.c2 * p.c2 || !(p.c1 > 0)) throw new Error('l18: тройка');
  const sinA = rat(p.s1, p.c2);
  const r = div(mul(rat(p.s), sinA), rat(2));
  const S = div(mul(rat(p.s * p.s), mul(sinA, mul(sinA, sinA))), rat(2));
  const Sromb = mul(rat(p.s * p.s), sinA);
  const otn = div(S, Sromb);
  return { sinA, r, S, Sromb, otn };
}

function chertezh(p: PL18, punkt: 'a' | 'b'): string {
  const al = Math.acos(p.c1 / p.c2);
  const k = 5 / p.s;
  const s = p.s * k;
  const A: [number, number] = [0, 0];
  const B: [number, number] = [s, 0];
  const D: [number, number] = [s * Math.cos(al), s * Math.sin(al)];
  const C: [number, number] = [B[0] + D[0], B[1] + D[1]];
  const O: [number, number] = [(A[0] + C[0]) / 2, (A[1] + C[1]) / 2];
  const r = (s * Math.sin(al)) / 2;
  const proj = (U: [number, number], V: [number, number]): [number, number] => {
    const dx = V[0] - U[0];
    const dy = V[1] - U[1];
    const t = ((O[0] - U[0]) * dx + (O[1] - U[1]) * dy) / (dx * dx + dy * dy);
    return [U[0] + t * dx, U[1] + t * dy];
  };
  const P = proj(A, B);
  const Q = proj(B, C);
  const R = proj(C, D);
  const T = proj(D, A);
  const el: Element[] = [
    { tip: 'mnogougolnik', tochki: ['A', 'B', 'C', 'D'] },
    { tip: 'okruzhnost', okr: 'w' },
    { tip: 'tochka', t: 'O' },
    { tip: 'mnogougolnik', tochki: ['P', 'Q', 'R', 'T'] },
  ];
  if (punkt === 'a') {
    el.push({ tip: 'otrezok', a: 'P', b: 'R', stil: 'punktir', sloy: 'reshenie' });
    el.push({ tip: 'otrezok', a: 'Q', b: 'T', stil: 'punktir', sloy: 'reshenie' });
    el.push({ tip: 'ugol', a: 'O', v: 'P', b: 'B', pryamoy: true, sloy: 'reshenie' });
  } else {
    el.push({ tip: 'otrezok', a: 'P', b: 'R', stil: 'punktir' });
    el.push({ tip: 'otrezok', a: 'Q', b: 'T', stil: 'punktir' });
    el.push({ tip: 'ugol', a: 'T', v: 'O', b: 'P' });
  }
  return renderPlan(
    {
      tochki: { A, B, C, D, O, P, Q, R, T },
      okruzhnosti: { w: { centr: 'O', radius: r } },
      elementy: el,
      podpisi: ['A', 'B', 'C', 'D', 'O', 'P', 'Q', 'R', 'T'],
    },
    { rezhim: { rezhim: 'uchitel' } },
  );
}

function sobrat(p: PL18): Chast2Zadacha {
  const ch = chislaL18(p);
  const otvR = p.nado === 'S' ? ch.S : ch.otn;
  const otvT = ratTex(otvR);
  const cosT = ratTex(rat(p.c1, p.c2));
  const uslovie =
    `Окружность с центром $O$, вписанная в ромб $ABCD$, касается сторон $AB$, $BC$, $CD$ и $DA$ в точках $P$, $Q$, $R$ и $T$ соответственно.\n` +
    `а) Докажите, что $PQRT$ — прямоугольник.\n` +
    `б) Найдите ${p.nado === 'S' ? 'площадь прямоугольника $PQRT$' : 'отношение площади прямоугольника $PQRT$ к площади ромба $ABCD$'}, если ${p.nado === 'S' ? `$AB=${p.s}$, а ` : ''}$\\cos\\angle BAD=${cosT}$.`;
  return {
    no: 18,
    shablon: 'l18.rombKasanie',
    uslovie,
    risunok: null,
    punkty: [
      { bukva: 'а', pole: null },
      {
        bukva: 'б',
        podpis: p.nado === 'S' ? 'Площадь' : 'Отношение',
        pole: { vid: 'chislo', verno: otvT.replace(/\\dfrac/g, '\\frac') },
      },
    ],
    otvet: `б) $${otvT}$`,
    reshenie: [
      {
        title: 'а) Отрезки $PR$ и $QT$ — диаметры',
        risunok: chertezh(p, 'a'),
        lines: [
          `Радиусы в точки касания перпендикулярны касательным: $OP\\perp AB$, $OR\\perp CD$ ({{t:kasatelnaya-radius|касательная перпендикулярна радиусу}}). Стороны ромба $AB$ и $CD$ параллельны, поэтому прямая, перпендикулярная $AB$ и проходящая через $O$, перпендикулярна и $CD$ ({{t:perp-parallel|прямая, перпендикулярная одной из параллельных, перпендикулярна и другой}}).`,
          `Центр $O$ вписанной окружности — точка пересечения диагоналей ромба ({{t:romb-diagonali|диагонали ромба — биссектрисы его углов}}). Точки $P$, $O$, $R$ лежат на одной прямой, и $PR$ — диаметр. Так же $QT$ — диаметр ($BC\\parallel AD$).`,
          `У четырёхугольника $PQRT$ диагонали $PR$ и $QT$ равны (диаметры) и делятся точкой $O$ пополам. Такой четырёхугольник — параллелограмм с равными диагоналями, то есть прямоугольник.`,
        ],
      },
      {
        title: 'б) Радиус и угол между диаметрами',
        risunok: chertezh(p, 'b'),
        lines: [
          `Диаметр вписанной окружности равен высоте ромба: $2r=AB\\sin\\angle BAD$. $\\sin\\angle BAD=\\sqrt{1-\\cos^2\\angle BAD}=${ratTex(ch.sinA)}$${p.nado === 'S' ? `, $r=\\dfrac{${p.s}\\cdot${ratTex(ch.sinA)}}{2}=${ratTex(ch.r)}$` : ''}.`,
          `$OT\\perp AD$ и $OP\\perp AB$ ({{t:kasatelnaya-radius|радиусы в точки касания}}), поэтому в четырёхугольнике $ATOP$ $\\angle TOP=180^\\circ-\\angle BAD$; угол между диаметрами $PR$ и $QT$ равен $\\angle BAD$.`,
        ],
      },
      {
        title: 'б) Площадь',
        lines: [
          `Диагонали делят прямоугольник на четыре треугольника со сторонами $r$, $r$ и углами $\\angle BAD$ или $180^\\circ-\\angle BAD$ между ними; синусы этих углов равны. По {{t:ploshchad-treugolnika|формуле площади треугольника}} $S_{PQRT}=4\\cdot\\dfrac12r^2\\sin\\angle BAD=2r^2\\sin\\angle BAD$.`,
          p.nado === 'S'
            ? `$S_{PQRT}=2\\cdot${ratTex(mul(ch.r, ch.r))}\\cdot${ratTex(ch.sinA)}=${otvT}$.`
            : `$S_{ABCD}=AB^2\\sin\\angle BAD=4r^2\\cdot\\dfrac{1}{\\sin\\angle BAD}$ (так как $AB=\\dfrac{2r}{\\sin\\angle BAD}$), откуда $\\dfrac{S_{PQRT}}{S_{ABCD}}=\\dfrac{\\sin^2\\angle BAD}{2}=${otvT}$.`,
          `Ответ: $${otvT}$.`,
        ],
      },
    ],
    razbor: [
      {
        slovo: 'а) Радиусы в точки касания на параллельных сторонах — один диаметр',
        formula: 'PR,\\ QT\\ \\text{— диаметры}',
      },
      {
        slovo: 'а) Равные диагонали, делящиеся пополам',
        formula: 'PQRT\\ \\text{— прямоугольник}',
      },
      { slovo: 'б) Диаметр — высота ромба', formula: '2r=AB\\sin\\angle BAD' },
      { slovo: 'б) Площадь через диагонали', formula: `S=2r^2\\sin\\angle BAD` },
      { slovo: 'Ответ', formula: otvT },
    ],
    kontrol: { otvet: toNumber(otvR), r: toNumber(ch.r) },
  };
}

export const L18_ROMB_KASANIE: Shablon2<PL18> = {
  no: 18,
  prototip:
    'Точки касания вписанной в ромб окружности образуют прямоугольник: доказательство и площадь',
  sobrat,
};
