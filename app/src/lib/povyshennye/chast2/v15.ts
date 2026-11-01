/**
 * №15 (варианты 3–4): правильная треугольная призма ABCA₁B₁C₁, M — середина AB.
 * а) CM ⊥ (ABB₁): CM ⊥ AB (медиана равностороннего треугольника) и CM ⊥ AA₁.
 * б) Угол между C₁M и плоскостью ABB₁: проекция C₁ — середина M₁ ребра A₁B₁,
 *    tg φ = C₁M₁ / MM₁ = (a√3/2) / h.
 */

import { chertezhSvg, postroit, sVidom, vybratVid, type Scenariy } from '@/lib/chertezh3';
import { div, mul, rat, ratTex, toNumber } from '@/lib/zadanie15/core/rational';
import { sqrtRat, surdTex } from '@/lib/zadanie15/core/surd';
import type { Chast2Zadacha, Shablon2 } from './types';

export interface PV15 {
  /** AB² и AA₁². */
  a2: number;
  h2: number;
}

export function chislaV15(p: PV15) {
  if (!(p.a2 > 0 && p.h2 > 0)) throw new Error('v15: данные');
  if (3 * p.a2 === 4 * p.h2) throw new Error('v15: угол 45°');
  const cm2 = div(mul(rat(3), rat(p.a2)), rat(4));
  const tg2 = div(cm2, rat(p.h2));
  return { cm2, tg2, ugol: Math.atan(Math.sqrt(toNumber(tg2))) };
}

function scenariy(p: PV15, punkt: 'a' | 'b'): Scenariy {
  const sc: Scenariy = {
    id: `PV-V15-${punkt}`,
    alt:
      punkt === 'a'
        ? 'Правильная треугольная призма и медиана основания'
        : 'Правильная треугольная призма, наклонная C1M и её проекция на грань',
    telo: { vid: 'prizma', n: 3, a: Math.sqrt(p.a2), h: Math.sqrt(p.h2) },
    imena: ['A', 'B', 'C', 'A1', 'B1', 'C1'],
    tochki: [
      { imya: 'M', gde: { seredina: ['A', 'B'] }, rol: 'uslovie' },
      ...(punkt === 'b'
        ? [{ imya: 'M1', gde: { seredina: ['A1', 'B1'] as const }, rol: 'vspom' as const }]
        : []),
    ],
    elementy:
      punkt === 'a'
        ? [
            { id: 'cm', vid: 'mediana', tochki: ['C', 'M'], rol: 'uslovie' },
            { id: 'pu', vid: 'pryamoy-ugol', tochki: ['C', 'M', 'B'] },
          ]
        : [
            { id: 'c1m', vid: 'otrezok', tochki: ['C1', 'M'], rol: 'uslovie' },
            { id: 'c1m1', vid: 'otrezok', tochki: ['C1', 'M1'] },
            { id: 'mm1', vid: 'otrezok', tochki: ['M', 'M1'] },
            { id: 'phi', vid: 'ugol', tochki: ['C1', 'M', 'M1'] },
          ],
  };
  if (punkt === 'b') {
    const s = scenariy(p, 'a');
    return { ...sc, rakurs: s.rakurs, szhatie: s.szhatie };
  }
  return sVidom(sc, vybratVid(postroit(sc)));
}

export function scenariyV15(p: PV15, punkt: 'a' | 'b'): Scenariy {
  return scenariy(p, punkt);
}

const chertezh = (p: PV15, punkt: 'a' | 'b') =>
  chertezhSvg(scenariy(p, punkt), { rezhim: 'uchitel', shirina: 300, klass: 'ch3-svg' });

function sobrat(p: PV15): Chast2Zadacha {
  const ch = chislaV15(p);
  const aT = surdTex(sqrtRat(rat(p.a2)));
  const hT = surdTex(sqrtRat(rat(p.h2)));
  const tgT = surdTex(sqrtRat(ch.tg2));
  const otvT = `\\operatorname{arctg}${tgT}`;
  return {
    no: 15,
    shablon: 'v15.prizmaMediana',
    uslovie:
      `В правильной треугольной призме $ABCA_1B_1C_1$ сторона основания равна $${aT}$, боковое ребро равно $${hT}$. Точка $M$ — середина ребра $AB$.\n` +
      `а) Докажите, что прямая $CM$ перпендикулярна плоскости $ABB_1$.\n` +
      `б) Найдите угол между прямой $C_1M$ и плоскостью $ABB_1$.`,
    risunok: null,
    punkty: [
      { bukva: 'а', pole: null },
      {
        bukva: 'б',
        podpis: 'Угол',
        pole: { vid: 'chislo', verno: otvT.replace(/\\dfrac/g, '\\frac') },
      },
    ],
    otvet: `б) $${otvT}$`,
    reshenie: [
      {
        title: 'а) Две перпендикулярные прямые',
        risunok: chertezh(p, 'a'),
        lines: [
          `Треугольник $ABC$ равносторонний, его медиана $CM$ является высотой ({{t:ravnobedr-vysota|медиана равнобедренного треугольника}}): $CM\\perp AB$. Боковое ребро $AA_1$ перпендикулярно плоскости основания, поэтому $CM\\perp AA_1$.`,
          `Прямые $AB$ и $AA_1$ пересекаются и лежат в плоскости $ABB_1$, значит, $CM\\perp(ABB_1)$ ({{t:priznak-perp-ploskosti|признак перпендикулярности прямой и плоскости}}).`,
        ],
      },
      {
        title: 'б) Проекция наклонной',
        risunok: chertezh(p, 'b'),
        lines: [
          `Пусть $M_1$ — середина $A_1B_1$. Прямая $C_1M_1$ параллельна $CM$, поэтому тоже перпендикулярна плоскости $ABB_1$ ({{t:perp-parallel|параллельные прямые и перпендикуляр к плоскости}}), $MM_1$ — проекция наклонной $C_1M$ на плоскость $ABB_1$ ({{t:naklonnye-proekcii|наклонная и проекция}}), и искомый угол — $\\angle C_1MM_1$ ({{t:ugol-pryamoy-ploskost|угол между прямой и плоскостью}}).`,
          `$C_1M_1=\\dfrac{\\sqrt3}{2}\\cdot${aT}$, $C_1M_1^2=${ratTex(ch.cm2)}$; $MM_1=AA_1=${hT}$.`,
          `$\\operatorname{tg}\\angle C_1MM_1=\\dfrac{C_1M_1}{MM_1}=${tgT}$. Ответ: $${otvT}$.`,
        ],
      },
      { title: 'Ответ', lines: [`Ответ: $${otvT}$.`] },
    ],
    razbor: [
      { slovo: 'а) $CM\\perp AB$ и $CM\\perp AA_1$', formula: 'CM\\perp(ABB_1)' },
      { slovo: 'б) Проекция $C_1M$ — отрезок $MM_1$', formula: '\\angle C_1MM_1' },
      { slovo: 'Тангенс угла', formula: `\\frac{C_1M_1}{MM_1}=${tgT}` },
      { slovo: 'Ответ', formula: otvT },
    ],
    kontrol: { otvet: ch.ugol, tg2: toNumber(ch.tg2) },
  };
}

export const V15_PRIZMA_MEDIANA: Shablon2<PV15> = {
  no: 15,
  prototip:
    'Правильная треугольная призма: медиана основания перпендикулярна боковой грани, угол наклонной с гранью',
  sobrat,
};
