/**
 * №15 (варианты 17–18): правильная треугольная призма ABCA₁B₁C₁,
 * AA₁ = λ·AB; плоскость α проходит через A₁C₁ перпендикулярно (ACB₁).
 *
 * а) M, M₁ — середины AC, A₁C₁; AC ⊥ (BB₁M₁M). Обе плоскости содержат
 *    прямые, параллельные AC, поэтому их угол — угол между следами в
 *    сечении BB₁M₁M: α — прямая через M₁, перпендикулярная MB₁.
 *    В прямоугольнике MBB₁M₁ (MB = m = a√3/2, MM₁ = h): B₁T = m²/h,
 *    B₁T : TB = m² : (h² − m²) = 3 : (4λ² − 3).
 * б) Нормаль α: n = (0; −√3/2; −λ) при AB = 1 (A(0;0;0), C(1;0;0),
 *    B(1/2; √3/2; 0)). Угол с плоскостью BCC₁ (или ABB₁, ACC₁, ABC) —
 *    через нормали, cos² — рациональное.
 */

import { chertezhSvg, postroit, sVidom, vybratVid, type Scenariy } from '@/lib/chertezh3';
import { add, div, mul, rat, ratTex, sub, toNumber, type Rat } from '@/lib/zadanie15/core/rational';
import { sqrtRat, surdTex, surdToNumber } from '@/lib/zadanie15/core/surd';
import type { Chast2Zadacha, Shablon2 } from './types';

type Dr = readonly [number, number];

export interface PJ15 {
  /** λ = AA₁ : AB. */
  lam: Dr;
  /** б) с какой плоскостью угол. */
  pl: 'BCC1' | 'ABB1' | 'ACC1' | 'ABC';
}

const PL_TEX: Record<PJ15['pl'], string> = {
  BCC1: 'BCC_1',
  ABB1: 'ABB_1',
  ACC1: 'ACC_1',
  ABC: 'ABC',
};

export function chislaJ15(p: PJ15) {
  const lam = rat(p.lam[0], p.lam[1]);
  const l2 = mul(lam, lam);
  const q = mul(rat(4), l2); // 4λ²
  if (!(toNumber(l2) > 3 / 4)) throw new Error('j15: λ мало');
  /* B₁T : TB = 3 : (4λ² − 3). */
  const r2 = sub(q, rat(3));
  const nn = add(q, rat(3)); // 4λ² + 3
  const cos2: Rat =
    p.pl === 'BCC1' || p.pl === 'ABB1'
      ? div(rat(3), mul(rat(4), nn))
      : p.pl === 'ACC1'
        ? div(rat(3), nn)
        : div(q, nn);
  const tB = div(r2, add(r2, rat(3))); // TB / BB₁
  return { lam, l2, q, r2, nn, cos2, tB };
}

function otnoshenie(a: Rat, b: Rat): [string, string] {
  /* a : b в целых. */
  const L = a.d * b.d;
  let x = (a.n * L) / a.d;
  let y = (b.n * L) / b.d;
  const g = (u: bigint, v: bigint): bigint => (v === 0n ? u : g(v, u % v));
  const d = g(x < 0n ? -x : x, y < 0n ? -y : y);
  x /= d;
  y /= d;
  return [`${x}`, `${y}`];
}

function scenariy(p: PJ15, punkt: 'a' | 'b'): Scenariy {
  const c = chislaJ15(p);
  const a = 4;
  const h = a * toNumber(c.lam);
  const sc: Scenariy = {
    id: `PV-J15-${punkt}`,
    alt:
      punkt === 'a'
        ? 'Правильная треугольная призма, плоскость через A1C1, сечение BB1M1M'
        : 'Правильная треугольная призма, плоскость alpha и грань',
    telo: { vid: 'prizma', n: 3, a, h },
    imena: ['A', 'B', 'C', 'A1', 'B1', 'C1'],
    tochki: [
      { imya: 'T', gde: { naOtrezke: ['B', 'B1', toNumber(c.tB)] }, rol: 'uslovie' },
      { imya: 'M', gde: { seredina: ['A', 'C'] } },
      { imya: 'M1', gde: { seredina: ['A1', 'C1'] } },
    ],
    elementy:
      punkt === 'a'
        ? [
            { id: 'alfa', vid: 'ploskost', tochki: ['A1', 'C1', 'T'], rol: 'uslovie' },
            { id: 'acb1', vid: 'treugolnik', tochki: ['A', 'C', 'B1'] },
            { id: 'mb1', vid: 'otrezok', tochki: ['M', 'B1'] },
            { id: 'm1t', vid: 'otrezok', tochki: ['M1', 'T'] },
            { id: 'mm1', vid: 'otrezok', tochki: ['M', 'M1'] },
            { id: 'bm', vid: 'otrezok', tochki: ['B', 'M'] },
          ]
        : [{ id: 'alfa', vid: 'ploskost', tochki: ['A1', 'C1', 'T'], rol: 'uslovie' }],
  };
  if (punkt === 'b') {
    const s = scenariy(p, 'a');
    return { ...sc, rakurs: s.rakurs, szhatie: s.szhatie };
  }
  return sVidom(sc, vybratVid(postroit(sc)));
}

export function scenariyJ15(p: PJ15, punkt: 'a' | 'b'): Scenariy {
  return scenariy(p, punkt);
}

function chertezh(p: PJ15, punkt: 'a' | 'b'): string {
  return chertezhSvg(scenariy(p, punkt), { rezhim: 'uchitel', shirina: 300, klass: 'ch3-svg' });
}

function lamText(l: Rat): string {
  let d = l.d;
  while (d % 2n === 0n) d /= 2n;
  while (d % 5n === 0n) d /= 5n;
  return d === 1n ? String(toNumber(l)).replace('.', '{,}') : ratTex(l);
}

const NORMAL: Record<PJ15['pl'], { v: string; dot: string; dl: string }> = {
  BCC1: {
    v: '\\left(-\\frac{\\sqrt3}{2};\\,-\\frac12;\\,0\\right)',
    dot: '\\frac{\\sqrt3}{4}',
    dl: '1',
  },
  ABB1: {
    v: '\\left(\\frac{\\sqrt3}{2};\\,-\\frac12;\\,0\\right)',
    dot: '\\frac{\\sqrt3}{4}',
    dl: '1',
  },
  ACC1: { v: '(0;\\,1;\\,0)', dot: '-\\frac{\\sqrt3}{2}', dl: '1' },
  ABC: { v: '(0;\\,0;\\,1)', dot: '-\\lambda', dl: '1' },
};

function sobrat(p: PJ15): Chast2Zadacha {
  const c = chislaJ15(p);
  const lT = lamText(c.lam);
  const [x, y] = otnoshenie(rat(3), c.r2);
  const cos = sqrtRat(c.cos2);
  const otv = `\\arccos ${surdTex(cos)}`;
  const kratno =
    toNumber(c.lam) === Math.round(toNumber(c.lam)) ? `в $${lT}$ раза` : `в $${lT}$ раза`;
  const uslovie =
    `В правильной треугольной призме $ABCA_1B_1C_1$ высота $AA_1$ ${kratno} больше стороны $AB$ основания $ABC$. Через прямую $A_1C_1$ перпендикулярно плоскости $ACB_1$ провели плоскость $\\alpha$.\n` +
    `а) Докажите, что плоскость $\\alpha$ делит ребро $BB_1$ в отношении $${x}:${y}$, считая от вершины $B_1$.\n` +
    `б) Найдите угол между плоскостями $${PL_TEX[p.pl]}$ и $\\alpha$.`;
  const N = NORMAL[p.pl];
  return {
    no: 15,
    shablon: 'j15.prizmaPerp',
    uslovie,
    risunok: null,
    punkty: [
      { bukva: 'а', pole: null },
      {
        bukva: 'б',
        podpis: 'Угол',
        pole: { vid: 'chislo', verno: otv.replace(/\\dfrac/g, '\\frac') },
      },
    ],
    otvet: `б) $${otv}$`,
    reshenie: [
      {
        title: 'а) Сечение, перпендикулярное $AC$',
        risunok: chertezh(p, 'a'),
        lines: [
          `Пусть $AB=a$, $h=AA_1=${lT}a$; $M$ и $M_1$ — середины $AC$ и $A_1C_1$. В равностороннем треугольнике {{t:ravnobedr-vysota|медиана $BM$ — высота}}: $BM\\perp AC$, и $MM_1\\perp AC$. По {{t:priznak-perp-ploskosti|признаку перпендикулярности}} $AC\\perp(BB_1M_1M)$.`,
          `Плоскости $ACB_1$ и $\\alpha$ содержат прямые $AC$ и $A_1C_1$, параллельные друг другу, поэтому их общая прямая параллельна $AC$ и перпендикулярна плоскости $BB_1M_1M$. Угол между $ACB_1$ и $\\alpha$ — {{t:ugol-mezhdu-ploskostyami|линейный угол}} между их следами $MB_1$ и $M_1T$ ($T=\\alpha\\cap BB_1$). Значит, $M_1T\\perp MB_1$.`,
        ],
      },
      {
        title: 'а) Отношение',
        lines: [
          `В прямоугольнике $MBB_1M_1$: $MB=m=\\dfrac{a\\sqrt3}{2}$, $BB_1=h$. Прямоугольные треугольники $M_1B_1T$ и $B_1BM$ {{t:podobie-uu|подобны}} (стороны взаимно перпендикулярны): $\\dfrac{B_1T}{M_1B_1}=\\dfrac{BM}{BB_1}$, $B_1T=\\dfrac{m^2}{h}$.`,
          `$\\dfrac{B_1T}{TB}=\\dfrac{m^2}{h^2-m^2}=\\dfrac{3a^2/4}{h^2-3a^2/4}=\\dfrac{3}{4\\lambda^2-3}=\\dfrac{3}{${ratTex(c.r2)}}$, то есть $B_1T:TB=${x}:${y}$.`,
        ],
      },
      {
        title: 'б) Нормали',
        risunok: chertezh(p, 'b'),
        lines: [
          `Пусть $AB=1$, $\\lambda=${lT}$: $A(0;0;0)$, $C(1;0;0)$, $B\\left(\\frac12;\\frac{\\sqrt3}{2};0\\right)$, $A_1(0;0;\\lambda)$, $C_1(1;0;\\lambda)$. Плоскость $\\alpha$ содержит $A_1C_1\\parallel(1;0;0)$ и нормаль плоскости $ACB_1$, поэтому её нормаль $\\vec n=\\left(0;\\,-\\frac{\\sqrt3}{2};\\,-\\lambda\\right)$, $|\\vec n|^2=\\frac34+\\lambda^2$.`,
          `Нормаль плоскости $${PL_TEX[p.pl]}$: $\\vec m=${N.v}$, $|\\vec m|=${N.dl}$; $\\vec n\\cdot\\vec m=${N.dot}$.`,
        ],
      },
      {
        title: 'б) Угол',
        lines: [
          `{{t:ugol-mezhdu-ploskostyami|Угол между плоскостями}} равен углу между нормалями (острому): $\\cos^2\\varphi=\\dfrac{(\\vec n\\cdot\\vec m)^2}{|\\vec n|^2|\\vec m|^2}=${ratTex(c.cos2)}$ при $\\lambda^2=${ratTex(c.l2)}$, $\\cos\\varphi=${surdTex(cos)}$.`,
          `Ответ: $${otv}$.`,
        ],
      },
    ],
    razbor: [
      { slovo: 'а) Сечение, перпендикулярное ребру $AC$', formula: 'M_1T\\perp MB_1' },
      { slovo: 'а) Подобие в прямоугольнике', formula: `B_1T:TB=${x}:${y}` },
      {
        slovo: 'б) Нормали плоскостей',
        formula: `\\vec n=\\left(0;\\,-\\frac{\\sqrt3}{2};\\,-\\lambda\\right)`,
      },
      { slovo: 'б) Ответ', formula: otv },
    ],
    kontrol: { tB: toNumber(c.tB), cos: surdToNumber(cos), ugol: Math.acos(surdToNumber(cos)) },
  };
}

export const J15_PRIZMA_PERP: Shablon2<PJ15> = {
  no: 15,
  prototip:
    'Правильная треугольная призма: плоскость через A₁C₁, перпендикулярная ACB₁; отношение на ребре и угол между плоскостями',
  sobrat,
};
