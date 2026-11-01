/**
 * №15 (варианты 13–14): правильная треугольная пирамида SABC, AB = a,
 * SO = h (O — центр основания), M — середина BC.
 * а) BC ⊥ AM и BC ⊥ SM (медианы равнобедренных треугольников) ⇒ BC ⊥ (SAM).
 * б) Плоскость SBC ⊥ SAM, расстояние от A до (SBC) — высота AT треугольника
 *    SAM: AT = AM·SO/SM (площадь SAM двумя способами).
 *    AM² = 3a²/4, OM² = a²/12, SM² = h² + a²/12.
 */

import { chertezhSvg, postroit, sVidom, vybratVid, type Scenariy } from '@/lib/chertezh3';
import { add, div, mul, rat, ratTex, toNumber } from '@/lib/zadanie15/core/rational';
import { sqrtRat, surdTex, surdToNumber } from '@/lib/zadanie15/core/surd';
import type { Chast2Zadacha, Shablon2 } from './types';

export interface PO15 {
  /** AB². */
  a2: number;
  /** SO². */
  h2: number;
}

const kv = (x: ReturnType<typeof rat>) => surdTex(sqrtRat(x));

export function chislaO15(p: PO15) {
  if (!(p.a2 > 0 && p.h2 > 0)) throw new Error('o15: размеры');
  const a2 = rat(p.a2);
  const h2 = rat(p.h2);
  const am2 = div(mul(rat(3), a2), rat(4));
  const om2 = div(a2, rat(12));
  const sm2 = add(h2, om2);
  const d2 = div(mul(am2, h2), sm2);
  return { a2, h2, am2, om2, sm2, d2, d: surdToNumber(sqrtRat(d2)) };
}

function scenariy(p: PO15, punkt: 'a' | 'b'): Scenariy {
  const sc: Scenariy = {
    id: `PV-O15-${punkt}`,
    alt:
      punkt === 'a'
        ? 'Правильная треугольная пирамида, медиана основания и апофема к одному ребру'
        : 'Правильная треугольная пирамида, перпендикуляр из вершины основания к боковой грани',
    telo: { vid: 'piramida', n: 3, a: Math.sqrt(p.a2), h: Math.sqrt(p.h2) },
    imena: ['A', 'B', 'C', 'S'],
    tochki: [
      { imya: 'O', gde: { centr: ['A', 'B', 'C'] }, rol: 'uslovie' },
      { imya: 'M', gde: { naOtrezke: ['B', 'C', 0.5] }, rol: 'uslovie' },
    ],
    elementy: [
      { id: 'so', vid: 'vysota', tochki: ['S', 'O'], rol: 'uslovie' },
      { id: 'am', vid: 'otrezok', tochki: ['A', 'M'] },
      { id: 'sm', vid: 'otrezok', tochki: ['S', 'M'] },
    ],
  };
  if (punkt === 'b') {
    const s = scenariy(p, 'a');
    return { ...sc, rakurs: s.rakurs, szhatie: s.szhatie };
  }
  return sVidom(sc, vybratVid(postroit(sc)));
}

export function scenariyO15(p: PO15, punkt: 'a' | 'b'): Scenariy {
  return scenariy(p, punkt);
}

const chertezh = (p: PO15, punkt: 'a' | 'b') =>
  chertezhSvg(scenariy(p, punkt), { rezhim: 'uchitel', shirina: 300, klass: 'ch3-svg' });

function sobrat(p: PO15): Chast2Zadacha {
  const c = chislaO15(p);
  const otvT = kv(c.d2);
  return {
    no: 15,
    shablon: 'o15.piramidaRasst',
    uslovie:
      `В правильной треугольной пирамиде $SABC$ сторона основания равна $${kv(c.a2)}$, а высота $SO$ равна $${kv(c.h2)}$. Точка $M$ — середина ребра $BC$.\n` +
      `а) Докажите, что прямая $BC$ перпендикулярна плоскости $SAM$.\n` +
      `б) Найдите расстояние от точки $A$ до плоскости $SBC$.`,
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
        title: 'а) Две перпендикулярные прямые',
        risunok: chertezh(p, 'a'),
        lines: [
          `Треугольник $ABC$ равносторонний, $AM$ — медиана, поэтому и высота: $AM\\perp BC$ ({{t:ravnobedr-vysota|медиана равнобедренного треугольника}}).`,
          `Боковые рёбра правильной пирамиды равны, треугольник $SBC$ равнобедренный, $SM$ — медиана и высота: $SM\\perp BC$.`,
          `Прямая $BC$ перпендикулярна двум пересекающимся прямым $AM$ и $SM$ плоскости $SAM$, по {{t:priznak-perp-ploskosti|признаку перпендикулярности прямой и плоскости}} $BC\\perp(SAM)$.`,
        ],
      },
      {
        title: 'б) Перпендикуляр к грани',
        risunok: chertezh(p, 'b'),
        lines: [
          `Плоскость $SBC$ проходит через $BC\\perp(SAM)$, поэтому $(SBC)\\perp(SAM)$, и перпендикуляр $AT$ из точки $A$ к прямой $SM$ есть {{t:rasst-do-ploskosti|расстояние до плоскости}} $SBC$.`,
          `$AM=\\dfrac{\\sqrt3}{2}AB$, $AM^2=${ratTex(c.am2)}$; $OM=\\dfrac13AM$, $OM^2=${ratTex(c.om2)}$; по {{t:pifagor|теореме Пифагора}} $SM^2=SO^2+OM^2=${ratTex(c.sm2)}$.`,
          `Площадь треугольника $SAM$ двумя способами ({{t:ploshchad-treugolnika|площадь треугольника}}): $AM\\cdot SO=SM\\cdot AT$, откуда $AT=\\dfrac{AM\\cdot SO}{SM}$, $AT^2=\\dfrac{${ratTex(c.am2)}\\cdot${ratTex(c.h2)}}{${ratTex(c.sm2)}}=${ratTex(c.d2)}$.`,
          `Ответ: $${otvT}$.`,
        ],
      },
      {
        title: 'Ответ',
        lines: [`б) $${otvT}$.`],
      },
    ],
    razbor: [
      { slovo: 'а) $BC\\perp AM$ и $BC\\perp SM$', formula: 'BC\\perp(SAM)' },
      { slovo: 'б) Расстояние — высота треугольника $SAM$', formula: 'AT=\\frac{AM\\cdot SO}{SM}' },
      { slovo: 'Длины', formula: `AM^2=${ratTex(c.am2)},\\ SM^2=${ratTex(c.sm2)}` },
      { slovo: 'Ответ', formula: otvT },
    ],
    kontrol: { otvet: c.d, sm2: toNumber(c.sm2) },
  };
}

export const O15_PIRAMIDA_RASST: Shablon2<PO15> = {
  no: 15,
  prototip:
    'Правильная треугольная пирамида: перпендикулярность ребра основания плоскости через апофему; расстояние от вершины до боковой грани',
  sobrat,
};
