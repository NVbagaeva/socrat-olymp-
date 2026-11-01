/**
 * №15 (варианты 27–28): правильная призма ABCA₁B₁C₁ (AB = a, AA₁ = h),
 * D — середина AB, M на CC₁ с CM : MC₁ = m : n.
 *
 * а) CD ⊥ AB (медиана правильного треугольника), CC₁ ⊥ AB ⇒ AB ⊥ (DCC₁);
 *    плоскость ABM содержит AB ⇒ (ABM) ⊥ (DCC₁), общая прямая — DM.
 * б) Расстояние от точки плоскости DCC₁ до (ABM) — до прямой DM:
 *    ρ(C) = CD·CM/DM, ρ(C₁) = CD·C₁M/DM, CD² = 3a²/4, DM² = CD² + CM².
 */

import { chertezhSvg, postroit, sVidom, vybratVid, type Scenariy } from '@/lib/chertezh3';
import { add, div, mul, rat, ratTex, toNumber } from '@/lib/zadanie15/core/rational';
import { sqrtRat, surdTex, surdToNumber } from '@/lib/zadanie15/core/surd';
import type { Chast2Zadacha, Shablon2 } from './types';

export interface PP15 {
  /** AB². */
  a2: number;
  /** AA₁. */
  h: number;
  /** CM : MC₁ = m : n. */
  m: number;
  n: number;
  /** От какой точки расстояние. */
  ot: 'C' | 'C1';
}

export function chislaP15(p: PP15) {
  const cd2 = div(mul(rat(3), rat(p.a2)), rat(4));
  const cm = rat(p.h * p.m, p.m + p.n);
  const c1m = rat(p.h * p.n, p.m + p.n);
  const dm2 = add(cd2, mul(cm, cm));
  const otr = p.ot === 'C' ? cm : c1m;
  const d2 = div(mul(cd2, mul(otr, otr)), dm2);
  return { cd2, cm, c1m, dm2, otr, d: sqrtRat(d2) };
}

function scenariy(p: PP15, punkt: 'a' | 'b'): Scenariy {
  const t = p.m / (p.m + p.n);
  const ot = p.ot === 'C' ? 'C' : 'C1';
  const sc: Scenariy = {
    id: `PV-P15-${punkt}`,
    alt:
      punkt === 'a'
        ? 'Правильная треугольная призма, плоскость через ребро основания и точку бокового ребра'
        : 'Правильная треугольная призма и перпендикуляр из вершины к плоскости сечения',
    telo: { vid: 'prizma', n: 3, a: Math.sqrt(p.a2), h: p.h },
    imena: ['A', 'B', 'C', 'A1', 'B1', 'C1'],
    tochki: [
      { imya: 'D', gde: { seredina: ['A', 'B'] } },
      { imya: 'M', gde: { naOtrezke: ['C', 'C1', t] }, rol: 'uslovie' },
      ...(punkt === 'b' ? [{ imya: 'H', gde: { proekciya: ot, na: ['D', 'M'] } }] : []),
    ],
    elementy: [
      { id: 'abm', vid: 'treugolnik', tochki: ['A', 'B', 'M'], rol: 'uslovie' },
      { id: 'cd', vid: 'otrezok', tochki: ['C', 'D'] },
      { id: 'dm', vid: 'otrezok', tochki: ['D', 'M'] },
      ...(punkt === 'b'
        ? [
            { id: 'h', vid: 'otrezok' as const, tochki: [ot, 'H'] },
            { id: 'dh', vid: 'otrezok' as const, tochki: ['D', 'H'] },
          ]
        : []),
    ],
  };
  return sVidom(sc, vybratVid(postroit(sc)));
}

export function scenariyP15(p: PP15, punkt: 'a' | 'b'): Scenariy {
  return scenariy(p, punkt);
}

function chertezh(p: PP15, punkt: 'a' | 'b'): string {
  return chertezhSvg(scenariy(p, punkt), { rezhim: 'uchitel', shirina: 300, klass: 'ch3-svg' });
}

function sobrat(p: PP15): Chast2Zadacha {
  const ch = chislaP15(p);
  const aT = surdTex(sqrtRat(rat(p.a2)));
  const cdT = surdTex(sqrtRat(ch.cd2));
  const dmT = surdTex(sqrtRat(ch.dm2));
  const otT = ratTex(ch.otr);
  const otvT = surdTex(ch.d);
  const tochkaT = p.ot === 'C' ? 'C' : 'C_1';
  const uslovie =
    `В правильной треугольной призме $ABCA_1B_1C_1$ сторона основания равна $${aT}$, а боковое ребро $AA_1$ равно $${p.h}$. Точка $D$ — середина ребра $AB$, точка $M$ лежит на ребре $CC_1$, причём $CM:MC_1=${p.m}:${p.n}$.\n` +
    `а) Докажите, что плоскость $ABM$ перпендикулярна плоскости $CC_1D$.\n` +
    `б) Найдите расстояние от точки $${tochkaT}$ до плоскости $ABM$.`;
  const bLines =
    p.ot === 'C'
      ? `В прямоугольном треугольнике $DCM$ ($\\angle C=90^\\circ$): $CH=\\dfrac{CD\\cdot CM}{DM}$ (удвоенная {{t:ploshchad-treugolnika|площадь}} двумя способами) $=\\dfrac{${cdT}\\cdot ${otT}}{${dmT}}=${otvT}$.`
      : `Треугольник $DC_1M$: основание $C_1M=${otT}$ лежит на прямой $CC_1$, высота к нему — $CD$. Высота к стороне $DM$: $C_1H=\\dfrac{2S_{DC_1M}}{DM}=\\dfrac{C_1M\\cdot CD}{DM}$ ({{t:ploshchad-treugolnika|площадь треугольника}}) $=\\dfrac{${otT}\\cdot ${cdT}}{${dmT}}=${otvT}$.`;
  return {
    no: 15,
    shablon: 'p15.prizmaABM',
    uslovie,
    risunok: null,
    punkty: [
      { bukva: 'а', pole: null },
      {
        bukva: 'б',
        podpis: 'Расстояние',
        pole: { vid: 'chislo', verno: otvT.replace(/\\dfrac/g, '\\frac') },
      },
    ],
    otvet: `б) $${otvT}$`,
    reshenie: [
      {
        title: 'а) Прямая $AB$ и плоскость $CC_1D$',
        risunok: chertezh(p, 'a'),
        lines: [
          `Треугольник $ABC$ правильный, $CD$ — медиана, а значит, и {{t:ravnobedr-vysota|высота}}: $AB\\perp CD$.`,
          `Боковое ребро прямой призмы перпендикулярно основанию: $CC_1\\perp AB$.`,
          `$AB$ перпендикулярна двум пересекающимся прямым $CD$ и $CC_1$ плоскости $CC_1D$; по {{t:priznak-perp-ploskosti|признаку}} $AB\\perp(CC_1D)$. Плоскость $ABM$ проходит через $AB$, поэтому $(ABM)\\perp(CC_1D)$; их общая прямая — $DM$.`,
        ],
      },
      {
        title: 'б) Перпендикуляр к плоскости $ABM$',
        risunok: chertezh(p, 'b'),
        lines: [
          `Проведём в плоскости $CC_1D$ перпендикуляр $${tochkaT}H$ к прямой $DM$. Он перпендикулярен и $AB$ (так как $AB\\perp(CC_1D)$), то есть двум пересекающимся прямым плоскости $ABM$ — по {{t:priznak-perp-ploskosti|признаку}} $${tochkaT}H\\perp(ABM)$, и $${tochkaT}H$ — искомое расстояние.`,
          `$CD=\\dfrac{\\sqrt3}{2}AB=${cdT}$, $CM=${ratTex(ch.cm)}$, по {{t:pifagor|теореме Пифагора}} $DM=\\sqrt{CD^2+CM^2}=\\sqrt{${ratTex(ch.cd2)}+${ratTex(mul(ch.cm, ch.cm))}}=${dmT}$.`,
        ],
      },
      { title: 'б) Ответ', lines: [bLines, `Ответ: $${otvT}$.`] },
    ],
    razbor: [
      { slovo: 'а) $AB\\perp CD$ и $AB\\perp CC_1$', formula: 'AB\\perp(CC_1D)' },
      { slovo: 'б) Перпендикуляр к $DM$ в плоскости $CC_1D$', formula: `${tochkaT}H\\perp(ABM)` },
      { slovo: 'б) Гипотенуза $DM$', formula: `DM=${dmT}` },
      { slovo: 'б) Ответ', formula: otvT },
    ],
    kontrol: { otvet: surdToNumber(ch.d), cm: toNumber(ch.cm) },
  };
}

export const P15_PRIZMA_ABM: Shablon2<PP15> = {
  no: 15,
  prototip:
    'Правильная треугольная призма: плоскость через ребро основания и точку бокового ребра ⟂ плоскости CC₁D; расстояние от вершины до неё',
  sobrat,
};
