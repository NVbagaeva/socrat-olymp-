/**
 * №18 (варианты 7–8): параллелограмм ABCD, O — точка пересечения
 * диагоналей, L — точка пересечения биссектрис углов A и D.
 *
 * ∠ALD = 90°, медиана ML (M — середина AD) равна AD/2, отсюда ML ∥ AB,
 * и L лежит на средней линии MO треугольника ABD: OL = |AB − AD|/2.
 * б) S(DOL) = ½·OL·½·AD·sin A, cos(A/2) = AL/AD.
 */

import { renderPlan } from '@/lib/planimetriya/render';
import type { Element, Scena } from '@/lib/planimetriya/types';
import { div, mul, rat, sub, toNumber } from '@/lib/zadanie15/core/rational';
import { sqrtRat } from '@/lib/zadanie15/core/surd';
import { tochnoTex } from './chisla';
import { ratTex } from './tex';
import type { Chast2Zadacha, Shablon2 } from './types';

export interface PD18 {
  AB: number;
  AD: number;
  AL: number;
  /** Площадь какого треугольника: DOL (как в образце) или AOL. */
  tr: 'DOL' | 'AOL';
}

export function chislaD18(p: PD18) {
  const c = rat(p.AL, p.AD);
  const s2 = sub(rat(1), mul(c, c));
  const s = sqrtRat(s2);
  if (s.m !== 1n) throw new Error('d18: sin(A/2) не рационален');
  const sinA = mul(rat(2), mul(s.k, c));
  const OL = rat(Math.abs(p.AB - p.AD), 2);
  const visota = div(mul(rat(p.AD), sinA), rat(2));
  const S = div(mul(OL, visota), rat(2));
  return { c, s: s.k, sinA, OL, visota, S };
}

function chertezh(p: PD18, punkt: 'a' | 'b'): string {
  const c = chislaD18(p);
  const A2 = 2 * Math.acos(toNumber(c.c));
  const A: [number, number] = [0, 0];
  const D: [number, number] = [p.AD, 0];
  const B: [number, number] = [p.AB * Math.cos(A2), p.AB * Math.sin(A2)];
  const C: [number, number] = [B[0] + p.AD, B[1]];
  const half = A2 / 2;
  const L: [number, number] = [p.AL * Math.cos(half), p.AL * Math.sin(half)];
  const tochki: Scena['tochki'] = {
    A,
    B,
    C,
    D,
    O: [(B[0] + D[0]) / 2, (B[1] + D[1]) / 2],
    L,
    M: [p.AD / 2, 0],
  };
  const el: Element[] = [
    { tip: 'mnogougolnik', tochki: ['A', 'B', 'C', 'D'] },
    { tip: 'otrezok', a: 'A', b: 'C' },
    { tip: 'otrezok', a: 'B', b: 'D' },
    { tip: 'otrezok', a: 'A', b: 'L' },
    { tip: 'otrezok', a: 'D', b: 'L' },
    { tip: 'ugol', a: 'B', v: 'A', b: 'L', dugi: 1 },
    { tip: 'ugol', a: 'L', v: 'A', b: 'D', dugi: 1 },
    { tip: 'tochka', t: 'O' },
    { tip: 'tochka', t: 'L' },
  ];
  if (punkt === 'a') {
    el.push({ tip: 'tochka', t: 'M', sloy: 'reshenie' });
    el.push({ tip: 'pryamaya', a: 'M', b: 'O', zaA: 0.15, zaB: 0.3, sloy: 'reshenie' });
    el.push({ tip: 'otrezok', a: 'M', b: 'L', stil: 'punktir', sloy: 'reshenie' });
    el.push({ tip: 'ugol', a: 'A', v: 'L', b: 'D', pryamoy: true, sloy: 'reshenie' });
  } else {
    el.push({ tip: 'oblast', tochki: [p.tr[0]!, 'O', 'L'], sloy: 'reshenie' });
  }
  return renderPlan(
    {
      tochki,
      elementy: el,
      podpisi: punkt === 'a' ? ['A', 'B', 'C', 'D', 'O', 'L', 'M'] : ['A', 'B', 'C', 'D', 'O', 'L'],
    },
    {
      rezhim: { rezhim: 'uchitel' },
      shirina: 300,
      vysota: 200,
      alt: 'Параллелограмм ABCD, биссектрисы углов A и D пересекаются в точке L',
    },
  );
}

function sobrat(p: PD18): Chast2Zadacha {
  const c = chislaD18(p);
  if (p.AB === p.AD || p.AL >= p.AD) throw new Error('d18: конфигурация');
  const bolshe = p.AB > p.AD;
  const raz = bolshe ? 'AB-BC' : 'AD-AB';
  const uslovie =
    `В параллелограмме $ABCD$ диагонали пересекаются в точке $O$, а биссектрисы углов $A$ и $D$ — в точке $L$, ${bolshe ? '$AB>BC$' : '$AB<AD$'}.\n` +
    `а) Докажите, что $OL=\\dfrac{${raz}}{2}$.\n` +
    `б) Найдите площадь треугольника $${p.tr}$, если $AB=${p.AB}$, $BC=${p.AD}$, $AL=${p.AL}$.`;
  const S = tochnoTex(c.S);
  return {
    no: 18,
    shablon: 'd18.parallelogrammBiss',
    uslovie,
    risunok: null,
    punkty: [
      { bukva: 'а', pole: null },
      { bukva: 'б', podpis: 'Площадь', pole: { vid: 'chislo', verno: String(toNumber(c.S)) } },
    ],
    otvet: `б) $${S}$`,
    reshenie: [
      {
        title: 'а) Угол ALD прямой',
        risunok: chertezh(p, 'a'),
        lines: [
          `$AB\\parallel CD$, поэтому $\\angle A+\\angle D=180^\\circ$ (односторонние углы — {{t:nakrest-ugly|следствие равенства накрест лежащих углов}}). Половины этих углов в сумме дают $90^\\circ$, значит, в треугольнике $ALD$ угол $L$ прямой.`,
          `Пусть $M$ — середина $AD$. {{t:mediana-gipotenuza|Медиана к гипотенузе равна её половине}}: $ML=MA=\\dfrac{AD}{2}$.`,
        ],
      },
      {
        title: 'а) Точка L на средней линии',
        lines: [
          `В равнобедренном треугольнике $AML$: $\\angle MLA=\\angle MAL=\\angle LAB$. Это накрест лежащие углы при прямых $ML$, $AB$ и секущей $AL$, поэтому {{t:priznak-par-pryamyh|$ML\\parallel AB$}}.`,
          `$MO$ — {{t:srednyaya-liniya-treugolnika|средняя линия треугольника}} $ABD$: $MO\\parallel AB$, $MO=\\dfrac{AB}{2}$. Через $M$ проходит одна прямая, параллельная $AB$, значит, $L$ лежит на прямой $MO$, причём по ту же сторону от $M$, что и $O$.`,
          `Поэтому $OL=|MO-ML|=\\dfrac{|AB-AD|}{2}=\\dfrac{${raz}}{2}$ (${bolshe ? '$ML<MO$, $L$ лежит между $M$ и $O$' : '$ML>MO$, $L$ лежит за точкой $O$'}).`,
        ],
      },
      {
        title: 'б) Угол A',
        risunok: chertezh(p, 'b'),
        lines: [
          `В прямоугольном треугольнике $ALD$: $\\cos\\dfrac{\\angle A}{2}=\\dfrac{AL}{AD}=${ratTex(c.c)}$, по {{t:pifagor|теореме Пифагора}} $\\sin\\dfrac{\\angle A}{2}=${ratTex(c.s)}$.`,
          `$\\sin\\angle A=2\\sin\\dfrac{\\angle A}{2}\\cos\\dfrac{\\angle A}{2}=${ratTex(c.sinA)}$.`,
        ],
      },
      {
        title: 'б) Площадь',
        lines: [
          `$OL=\\dfrac{|${p.AB}-${p.AD}|}{2}=${ratTex(c.OL)}$. Прямая $MO$ параллельна $AB$ и проходит через середину $AD$, поэтому расстояние от точки $${p.tr[0]}$ до неё — половина расстояния от $D$ до $AB$: $\\dfrac{AD\\sin\\angle A}{2}=${ratTex(c.visota)}$.`,
          `{{t:ploshchad-treugolnika|Площадь треугольника}} $${p.tr}$: $S=\\dfrac12\\cdot OL\\cdot${ratTex(c.visota)}=${S}$.`,
        ],
      },
    ],
    razbor: [
      { slovo: 'а) Биссектрисы соседних углов перпендикулярны', formula: '\\angle ALD=90^\\circ' },
      { slovo: 'а) Медиана к гипотенузе и средняя линия', formula: `OL=\\dfrac{${raz}}{2}` },
      {
        slovo: 'б) Синус угла параллелограмма через $AL$',
        formula: `\\sin\\angle A=${ratTex(c.sinA)}`,
      },
      { slovo: 'б) Площадь треугольника', formula: S },
    ],
    kontrol: { S: toNumber(c.S), OL: toNumber(c.OL) },
  };
}

export const D18_PARALLELOGRAMM: Shablon2<PD18> = {
  no: 18,
  prototip:
    'Параллелограмм, биссектрисы углов A и D: OL = |AB − AD|/2, площадь треугольника с вершиной L',
  sobrat,
};
