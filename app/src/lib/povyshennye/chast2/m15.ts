/**
 * №15 (варианты 23–24): правильная треугольная призма ABCA₁B₁C₁,
 * AB = a, точка K на ребре CC₁, CK = c (задано через CK : KC₁ и AA₁).
 *
 * а) M — середина AB. CM ⊥ AB (медиана правильного треугольника),
 *    KC ⊥ (ABC) ⇒ по теореме о трёх перпендикулярах KM ⊥ AB, поэтому
 *    ∠KMC — линейный угол двугранного угла между ABK и ABC.
 * б) «ugol»: tg∠KMC = CK/CM, CM = a√3/2. «S»: S(ABK) = ½·AB·KM.
 */

import { chertezhSvg, postroit, sVidom, vybratVid, type Scenariy } from '@/lib/chertezh3';
import { add, div, mul, rat, toNumber, type Rat } from '@/lib/zadanie15/core/rational';
import { sqrtRat, surdTex, surdToNumber } from '@/lib/zadanie15/core/surd';
import type { Chast2Zadacha, Shablon2 } from './types';

export interface PM15 {
  /** AB² (AB = √a2). */
  a2: number;
  /** AA₁² (AA₁ = √h2). */
  h2: number;
  /** CK : KC₁ = m : n. */
  m: number;
  n: number;
  nado: 'ugol' | 'S';
}

const kv = (x: Rat) => surdTex(sqrtRat(x));

export function chislaM15(p: PM15) {
  const a2 = rat(p.a2);
  const t = rat(p.m, p.m + p.n);
  const ck2 = mul(mul(t, t), rat(p.h2));
  const cm2 = div(mul(rat(3), a2), rat(4));
  const tg2 = div(ck2, cm2);
  const km2 = add(cm2, ck2);
  /* S² = ¼·a²·KM². */
  const S2 = div(mul(a2, km2), rat(4));
  return { a2, t, ck2, cm2, tg2, km2, S2 };
}

function scenariy(p: PM15, punkt: 'a' | 'b'): Scenariy {
  const c = chislaM15(p);
  const sc: Scenariy = {
    id: `PV-M15-${punkt}`,
    alt:
      punkt === 'a'
        ? 'Правильная треугольная призма, точка на боковом ребре и медиана основания'
        : 'Правильная треугольная призма, сечение через ребро основания и точку бокового ребра',
    telo: { vid: 'prizma', n: 3, a: Math.sqrt(p.a2), h: Math.sqrt(p.h2) },
    imena: ['A', 'B', 'C', 'A1', 'B1', 'C1'],
    tochki: [
      { imya: 'K', gde: { naOtrezke: ['C', 'C1', toNumber(c.t)] }, rol: 'uslovie' },
      { imya: 'M', gde: { seredina: ['A', 'B'] } },
    ],
    elementy:
      punkt === 'a'
        ? [
            { id: 'cm', vid: 'otrezok', tochki: ['C', 'M'] },
            { id: 'km', vid: 'otrezok', tochki: ['K', 'M'] },
          ]
        : [
            { id: 'sech', vid: 'mnogougolnik', tochki: ['A', 'B', 'K'], rol: 'uslovie' },
            { id: 'cm', vid: 'otrezok', tochki: ['C', 'M'] },
            { id: 'km', vid: 'otrezok', tochki: ['K', 'M'] },
          ],
  };
  if (punkt === 'b') {
    const s = scenariy(p, 'a');
    return { ...sc, rakurs: s.rakurs, szhatie: s.szhatie };
  }
  return sVidom(sc, vybratVid(postroit(sc)));
}

export function scenariyM15(p: PM15, punkt: 'a' | 'b'): Scenariy {
  return scenariy(p, punkt);
}

function chertezh(p: PM15, punkt: 'a' | 'b'): string {
  return chertezhSvg(scenariy(p, punkt), { rezhim: 'uchitel', shirina: 300, klass: 'ch3-svg' });
}

function sobrat(p: PM15): Chast2Zadacha {
  const c = chislaM15(p);
  const ugol = p.nado === 'ugol';
  const tgT = kv(c.tg2);
  const otvT = ugol ? `\\operatorname{arctg}${tgT}` : kv(c.S2);
  const otvV = ugol ? Math.atan(Math.sqrt(toNumber(c.tg2))) : surdToNumber(sqrtRat(c.S2));
  const uslovie =
    `В правильной треугольной призме $ABCA_1B_1C_1$ сторона основания равна $${kv(c.a2)}$, а боковое ребро равно $${kv(rat(p.h2))}$. На ребре $CC_1$ отмечена точка $K$ так, что $CK:KC_1=${p.m}:${p.n}$; $M$ — середина ребра $AB$.\n` +
    `а) Докажите, что угол $KMC$ равен углу между плоскостью $ABK$ и плоскостью основания призмы.\n` +
    `б) Найдите ${ugol ? 'угол между плоскостью $ABK$ и плоскостью $ABC$' : 'площадь сечения призмы плоскостью $ABK$'}.`;
  return {
    no: 15,
    shablon: 'm15.prizmaUgol',
    uslovie,
    risunok: null,
    punkty: [
      { bukva: 'а', pole: null },
      {
        bukva: 'б',
        podpis: ugol ? 'Угол' : 'Площадь',
        pole: { vid: 'chislo', verno: otvT.replace(/\\dfrac/g, '\\frac') },
      },
    ],
    otvet: `б) $${otvT}$`,
    reshenie: [
      {
        title: 'а) Две прямые, перпендикулярные $AB$',
        risunok: chertezh(p, 'a'),
        lines: [
          `Треугольник $ABC$ правильный, $CM$ — медиана, она же высота: $CM\\perp AB$ ({{t:ravnobedr-vysota|медиана равнобедренного треугольника к основанию — высота}}).`,
          `Призма прямая, поэтому $KC\\perp(ABC)$; $CM$ — проекция наклонной $KM$ на плоскость основания. По {{t:tri-perpendikulyara|теореме о трёх перпендикулярах}} $KM\\perp AB$.`,
        ],
      },
      {
        title: 'а) Линейный угол',
        lines: [
          `Плоскости $ABK$ и $ABC$ пересекаются по прямой $AB$; в них проведены перпендикуляры $KM$ и $CM$ к $AB$ из одной точки $M$. Угол $KMC$ — {{t:ugol-mezhdu-ploskostyami|линейный угол двугранного угла}}, он и есть угол между плоскостями.`,
        ],
      },
      {
        title: ugol ? 'б) Угол' : 'б) Площадь сечения',
        risunok: chertezh(p, 'b'),
        lines: ugol
          ? [
              `$CM=\\dfrac{AB\\sqrt3}{2}=${kv(c.cm2)}$ ({{t:pifagor|по теореме Пифагора}} в треугольнике $ACM$), $CK=\\dfrac{${p.m}}{${p.m + p.n}}\\cdot CC_1=${kv(c.ck2)}$.`,
              `В прямоугольном треугольнике $KCM$: $\\operatorname{tg}\\angle KMC=\\dfrac{CK}{CM}=${tgT}$. Ответ: $${otvT}$.`,
            ]
          : [
              `$CM=${kv(c.cm2)}$, $CK=${kv(c.ck2)}$; по {{t:pifagor|теореме Пифагора}} $KM=\\sqrt{CM^2+CK^2}=${kv(c.km2)}$.`,
              `Сечение — треугольник $ABK$ с высотой $KM$: $S=\\dfrac12\\cdot AB\\cdot KM=\\dfrac12\\cdot${kv(c.a2)}\\cdot${kv(c.km2)}=${otvT}$ ({{t:ploshchad-treugolnika|площадь треугольника}}).`,
            ],
      },
    ],
    razbor: [
      { slovo: 'а) $CM\\perp AB$ — медиана правильного треугольника', formula: 'CM\\perp AB' },
      { slovo: 'а) Теорема о трёх перпендикулярах', formula: 'KM\\perp AB' },
      {
        slovo: ugol ? 'б) Тангенс линейного угла' : 'б) Высота сечения',
        formula: ugol ? `\\frac{CK}{CM}=${tgT}` : `KM=${kv(c.km2)}`,
      },
      { slovo: 'Ответ', formula: otvT },
    ],
    kontrol: { otvet: otvV, ck2: toNumber(c.ck2) },
  };
}

export const M15_PRIZMA_UGOL: Shablon2<PM15> = {
  no: 15,
  prototip:
    'Правильная треугольная призма: угол между плоскостью через ребро основания и точку бокового ребра и основанием; площадь сечения',
  sobrat,
};
