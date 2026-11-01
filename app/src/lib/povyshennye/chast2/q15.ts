/**
 * №15 (варианты 29–30): правильная пирамида SABC (AB = a, SA = b),
 * D — середина BC.
 *
 * а) BC ⊥ AD и BC ⊥ SD ⇒ BC ⊥ (SAD) ⇒ BC ⊥ SA.
 * б) Плоскость через BC перпендикулярно SA проходит через перпендикуляр DH
 *    к SA (H на SA): сечение — треугольник BCH. SH = (SD² + SA² − AD²)/(2SA)
 *    = (2b² − a²)/(2b).
 *    «V»: объём части с вершиной S — тетраэдр SBCH: V·SH/SA,
 *         V = a²√(3b² − a²)/12.
 *    «S»: площадь сечения BCH = a·DH/2, DH² = SD² − SH².
 */

import { chertezhSvg, postroit, sVidom, vybratVid, type Scenariy } from '@/lib/chertezh3';
import { div, mul, rat, ratTex, sub, toNumber } from '@/lib/zadanie15/core/rational';
import { sqrtRat, surdTex, surdToNumber } from '@/lib/zadanie15/core/surd';
import type { Chast2Zadacha, Shablon2 } from './types';

export interface PQ15 {
  /** AB². */
  a2: number;
  /** SA². */
  b2: number;
  nado: 'V' | 'S';
}

export function chislaQ15(p: PQ15) {
  const a2 = rat(p.a2);
  const b2 = rat(p.b2);
  if (!(2 * p.b2 > p.a2)) throw new Error('q15: H вне ребра');
  const sd2 = sub(b2, div(a2, rat(4)));
  const ad2 = div(mul(rat(3), a2), rat(4));
  /* SH/SA = (2b² − a²)/(2b²); SH² = (2b² − a²)²/(4b²). */
  const dolya = div(sub(mul(rat(2), b2), a2), mul(rat(2), b2));
  const sh2 = mul(mul(dolya, dolya), b2);
  const dh2 = sub(sd2, sh2);
  /* V² = a⁴(3b² − a²)/144; Vчасти² = V²·доля². */
  const V2 = div(mul(mul(a2, a2), sub(mul(rat(3), b2), a2)), rat(144));
  const Vch = sqrtRat(mul(V2, mul(dolya, dolya)));
  const S = sqrtRat(div(mul(a2, dh2), rat(4)));
  return { sd2, ad2, dolya, sh2, dh2, V: sqrtRat(V2), Vch, S, h2: sub(b2, div(a2, rat(3))) };
}

function scenariy(p: PQ15, punkt: 'a' | 'b'): Scenariy {
  const c = chislaQ15(p);
  const sc: Scenariy = {
    id: `PV-Q15-${punkt}`,
    alt:
      punkt === 'a'
        ? 'Правильная треугольная пирамида, середина ребра основания и плоскость SAD'
        : 'Правильная треугольная пирамида и сечение через ребро основания, перпендикулярное боковому ребру',
    telo: { vid: 'piramida', n: 3, a: Math.sqrt(p.a2), h: Math.sqrt(toNumber(c.h2)) },
    imena: ['A', 'B', 'C', 'S'],
    tochki: [
      { imya: 'D', gde: { seredina: ['B', 'C'] } },
      ...(punkt === 'b'
        ? [
            {
              imya: 'H',
              gde: { naOtrezke: ['S', 'A', toNumber(c.dolya)] as const },
              rol: 'uslovie' as const,
            },
          ]
        : []),
    ],
    elementy:
      punkt === 'a'
        ? [
            { id: 'ad', vid: 'mediana', tochki: ['A', 'D'] },
            { id: 'sd', vid: 'apofema', tochki: ['S', 'D'] },
          ]
        : [
            { id: 'bch', vid: 'treugolnik', tochki: ['B', 'C', 'H'], rol: 'uslovie' },
            { id: 'ad', vid: 'mediana', tochki: ['A', 'D'] },
            { id: 'sd', vid: 'apofema', tochki: ['S', 'D'] },
            { id: 'dh', vid: 'otrezok', tochki: ['D', 'H'] },
          ],
  };
  return sVidom(sc, vybratVid(postroit(sc)));
}

export function scenariyQ15(p: PQ15, punkt: 'a' | 'b'): Scenariy {
  return scenariy(p, punkt);
}

function chertezh(p: PQ15, punkt: 'a' | 'b'): string {
  return chertezhSvg(scenariy(p, punkt), { rezhim: 'uchitel', shirina: 300, klass: 'ch3-svg' });
}

function sobrat(p: PQ15): Chast2Zadacha {
  const c = chislaQ15(p);
  const aT = surdTex(sqrtRat(rat(p.a2)));
  const bT = surdTex(sqrtRat(rat(p.b2)));
  const otv = p.nado === 'V' ? c.Vch : c.S;
  const otvT = surdTex(otv);
  const shT = surdTex(sqrtRat(c.sh2));
  const uslovie =
    `В правильной треугольной пирамиде $SABC$ сторона основания $AB$ равна $${aT}$, а боковое ребро $SA$ равно $${bT}$.\n` +
    `а) Докажите, что прямые $SA$ и $BC$ перпендикулярны.\n` +
    `б) Через прямую $BC$ провели плоскость, перпендикулярную ребру $SA$. ${p.nado === 'V' ? 'Найдите объём той из двух частей, на которые она делит пирамиду, которая содержит вершину $S$.' : 'Найдите площадь сечения пирамиды этой плоскостью.'}`;
  const bLast =
    p.nado === 'V'
      ? [
          `{{t:obem-piramidy|Объём пирамиды}} $SABC$: высота $SO$, $SO^2=SA^2-AO^2=${p.b2}-\\dfrac{${p.a2}}{3}=${ratTex(c.h2)}$, $V=\\dfrac13\\cdot\\dfrac{\\sqrt3}{4}AB^2\\cdot SO=${surdTex(c.V)}$.`,
          `Пирамиды $SBCH$ и $SBCA$ имеют общую грань $SBC$, а их высоты к ней относятся как $SH:SA$. Поэтому $V_{SBCH}=V\\cdot\\dfrac{SH}{SA}=${surdTex(c.V)}\\cdot ${ratTex(c.dolya)}=${otvT}$.`,
        ]
      : [
          `$DH^2=SD^2-SH^2=${ratTex(c.sd2)}-${ratTex(c.sh2)}=${ratTex(c.dh2)}$ ({{t:pifagor|теорема Пифагора}} в треугольнике $SHD$).`,
          `$DH\\perp BC$ (так как $BC\\perp(SAD)$), поэтому {{t:ploshchad-treugolnika|площадь}} сечения $S_{BCH}=\\dfrac12\\cdot BC\\cdot DH=${otvT}$.`,
        ];
  return {
    no: 15,
    shablon: 'q15.piramidaPerp',
    uslovie,
    risunok: null,
    punkty: [
      { bukva: 'а', pole: null },
      {
        bukva: 'б',
        podpis: p.nado === 'V' ? 'Объём' : 'Площадь сечения',
        pole: { vid: 'chislo', verno: otvT.replace(/\\dfrac/g, '\\frac') },
      },
    ],
    otvet: `б) $${otvT}$`,
    reshenie: [
      {
        title: 'а) Прямая $BC$ и плоскость $SAD$',
        risunok: chertezh(p, 'a'),
        lines: [
          `$D$ — середина $BC$. В правильном треугольнике $ABC$ медиана $AD$ является {{t:ravnobedr-vysota|высотой}}: $BC\\perp AD$. В равнобедренном треугольнике $SBC$ медиана $SD$ — тоже высота: $BC\\perp SD$.`,
          `По {{t:priznak-perp-ploskosti|признаку перпендикулярности прямой и плоскости}} $BC\\perp(SAD)$, а значит, $BC$ перпендикулярна любой прямой этой плоскости, в том числе $SA$.`,
        ],
      },
      {
        title: 'б) Сечение',
        risunok: chertezh(p, 'b'),
        lines: [
          `Проведём в плоскости $SAD$ перпендикуляр $DH$ к $SA$. Прямые $DH$ и $BC$ перпендикулярны $SA$, поэтому плоскость $BCH$ перпендикулярна $SA$ — это и есть секущая плоскость, сечение — треугольник $BCH$.`,
          `$SD^2=SB^2-BD^2=${ratTex(c.sd2)}$, $AD^2=${ratTex(c.ad2)}$. По {{t:teorema-kosinusov|теореме косинусов}} в треугольнике $SAD$: $SH=SD\\cos\\angle DSA=\\dfrac{SD^2+SA^2-AD^2}{2SA}$, $\\dfrac{SH}{SA}=${ratTex(c.dolya)}$, $SH=${shT}$ — точка $H$ лежит на ребре $SA$.`,
        ],
      },
      { title: 'б) Ответ', lines: [...bLast, `Ответ: $${otvT}$.`] },
    ],
    razbor: [
      { slovo: 'а) $BC\\perp AD$ и $BC\\perp SD$', formula: 'BC\\perp(SAD)' },
      {
        slovo: 'б) Сечение — треугольник $BCH$, $DH\\perp SA$',
        formula: `\\dfrac{SH}{SA}=${ratTex(c.dolya)}`,
      },
      p.nado === 'V'
        ? {
            slovo: 'б) Общая грань — объёмы как высоты',
            formula: 'V_{SBCH}=V\\cdot\\dfrac{SH}{SA}',
          }
        : { slovo: 'б) Высота сечения', formula: `DH^2=${ratTex(c.dh2)}` },
      { slovo: 'б) Ответ', formula: otvT },
    ],
    kontrol: { otvet: surdToNumber(otv), dolya: toNumber(c.dolya) },
  };
}

export const Q15_PIRAMIDA_PERP: Shablon2<PQ15> = {
  no: 15,
  prototip:
    'Правильная треугольная пирамида: SA ⟂ BC; сечение через BC, перпендикулярное SA — объём части или площадь',
  sobrat,
};
