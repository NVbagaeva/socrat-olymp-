/**
 * №15 (варианты 17–18): правильная шестиугольная пирамида SABCDEF,
 * AB = a, SA = l (l > a).
 * а) BF ⊥ AD (AD — ось симметрии шестиугольника) и BF ⊥ SO ⇒ BF ⊥ (SAD).
 * б) P = BF ∩ AD — проекция B на (SAD), BP = a√3/2:
 *    sin∠BSP = BP/SB = a√3/(2l).
 */

import { chertezhSvg, postroit, sVidom, vybratVid, type Scenariy } from '@/lib/chertezh3';
import { div, mul, rat, ratTex, toNumber } from '@/lib/zadanie15/core/rational';
import { sqrtRat, surdTex } from '@/lib/zadanie15/core/surd';
import type { Chast2Zadacha, Shablon2 } from './types';

export interface PAE15 {
  a2: number;
  l2: number;
}

export function chislaAE15(p: PAE15) {
  if (!(p.l2 > p.a2)) throw new Error('ae15: l > a');
  const bp2 = div(mul(rat(3), rat(p.a2)), rat(4));
  const sin2 = div(bp2, rat(p.l2));
  const h = Math.sqrt(p.l2 - p.a2);
  return { bp2, sin2, h, ugol: Math.asin(Math.sqrt(toNumber(sin2))) };
}

function scenariy(p: PAE15, punkt: 'a' | 'b'): Scenariy {
  const c = chislaAE15(p);
  const sc: Scenariy = {
    id: `PV-AE15-${punkt}`,
    alt:
      punkt === 'a'
        ? 'Правильная шестиугольная пирамида, большая диагональ основания и хорда BF'
        : 'Правильная шестиугольная пирамида, угол между боковым ребром и плоскостью через большую диагональ',
    telo: { vid: 'piramida', n: 6, a: Math.sqrt(p.a2), h: c.h },
    imena: ['A', 'B', 'C', 'D', 'E', 'F', 'S'],
    tochki: [
      { imya: 'O', gde: { centr: ['A', 'B', 'C', 'D', 'E', 'F'] }, rol: 'uslovie' },
      { imya: 'P', gde: { naOtrezke: ['B', 'F', 0.5] } },
    ],
    elementy:
      punkt === 'a'
        ? [
            { id: 'ad', vid: 'diagonal', tochki: ['A', 'D'] },
            { id: 'bf', vid: 'diagonal', tochki: ['B', 'F'] },
            { id: 'so', vid: 'vysota', tochki: ['S', 'O'], rol: 'uslovie' },
          ]
        : [
            { id: 'ad', vid: 'diagonal', tochki: ['A', 'D'] },
            { id: 'bp', vid: 'otrezok', tochki: ['B', 'P'] },
            { id: 'sp', vid: 'otrezok', tochki: ['S', 'P'] },
          ],
  };
  if (punkt === 'b') {
    const s = scenariy(p, 'a');
    return { ...sc, rakurs: s.rakurs, szhatie: s.szhatie };
  }
  return sVidom(sc, vybratVid(postroit(sc)));
}

export function scenariyAE15(p: PAE15, punkt: 'a' | 'b'): Scenariy {
  return scenariy(p, punkt);
}

const chertezh = (p: PAE15, punkt: 'a' | 'b') =>
  chertezhSvg(scenariy(p, punkt), { rezhim: 'uchitel', shirina: 300, klass: 'ch3-svg' });

function sobrat(p: PAE15): Chast2Zadacha {
  const c = chislaAE15(p);
  const kv = (x: ReturnType<typeof rat>) => surdTex(sqrtRat(x));
  const sinT = kv(c.sin2);
  const otvT = `\\arcsin${sinT}`;
  return {
    no: 15,
    shablon: 'ae15.shestiugPiramida',
    uslovie:
      `В правильной шестиугольной пирамиде $SABCDEF$ сторона основания равна $${kv(rat(p.a2))}$, а боковое ребро равно $${kv(rat(p.l2))}$.\n` +
      `а) Докажите, что прямая $BF$ перпендикулярна плоскости $SAD$.\n` +
      `б) Найдите угол между прямой $SB$ и плоскостью $SAD$.`,
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
        title: 'а) Признак перпендикулярности',
        risunok: chertezh(p, 'a'),
        lines: [
          `Треугольник $ABF$ равнобедренный ($AB=AF$), а прямая $AD$ проходит через центр $O$ и делит угол $BAF$ пополам, поэтому $AD\\perp BF$ ({{t:ravnobedr-vysota|биссектриса равнобедренного треугольника}}).`,
          `Высота $SO$ перпендикулярна плоскости основания, поэтому $SO\\perp BF$. По {{t:priznak-perp-ploskosti|признаку перпендикулярности прямой и плоскости}} $BF\\perp(SAD)$.`,
        ],
      },
      {
        title: 'б) Проекция ребра',
        risunok: chertezh(p, 'b'),
        lines: [
          `Пусть $P=BF\\cap AD$. Так как $BP\\perp(SAD)$, $SP$ — проекция $SB$ на эту плоскость ({{t:naklonnye-proekcii|наклонная и проекция}}), искомый угол — $\\angle BSP$ ({{t:ugol-pryamoy-ploskost|угол между прямой и плоскостью}}).`,
          `$BP$ — половина $BF=AB\\sqrt3$: $BP^2=${ratTex(c.bp2)}$. В прямоугольном треугольнике $BPS$: $\\sin\\angle BSP=\\dfrac{BP}{SB}=${sinT}$.`,
          `Ответ: $${otvT}$.`,
        ],
      },
      {
        title: 'Ответ',
        lines: [`б) $${otvT}$.`],
      },
    ],
    razbor: [
      { slovo: 'а) $BF\\perp AD$ и $BF\\perp SO$', formula: 'BF\\perp(SAD)' },
      { slovo: 'б) Угол $BSP$', formula: `BP^2=${ratTex(c.bp2)}` },
      { slovo: 'Синус', formula: `\\sin\\varphi=${sinT}` },
      { slovo: 'Ответ', formula: otvT },
    ],
    kontrol: { otvet: c.ugol, sin2: toNumber(c.sin2) },
  };
}

export const AE15_SHESTIUG_PIRAMIDA: Shablon2<PAE15> = {
  no: 15,
  prototip:
    'Правильная шестиугольная пирамида: перпендикулярность хорды основания плоскости через большую диагональ; угол бокового ребра с этой плоскостью',
  sobrat,
};
