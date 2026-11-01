/**
 * №15 (варианты 25–26): правильная пирамида SABCD (AB = a, SA = b),
 * M — середина SC.
 *
 * а) BD ⊥ AC и BD ⊥ SO ⇒ BD ⊥ (ASC); плоскость BDM содержит BD ⇒
 *    (BDM) ⊥ (ASC).
 * б) Сечение — треугольник BDM; OM — медиана прямоугольного треугольника
 *    SOC к гипотенузе: OM = b/2, OM ⊥ BD ⇒ S = BD·OM/2 = ab√2/4.
 *    Или объём MBCD: высота из M равна h/2, V = a²h/12, h² = b² − a²/2.
 */

import { chertezhSvg, postroit, sVidom, vybratVid, type Scenariy } from '@/lib/chertezh3';
import { div, mul, rat, ratTex, sub, toNumber } from '@/lib/zadanie15/core/rational';
import { sqrtRat, surdTex, surdToNumber } from '@/lib/zadanie15/core/surd';
import type { Chast2Zadacha, Shablon2 } from './types';

export interface PN15 {
  /** AB². */
  a2: number;
  /** SA². */
  b2: number;
  /** б) площадь сечения BDM или объём пирамиды MBCD. */
  nado: 'S' | 'V';
}

export function chislaN15(p: PN15) {
  const a2 = rat(p.a2);
  const b2 = rat(p.b2);
  const h2 = sub(b2, div(a2, rat(2)));
  if (!(toNumber(h2) > 0)) throw new Error('n15: высота');
  /* S² = 2a²b²/16, V² = a⁴h²/144. */
  const S = sqrtRat(div(mul(rat(2), mul(a2, b2)), rat(16)));
  const V = sqrtRat(div(mul(mul(a2, a2), h2), rat(144)));
  return { a2, b2, h2, S, V };
}

function scenariy(p: PN15, punkt: 'a' | 'b'): Scenariy {
  const c = chislaN15(p);
  const sc: Scenariy = {
    id: `PV-N15-${punkt}`,
    alt:
      punkt === 'a'
        ? 'Правильная четырёхугольная пирамида, середина бокового ребра и плоскость через диагональ основания'
        : 'Правильная четырёхугольная пирамида и сечение через диагональ основания и середину бокового ребра',
    telo: { vid: 'piramida', n: 4, a: Math.sqrt(p.a2), h: Math.sqrt(toNumber(c.h2)) },
    imena: ['A', 'B', 'C', 'D', 'S'],
    tochki: [
      { imya: 'M', gde: { seredina: ['S', 'C'] }, rol: 'uslovie' },
      { imya: 'O', gde: { centr: ['A', 'B', 'C', 'D'] } },
    ],
    elementy: [
      { id: 'bdm', vid: 'treugolnik', tochki: ['B', 'D', 'M'], rol: 'uslovie' },
      { id: 'ac', vid: 'diagonal', tochki: ['A', 'C'] },
      { id: 'bd', vid: 'diagonal', tochki: ['B', 'D'] },
      { id: 'so', vid: 'vysota', tochki: ['S', 'O'] },
      { id: 'om', vid: 'otrezok', tochki: ['O', 'M'] },
    ],
  };
  return sVidom(sc, vybratVid(postroit(sc)));
}

export function scenariyN15(p: PN15, punkt: 'a' | 'b'): Scenariy {
  return scenariy(p, punkt);
}

function chertezh(p: PN15, punkt: 'a' | 'b'): string {
  return chertezhSvg(scenariy(p, punkt), { rezhim: 'uchitel', shirina: 300, klass: 'ch3-svg' });
}

function sobrat(p: PN15): Chast2Zadacha {
  const c = chislaN15(p);
  const aT = surdTex(sqrtRat(c.a2));
  const bT = surdTex(sqrtRat(c.b2));
  const hT = surdTex(sqrtRat(c.h2));
  const otv = p.nado === 'S' ? c.S : c.V;
  const otvT = surdTex(otv);
  const bdT = surdTex(sqrtRat(rat(2 * p.a2)));
  const uslovie =
    `В правильной четырёхугольной пирамиде $SABCD$ сторона основания $AB$ равна $${aT}$, а боковое ребро $SA$ равно $${bT}$. Точка $M$ — середина ребра $SC$.\n` +
    `а) Докажите, что плоскость $BDM$ перпендикулярна плоскости $ASC$.\n` +
    `б) Найдите ${p.nado === 'S' ? 'площадь сечения пирамиды плоскостью $BDM$' : 'объём пирамиды $MBCD$'}.`;
  const bLines =
    p.nado === 'S'
      ? [
          `По доказанному в пункте а) $BD\\perp(ASC)$, а $OM$ лежит в этой плоскости, значит, $OM\\perp BD$: $OM$ — высота треугольника $BDM$.`,
          `В прямоугольном треугольнике $SOC$ отрезок $OM$ — {{t:mediana-gipotenuza|медиана к гипотенузе}}: $OM=\\dfrac{SC}{2}=\\dfrac{${bT}}{2}$.`,
          `$BD=AB\\sqrt2=${bdT}$, поэтому {{t:ploshchad-treugolnika|площадь}} $S_{BDM}=\\dfrac12\\cdot BD\\cdot OM=\\dfrac12\\cdot ${bdT}\\cdot\\dfrac{${bT}}{2}=${otvT}$.`,
        ]
      : [
          `Высота пирамиды: $OC=\\dfrac{AB\\sqrt2}{2}$, по {{t:pifagor|теореме Пифагора}} $SO^2=SC^2-OC^2=${p.b2}-${ratTex(div(c.a2, rat(2)))}=${ratTex(c.h2)}$, $SO=${hT}$.`,
          `Точка $M$ — середина $SC$, поэтому расстояние от неё до плоскости основания вдвое меньше: $\\dfrac{SO}{2}$.`,
          `{{t:obem-piramidy|Объём пирамиды}} $MBCD$: $V=\\dfrac13\\cdot S_{BCD}\\cdot\\dfrac{SO}{2}=\\dfrac13\\cdot\\dfrac{AB^2}{2}\\cdot\\dfrac{SO}{2}=\\dfrac{${p.a2}\\cdot ${hT}}{12}=${otvT}$.`,
        ];
  return {
    no: 15,
    shablon: 'n15.piramidaSeredina',
    uslovie,
    risunok: null,
    punkty: [
      { bukva: 'а', pole: null },
      {
        bukva: 'б',
        podpis: p.nado === 'S' ? 'Площадь сечения' : 'Объём',
        pole: { vid: 'chislo', verno: otvT.replace(/\\dfrac/g, '\\frac') },
      },
    ],
    otvet: `б) $${otvT}$`,
    reshenie: [
      {
        title: 'а) Прямая $BD$ и плоскость $ASC$',
        risunok: chertezh(p, 'a'),
        lines: [
          `Пусть $O$ — центр квадрата $ABCD$; в правильной пирамиде $SO$ — высота, поэтому $SO\\perp BD$.`,
          `{{t:romb-diagonali|Диагонали квадрата перпендикулярны}}: $BD\\perp AC$.`,
          `Прямая $BD$ перпендикулярна двум пересекающимся прямым $AC$ и $SO$ плоскости $ASC$, значит, по {{t:priznak-perp-ploskosti|признаку перпендикулярности прямой и плоскости}} $BD\\perp(ASC)$.`,
        ],
      },
      {
        title: 'а) Вывод',
        lines: [
          `Плоскость $BDM$ проходит через прямую $BD$, перпендикулярную плоскости $ASC$. Значит, угол между этими плоскостями прямой: линейный угол двугранного угла по их общей прямой $OM$ образован прямыми, перпендикулярными $OM$, одна из которых — $BD$. Плоскости перпендикулярны.`,
        ],
      },
      {
        title: 'б) Сечение и ответ',
        risunok: chertezh(p, 'b'),
        lines: [...bLines, `Ответ: $${otvT}$.`],
      },
    ],
    razbor: [
      { slovo: 'а) $BD\\perp AC$ и $BD\\perp SO$', formula: 'BD\\perp(ASC)' },
      { slovo: 'а) Плоскость через перпендикуляр к плоскости', formula: '(BDM)\\perp(ASC)' },
      p.nado === 'S'
        ? { slovo: 'б) Медиана к гипотенузе', formula: `OM=\\dfrac{${bT}}{2}` }
        : { slovo: 'б) Высота пирамиды $MBCD$', formula: `\\dfrac{SO}{2}=\\dfrac{${hT}}{2}` },
      { slovo: 'б) Ответ', formula: otvT },
    ],
    kontrol: { otvet: surdToNumber(otv), h2: toNumber(c.h2) },
  };
}

export const N15_PIRAMIDA_SEREDINA: Shablon2<PN15> = {
  no: 15,
  prototip:
    'Правильная четырёхугольная пирамида: плоскость через диагональ основания и середину бокового ребра ⟂ диагональному сечению; площадь сечения или объём части',
  sobrat,
};
