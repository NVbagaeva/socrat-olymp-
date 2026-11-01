/**
 * №15 (варианты 19–20): правильная четырёхугольная пирамида SABCD,
 * AB = a, SO = h, точка M на SC: SM : MC = m : n, h² = a²m/(2n).
 *
 * а) BD ⊥ AC, BD ⊥ SO ⇒ BD ⊥ (SAC) ⇒ BD ⊥ SC. В треугольнике SOC
 *    SC² = h² + a²/2 = a²(m+n)/(2n), CM·CS = SC²·n/(m+n) = a²/2 = OC²:
 *    треугольники OCM и SCO подобны, ∠OMC = 90°. Две пересекающиеся
 *    прямые плоскости BMD перпендикулярны SC.
 * б) «ugol»: линейный угол — ∠MOC = ∠OSC, tg = OC/SO = √(n/m).
 *    «S»: S(BMD) = ½·BD·OM, OM = OC·SO/SC.
 */

import { chertezhSvg, postroit, sVidom, vybratVid, type Scenariy } from '@/lib/chertezh3';
import { div, mul, rat, ratTex, toNumber, type Rat } from '@/lib/zadanie15/core/rational';
import { sqrtRat, surdTex, surdToNumber } from '@/lib/zadanie15/core/surd';
import type { Chast2Zadacha, Shablon2 } from './types';

export interface PK15 {
  /** AB² (AB = √a2). */
  a2: number;
  /** SM : MC = m : n. */
  m: number;
  n: number;
  nado: 'ugol' | 'S';
}

const kv = (x: Rat) => surdTex(sqrtRat(x));

export function chislaK15(p: PK15) {
  if (!(p.m > 0 && p.n > 0)) throw new Error('k15: отношение');
  const a2 = rat(p.a2);
  const h2 = div(mul(a2, rat(p.m)), rat(2 * p.n));
  const oc2 = div(a2, rat(2));
  const sc2 = div(mul(a2, rat(p.m + p.n)), rat(2 * p.n));
  /* OM² = OC²·SO²/SC², BD² = 2a², S² = ¼·BD²·OM². */
  const om2 = div(mul(oc2, h2), sc2);
  const S2 = div(mul(mul(rat(2), a2), om2), rat(4));
  const tg2 = rat(p.n, p.m);
  return { a2, h2, oc2, sc2, om2, S2, tg2 };
}

function scenariy(p: PK15, punkt: 'a' | 'b'): Scenariy {
  const c = chislaK15(p);
  const a = Math.sqrt(p.a2);
  const h = Math.sqrt(toNumber(c.h2));
  const t = p.m / (p.m + p.n);
  const sc: Scenariy = {
    id: `PV-K15-${punkt}`,
    alt:
      punkt === 'a'
        ? 'Правильная четырёхугольная пирамида, точка на боковом ребре, плоскость через диагональ основания'
        : 'Правильная четырёхугольная пирамида, сечение через диагональ основания и линейный угол',
    telo: { vid: 'piramida', n: 4, a, h },
    imena: ['A', 'B', 'C', 'D', 'S'],
    tochki: [
      { imya: 'O', gde: { centr: ['A', 'B', 'C', 'D'] }, rol: 'uslovie' },
      { imya: 'M', gde: { naOtrezke: ['S', 'C', t] }, rol: 'uslovie' },
    ],
    elementy:
      punkt === 'a'
        ? [
            { id: 'so', vid: 'vysota', tochki: ['S', 'O'], rol: 'uslovie' },
            { id: 'bd', vid: 'diagonal', tochki: ['B', 'D'] },
            { id: 'ac', vid: 'diagonal', tochki: ['A', 'C'] },
            { id: 'om', vid: 'otrezok', tochki: ['O', 'M'] },
          ]
        : [
            { id: 'so', vid: 'vysota', tochki: ['S', 'O'], rol: 'uslovie' },
            { id: 'sech', vid: 'mnogougolnik', tochki: ['B', 'M', 'D'], rol: 'uslovie' },
            { id: 'ac', vid: 'diagonal', tochki: ['A', 'C'] },
            { id: 'om', vid: 'otrezok', tochki: ['O', 'M'] },
          ],
  };
  if (punkt === 'b') {
    const s = scenariy(p, 'a');
    return { ...sc, rakurs: s.rakurs, szhatie: s.szhatie };
  }
  return sVidom(sc, vybratVid(postroit(sc)));
}

export function scenariyK15(p: PK15, punkt: 'a' | 'b'): Scenariy {
  return scenariy(p, punkt);
}

function chertezh(p: PK15, punkt: 'a' | 'b'): string {
  return chertezhSvg(scenariy(p, punkt), { rezhim: 'uchitel', shirina: 300, klass: 'ch3-svg' });
}

function sobrat(p: PK15): Chast2Zadacha {
  const c = chislaK15(p);
  const aT = kv(c.a2);
  const hT = kv(c.h2);
  const ugol = p.nado === 'ugol';
  const tgT = kv(c.tg2);
  const otvT = ugol ? `\\operatorname{arctg}${tgT === '1' ? '1' : tgT}` : kv(c.S2);
  const otvV = ugol ? Math.atan(Math.sqrt(toNumber(c.tg2))) : surdToNumber(sqrtRat(c.S2));
  const uslovie =
    `В правильной четырёхугольной пирамиде $SABCD$ сторона основания $AB$ равна $${aT}$, а высота $SO$ равна $${hT}$. На ребре $SC$ отмечена точка $M$ так, что $SM:MC=${p.m}:${p.n}$.\n` +
    `а) Докажите, что прямая $SC$ перпендикулярна плоскости $BMD$.\n` +
    `б) Найдите ${ugol ? 'угол между плоскостью $BMD$ и плоскостью основания пирамиды' : 'площадь треугольника $BMD$'}.`;
  const bLines = ugol
    ? [
        `Плоскости $BMD$ и $ABC$ пересекаются по прямой $BD$. Прямые $OM$ и $OC$ лежат в плоскости $SAC$, перпендикулярной $BD$, поэтому $OM\\perp BD$ и $OC\\perp BD$: $\\angle MOC$ — {{t:ugol-mezhdu-ploskostyami|линейный угол двугранного угла}}.`,
        `В прямоугольном треугольнике $OMC$ $\\angle MOC=90^\\circ-\\angle OCS=\\angle OSC$, а в треугольнике $SOC$ $\\operatorname{tg}\\angle OSC=\\dfrac{OC}{SO}=\\dfrac{${kv(c.oc2)}}{${hT}}=${tgT}$.`,
        `Ответ: $${otvT}$.`,
      ]
    : [
        `В прямоугольном треугольнике $SOC$ $OM$ — высота, проведённая к гипотенузе: $OM=\\dfrac{OC\\cdot SO}{SC}=\\dfrac{${kv(c.oc2)}\\cdot${hT}}{${kv(c.sc2)}}=${kv(c.om2)}$ ({{t:vysota-pryamougolnogo|высота прямоугольного треугольника}}).`,
        `$OM\\perp BD$ (прямая $BD$ перпендикулярна плоскости $SAC$), поэтому $S_{BMD}=\\dfrac12\\,BD\\cdot OM$ ({{t:ploshchad-treugolnika|площадь треугольника}}), $BD=AB\\sqrt2=${kv(mul(rat(2), c.a2))}$.`,
        `$S_{BMD}=\\dfrac12\\cdot${kv(mul(rat(2), c.a2))}\\cdot${kv(c.om2)}=${otvT}$.`,
      ];
  return {
    no: 15,
    shablon: 'k15.piramidaPerp',
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
        title: 'а) Прямая $BD$ перпендикулярна $SC$',
        risunok: chertezh(p, 'a'),
        lines: [
          `Диагонали квадрата перпендикулярны: $BD\\perp AC$; высота $SO$ перпендикулярна плоскости основания: $BD\\perp SO$. По {{t:priznak-perp-ploskosti|признаку перпендикулярности прямой и плоскости}} $BD\\perp(SAC)$, а значит, $BD\\perp SC$.`,
          `В прямоугольном треугольнике $SOC$: $OC=\\dfrac{AB}{\\sqrt2}=${kv(c.oc2)}$, $SC^2=SO^2+OC^2=${ratTex(c.h2)}+${ratTex(c.oc2)}=${ratTex(c.sc2)}$ ({{t:pifagor|теорема Пифагора}}).`,
        ],
      },
      {
        title: 'а) Прямая $OM$ перпендикулярна $SC$',
        lines: [
          `$MC=\\dfrac{${p.n}}{${p.m + p.n}}\\,SC$, поэтому $MC\\cdot SC=\\dfrac{${p.n}}{${p.m + p.n}}\\cdot${ratTex(c.sc2)}=${ratTex(c.oc2)}=OC^2$, то есть $\\dfrac{MC}{OC}=\\dfrac{OC}{SC}$.`,
          `У треугольников $OCM$ и $SCO$ общий угол $C$ и пропорциональные стороны — они {{t:podobie-uu|подобны}}, поэтому $\\angle OMC=\\angle SOC=90^\\circ$: $OM\\perp SC$.`,
          `Прямая $SC$ перпендикулярна двум пересекающимся прямым $BD$ и $OM$ плоскости $BMD$, значит, $SC\\perp(BMD)$.`,
        ],
      },
      {
        title: ugol ? 'б) Угол между плоскостями' : 'б) Площадь треугольника',
        risunok: chertezh(p, 'b'),
        lines: bLines,
      },
    ],
    razbor: [
      { slovo: 'а) $BD\\perp(SAC)$, значит, $BD\\perp SC$', formula: 'BD\\perp AC,\\ BD\\perp SO' },
      {
        slovo: 'а) $MC\\cdot SC=OC^2$ — подобие даёт $OM\\perp SC$',
        formula: `MC\\cdot SC=${ratTex(c.oc2)}`,
      },
      {
        slovo: ugol ? 'б) Линейный угол — $\\angle MOC$' : 'б) $OM$ — высота к гипотенузе',
        formula: ugol
          ? `\\operatorname{tg}\\angle MOC=\\frac{OC}{SO}=${tgT}`
          : `OM=\\frac{OC\\cdot SO}{SC}`,
      },
      { slovo: 'Ответ', formula: otvT },
    ],
    kontrol: { otvet: otvV, h2: toNumber(c.h2) },
  };
}

export const K15_PIRAMIDA_PERP: Shablon2<PK15> = {
  no: 15,
  prototip:
    'Правильная четырёхугольная пирамида: плоскость через диагональ основания перпендикулярна боковому ребру; угол с основанием или площадь сечения',
  sobrat,
};
