/**
 * №15 (варианты 1–2): куб ABCDA₁B₁C₁D₁, точка M на ребре CC₁.
 *
 * а) Плоскость BDM перпендикулярна плоскости ACC₁: BD ⊥ AC и BD ⊥ CC₁.
 * б) Расстояние от C до плоскости BDM — высота прямоугольного
 *    треугольника OCM (O — центр ABCD): d = OC·CM / OM.
 */

import { chertezhSvg, postroit, sVidom, vybratVid, type Scenariy } from '@/lib/chertezh3';
import { add, div, mul, rat, ratTex, toNumber } from '@/lib/zadanie15/core/rational';
import { sqrtRat, surdTex, surdToNumber } from '@/lib/zadanie15/core/surd';
import type { Chast2Zadacha, Shablon2 } from './types';

export interface PU15 {
  a: number;
  /** CM : MC₁ = m : n. */
  m: number;
  n: number;
}

export function chislaU15(p: PU15) {
  if (!(p.a > 0 && p.m > 0 && p.n > 0)) throw new Error('u15: данные');
  const h = rat(p.a * p.m, p.m + p.n);
  const oc2 = rat(p.a * p.a, 2);
  const om2 = add(oc2, mul(h, h));
  const d2 = div(mul(oc2, mul(h, h)), om2);
  return { h, oc2, om2, d2, d: surdToNumber(sqrtRat(d2)) };
}

function scenariy(p: PU15, punkt: 'a' | 'b'): Scenariy {
  const t = p.m / (p.m + p.n);
  const sc: Scenariy = {
    id: `PV-U15-${punkt}`,
    alt:
      punkt === 'a'
        ? 'Куб, точка на боковом ребре, плоскость через диагональ основания и эту точку'
        : 'Куб, сечение через диагональ основания и перпендикуляр из вершины к нему',
    telo: { vid: 'kub', a: p.a },
    imena: ['A', 'B', 'C', 'D', 'A1', 'B1', 'C1', 'D1'],
    tochki: [
      { imya: 'O', gde: { centr: ['A', 'B', 'C', 'D'] }, rol: 'uslovie' },
      { imya: 'M', gde: { naOtrezke: ['C', 'C1', t] }, rol: 'uslovie' },
      ...(punkt === 'b'
        ? [{ imya: 'K', gde: { proekciya: 'C', na: ['O', 'M'] as const }, rol: 'vspom' as const }]
        : []),
    ],
    elementy:
      punkt === 'a'
        ? [
            { id: 'bd', vid: 'diagonal', tochki: ['B', 'D'], rol: 'uslovie' },
            { id: 'ac', vid: 'diagonal', tochki: ['A', 'C'] },
            { id: 'sech', vid: 'mnogougolnik', tochki: ['B', 'M', 'D'], rol: 'uslovie' },
          ]
        : [
            { id: 'sech', vid: 'mnogougolnik', tochki: ['B', 'M', 'D'], rol: 'uslovie' },
            { id: 'ac', vid: 'diagonal', tochki: ['A', 'C'] },
            { id: 'om', vid: 'otrezok', tochki: ['O', 'M'] },
            { id: 'ck', vid: 'otrezok', tochki: ['C', 'K'] },
            { id: 'pu', vid: 'pryamoy-ugol', tochki: ['C', 'K', 'O'] },
          ],
  };
  if (punkt === 'b') {
    const s = scenariy(p, 'a');
    return { ...sc, rakurs: s.rakurs, szhatie: s.szhatie };
  }
  return sVidom(sc, vybratVid(postroit(sc)));
}

export function scenariyU15(p: PU15, punkt: 'a' | 'b'): Scenariy {
  return scenariy(p, punkt);
}

const chertezh = (p: PU15, punkt: 'a' | 'b') =>
  chertezhSvg(scenariy(p, punkt), { rezhim: 'uchitel', shirina: 300, klass: 'ch3-svg' });

function sobrat(p: PU15): Chast2Zadacha {
  const ch = chislaU15(p);
  const dT = surdTex(sqrtRat(ch.d2));
  const hT = ratTex(ch.h);
  const ocT = surdTex(sqrtRat(ch.oc2));
  const omT = surdTex(sqrtRat(ch.om2));
  return {
    no: 15,
    shablon: 'u15.kubPlosk',
    uslovie:
      `Дан куб $ABCDA_1B_1C_1D_1$ с ребром $${p.a}$. На ребре $CC_1$ взята точка $M$ так, что $CM:MC_1=${p.m}:${p.n}$.\n` +
      `а) Докажите, что плоскость $BDM$ перпендикулярна плоскости $ACC_1$.\n` +
      `б) Найдите расстояние от точки $C$ до плоскости $BDM$.`,
    risunok: null,
    punkty: [
      { bukva: 'а', pole: null },
      {
        bukva: 'б',
        podpis: 'Расстояние',
        pole: { vid: 'chislo', verno: dT.replace(/\\dfrac/g, '\\frac') },
      },
    ],
    otvet: `б) $${dT}$`,
    reshenie: [
      {
        title: 'а) Прямая $BD$ перпендикулярна плоскости $ACC_1$',
        risunok: chertezh(p, 'a'),
        lines: [
          `Диагонали квадрата $ABCD$ перпендикулярны ({{t:romb-diagonali|диагонали ромба и квадрата}}): $BD\\perp AC$. Ребро $CC_1$ перпендикулярно плоскости основания, поэтому $BD\\perp CC_1$.`,
          `Прямая $BD$ перпендикулярна двум пересекающимся прямым $AC$ и $CC_1$ плоскости $ACC_1$, значит, $BD\\perp(ACC_1)$ ({{t:priznak-perp-ploskosti|признак перпендикулярности прямой и плоскости}}). Плоскость $BDM$ проходит через $BD$, поэтому $(BDM)\\perp(ACC_1)$ (плоскость, проходящая через перпендикуляр к другой плоскости, перпендикулярна ей).`,
        ],
      },
      {
        title: 'б) Перпендикуляр из $C$',
        risunok: chertezh(p, 'b'),
        lines: [
          `Плоскости $BDM$ и $ACC_1$ перпендикулярны и пересекаются по прямой $OM$, где $O$ — центр квадрата. Перпендикуляр $CK$ к $OM$ в плоскости $ACC_1$ — перпендикуляр к плоскости $BDM$, и искомое расстояние равно $CK$ ({{t:rasst-do-ploskosti|расстояние от точки до плоскости}}).`,
          `$CM=${p.a}\\cdot\\dfrac{${p.m}}{${p.m + p.n}}=${hT}$, $OC=\\dfrac{${p.a}\\sqrt2}{2}=${ocT}$. По {{t:pifagor|теореме Пифагора}} в прямоугольном треугольнике $OCM$: $OM=\\sqrt{OC^2+CM^2}=${omT}$.`,
          `Площадь треугольника $OCM$ равна $\\dfrac12 OC\\cdot CM=\\dfrac12 OM\\cdot CK$ ({{t:ploshchad-treugolnika|площадь треугольника}}), откуда $CK=\\dfrac{OC\\cdot CM}{OM}$, $CK^2=\\dfrac{OC^2\\cdot CM^2}{OM^2}=${ratTex(ch.d2)}$, $CK=${dT}$. Ответ: $${dT}$.`,
        ],
      },
      { title: 'Ответ', lines: [`Ответ: $${dT}$.`] },
    ],
    razbor: [
      { slovo: 'а) $BD\\perp AC$ и $BD\\perp CC_1$', formula: 'BD\\perp(ACC_1)' },
      { slovo: 'б) Расстояние — высота треугольника $OCM$', formula: 'CK=\\frac{OC\\cdot CM}{OM}' },
      { slovo: 'Катеты', formula: `OC=${ocT},\\ CM=${hT}` },
      { slovo: 'Ответ', formula: dT },
    ],
    kontrol: { otvet: ch.d, h: toNumber(ch.h) },
  };
}

export const U15_KUB_PLOSK: Shablon2<PU15> = {
  no: 15,
  prototip:
    'Куб, точка на боковом ребре: перпендикулярность плоскостей и расстояние от вершины до плоскости сечения',
  sobrat,
};
