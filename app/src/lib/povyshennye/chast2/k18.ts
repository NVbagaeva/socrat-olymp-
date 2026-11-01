/**
 * №18 (варианты 19–20): высота и биссектриса из одной вершины.
 *
 * Треугольник ABC (BC = a, AC = b, AB = c, углы A и C острые, a ≠ c),
 * BH — высота, BL — биссектриса.
 * а) ∠HBL = |∠A − ∠C| / 2: ∠ABH = 90° − A, ∠ABL = B/2 = 90° − (A + C)/2.
 * б) ∠BHL = 90°: окружность около BHL имеет диаметр BL, R = BL/2.
 *    AL = bc/(a + c) (свойство биссектрисы), BL² по теореме косинусов
 *    в треугольнике ABL: BL² = ac·(1 − b²/(a + c)²).
 */

import { renderPlan } from '@/lib/planimetriya/render';
import type { Element } from '@/lib/planimetriya/types';
import { add, div, mul, rat, ratTex, sub, toNumber } from '@/lib/zadanie15/core/rational';
import { sqrtRat, surdTex, surdToNumber } from '@/lib/zadanie15/core/surd';
import type { Chast2Zadacha, Shablon2 } from './types';

export interface PK18 {
  a: number;
  b: number;
  c: number;
}

export function chislaK18(p: PK18) {
  const { a, b, c } = p;
  if (!(a + b > c && a + c > b && b + c > a)) throw new Error('k18: не треугольник');
  if (!(a * a < b * b + c * c && c * c < a * a + b * b))
    throw new Error('k18: углы A и C не острые');
  if (a === c) throw new Error('k18: H и L совпадают');
  const AL = rat(b * c, a + c);
  const cosA = rat(b * b + c * c - a * a, 2 * b * c);
  /* BL² = c² + AL² − 2c·AL·cos A. */
  const BL2 = sub(add(rat(c * c), mul(AL, AL)), mul(mul(rat(2 * c), AL), cosA));
  const R2 = div(BL2, rat(4));
  return { AL, cosA, BL2, R2, R: surdToNumber(sqrtRat(R2)) };
}

function chertezh(p: PK18, punkt: 'a' | 'b'): string {
  const ch = chislaK18(p);
  const k = 6 / p.b;
  const xB = (p.c * p.c - p.a * p.a + p.b * p.b) / (2 * p.b);
  const yB = Math.sqrt(p.c * p.c - xB * xB);
  const A: [number, number] = [0, 0];
  const C: [number, number] = [p.b * k, 0];
  const B: [number, number] = [xB * k, yB * k];
  const H: [number, number] = [xB * k, 0];
  const L: [number, number] = [toNumber(ch.AL) * k, 0];
  const O: [number, number] = [(B[0] + L[0]) / 2, (B[1] + L[1]) / 2];
  const el: Element[] = [
    { tip: 'mnogougolnik', tochki: ['A', 'B', 'C'] },
    { tip: 'otrezok', a: 'B', b: 'H' },
    { tip: 'ugol', a: 'B', v: 'H', b: 'C', pryamoy: true },
    { tip: 'otrezok', a: 'B', b: 'L' },
    { tip: 'ugol', a: 'A', v: 'B', b: 'L' },
    { tip: 'ugol', a: 'L', v: 'B', b: 'C' },
    { tip: 'tochka', t: 'H' },
    { tip: 'tochka', t: 'L' },
  ];
  if (punkt === 'b') {
    el.push({ tip: 'okruzhnost', okr: 'w', sloy: 'reshenie' });
    el.push({ tip: 'tochka', t: 'O', sloy: 'reshenie' });
  }
  return renderPlan(
    {
      tochki: { A, B, C, H, L, O },
      okruzhnosti: { w: { centr: 'O', radius: (ch.R * 2 * k) / 2 } },
      elementy: el,
      podpisi: punkt === 'a' ? ['A', 'B', 'C', 'H', 'L'] : ['A', 'B', 'C', 'H', 'L', 'O'],
    },
    { rezhim: { rezhim: 'uchitel' } },
  );
}

function sobrat(p: PK18): Chast2Zadacha {
  const ch = chislaK18(p);
  const otvT = surdTex(sqrtRat(ch.R2));
  const uslovie =
    `В треугольнике $ABC$ стороны равны $AB=${p.c}$, $BC=${p.a}$, $AC=${p.b}$. Из вершины $B$ проведены высота $BH$ и биссектриса $BL$.\n` +
    `а) Докажите, что угол $HBL$ равен полуразности углов $A$ и $C$ треугольника.\n` +
    `б) Найдите радиус окружности, описанной около треугольника $BHL$.`;
  const bol = p.a > p.c ? 'A' : 'C';
  const men = p.a > p.c ? 'C' : 'A';
  return {
    no: 18,
    shablon: 'k18.vysotaBiss',
    uslovie,
    risunok: null,
    punkty: [
      { bukva: 'а', pole: null },
      {
        bukva: 'б',
        podpis: 'Радиус',
        pole: { vid: 'chislo', verno: otvT.replace(/\\dfrac/g, '\\frac') },
      },
    ],
    otvet: `б) $${otvT}$`,
    reshenie: [
      {
        title: 'а) Углы при вершине $B$',
        risunok: chertezh(p, 'a'),
        lines: [
          `Углы $A$ и $C$ острые ($${p.a}^2<${p.b}^2+${p.c}^2$ и $${p.c}^2<${p.a}^2+${p.b}^2$), поэтому основание высоты $H$ лежит на стороне $AC$. В прямоугольном треугольнике $ABH$ $\\angle ABH=90^\\circ-\\angle A$.`,
          `Биссектриса делит угол $B$ пополам: $\\angle ABL=\\dfrac{\\angle B}{2}=\\dfrac{180^\\circ-\\angle A-\\angle C}{2}=90^\\circ-\\dfrac{\\angle A+\\angle C}{2}$.`,
          `$\\angle HBL=\\left|\\angle ABL-\\angle ABH\\right|=\\left|90^\\circ-\\dfrac{\\angle A+\\angle C}{2}-90^\\circ+\\angle A\\right|=\\dfrac{\\left|\\angle A-\\angle C\\right|}{2}$, что и требовалось. Здесь угол $${bol}$ больше угла $${men}$, так как против большей стороны лежит больший угол.`,
        ],
      },
      {
        title: 'б) Окружность с диаметром $BL$',
        risunok: chertezh(p, 'b'),
        lines: [
          `Угол $BHL$ прямой, поэтому центр окружности, описанной около треугольника $BHL$, — середина гипотенузы $BL$ ({{t:mediana-gipotenuza|медиана к гипотенузе равна её половине}}), и $R=\\dfrac{BL}{2}$.`,
          `По {{t:bissektrisa-otrezki|свойству биссектрисы}} $\\dfrac{AL}{LC}=\\dfrac{AB}{BC}=\\dfrac{${p.c}}{${p.a}}$, откуда $AL=\\dfrac{${p.b}\\cdot${p.c}}{${p.a}+${p.c}}=${ratTex(ch.AL)}$.`,
        ],
      },
      {
        title: 'б) Длина биссектрисы',
        lines: [
          `По {{t:teorema-kosinusov|теореме косинусов}} в треугольнике $ABC$: $\\cos A=\\dfrac{AB^2+AC^2-BC^2}{2\\cdot AB\\cdot AC}=${ratTex(ch.cosA)}$.`,
          `По {{t:teorema-kosinusov|теореме косинусов}} в треугольнике $ABL$: $BL^2=AB^2+AL^2-2\\cdot AB\\cdot AL\\cos A=${ratTex(ch.BL2)}$.`,
          `$R=\\dfrac{BL}{2}=\\dfrac12\\sqrt{${ratTex(ch.BL2)}}=${otvT}$. Ответ: $${otvT}$.`,
        ],
      },
    ],
    razbor: [
      { slovo: 'а) Угол между стороной и высотой', formula: '\\angle ABH=90^\\circ-\\angle A' },
      {
        slovo: 'а) Угол между стороной и биссектрисой',
        formula: '\\angle ABL=90^\\circ-\\frac{\\angle A+\\angle C}{2}',
      },
      { slovo: 'б) $\\angle BHL=90^\\circ$: $R=\\frac{BL}{2}$', formula: `AL=${ratTex(ch.AL)}` },
      { slovo: 'б) $BL$ по теореме косинусов', formula: `BL^2=${ratTex(ch.BL2)}` },
      { slovo: 'Ответ', formula: otvT },
    ],
    kontrol: { otvet: ch.R, AL: toNumber(ch.AL) },
  };
}

export const K18_VYSOTA_BISS: Shablon2<PK18> = {
  no: 18,
  prototip:
    'Высота и биссектриса из одной вершины: угол между ними — полуразность углов; радиус окружности около треугольника BHL',
  sobrat,
};
