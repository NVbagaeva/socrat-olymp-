/**
 * №15 (варианты 5–6): правильный тетраэдр ABCD с ребром a.
 * а) AB ⊥ CD: CD перпендикулярна плоскости ABM, M — середина CD.
 * б) Расстояние между AB и CD — общий перпендикуляр MN (N — середина AB),
 *    MN² = AM² − AN² = 3a²/4 − a²/4 = a²/2.
 */

import { chertezhSvg, postroit, sVidom, vybratVid, type Scenariy } from '@/lib/chertezh3';
import { rat } from '@/lib/zadanie15/core/rational';
import { sqrtRat, surdTex, surdToNumber } from '@/lib/zadanie15/core/surd';
import type { Chast2Zadacha, Shablon2 } from './types';

export interface PW15 {
  /** Ребро² (ребро = √a2). */
  a2: number;
}

export function chislaW15(p: PW15) {
  if (!(p.a2 > 0)) throw new Error('w15: ребро');
  const d2 = rat(p.a2, 2);
  return { d2, d: surdToNumber(sqrtRat(d2)) };
}

function scenariy(p: PW15, punkt: 'a' | 'b'): Scenariy {
  const sc: Scenariy = {
    id: `PV-W15-${punkt}`,
    alt:
      punkt === 'a'
        ? 'Правильный тетраэдр и плоскость через ребро и середину противолежащего ребра'
        : 'Правильный тетраэдр и общий перпендикуляр противолежащих рёбер',
    telo: { vid: 'tetraedr', a: Math.sqrt(p.a2) },
    imena: ['A', 'B', 'C', 'D'],
    tochki: [
      { imya: 'M', gde: { seredina: ['C', 'D'] }, rol: 'uslovie' },
      ...(punkt === 'b'
        ? [{ imya: 'N', gde: { seredina: ['A', 'B'] as const }, rol: 'vspom' as const }]
        : []),
    ],
    elementy:
      punkt === 'a'
        ? [
            { id: 'am', vid: 'mediana', tochki: ['A', 'M'] },
            { id: 'bm', vid: 'mediana', tochki: ['B', 'M'] },
            { id: 'abm', vid: 'treugolnik', tochki: ['A', 'B', 'M'] },
          ]
        : [
            { id: 'am', vid: 'mediana', tochki: ['A', 'M'] },
            { id: 'bm', vid: 'mediana', tochki: ['B', 'M'] },
            { id: 'mn', vid: 'otrezok', tochki: ['M', 'N'], rol: 'uslovie' },
            { id: 'pu', vid: 'pryamoy-ugol', tochki: ['A', 'N', 'M'] },
          ],
  };
  if (punkt === 'b') {
    const s = scenariy(p, 'a');
    return { ...sc, rakurs: s.rakurs, szhatie: s.szhatie };
  }
  return sVidom(sc, vybratVid(postroit(sc)));
}

export function scenariyW15(p: PW15, punkt: 'a' | 'b'): Scenariy {
  return scenariy(p, punkt);
}

const chertezh = (p: PW15, punkt: 'a' | 'b') =>
  chertezhSvg(scenariy(p, punkt), { rezhim: 'uchitel', shirina: 300, klass: 'ch3-svg' });

function sobrat(p: PW15): Chast2Zadacha {
  const ch = chislaW15(p);
  const aT = surdTex(sqrtRat(rat(p.a2)));
  const dT = surdTex(sqrtRat(ch.d2));
  return {
    no: 15,
    shablon: 'w15.tetraedr',
    uslovie:
      `Дан правильный тетраэдр $ABCD$ с ребром $${aT}$.\n` +
      `а) Докажите, что прямые $AB$ и $CD$ перпендикулярны.\n` +
      `б) Найдите расстояние между прямыми $AB$ и $CD$.`,
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
        title: 'а) Плоскость $ABM$',
        risunok: chertezh(p, 'a'),
        lines: [
          `Пусть $M$ — середина $CD$. Треугольники $ACD$ и $BCD$ равносторонние, их медианы $AM$ и $BM$ — высоты ({{t:ravnobedr-vysota|медиана равнобедренного треугольника}}): $AM\\perp CD$, $BM\\perp CD$.`,
          `Значит, $CD\\perp(ABM)$ ({{t:priznak-perp-ploskosti|признак перпендикулярности прямой и плоскости}}), и $CD\\perp AB$, так как $AB$ лежит в плоскости $ABM$.`,
        ],
      },
      {
        title: 'б) Общий перпендикуляр',
        risunok: chertezh(p, 'b'),
        lines: [
          `$AM=BM=\\dfrac{\\sqrt3}{2}\\cdot${aT}$, треугольник $ABM$ равнобедренный, его медиана $MN$ ($N$ — середина $AB$) перпендикулярна $AB$. Кроме того, $MN$ лежит в плоскости $ABM$, поэтому $MN\\perp CD$: $MN$ — общий перпендикуляр прямых $AB$ и $CD$, его длина — расстояние между ними ({{t:rasst-skreshch|расстояние между скрещивающимися прямыми}}).`,
          `По {{t:pifagor|теореме Пифагора}} $MN^2=AM^2-AN^2=\\dfrac34\\cdot${p.a2}-\\dfrac14\\cdot${p.a2}=\\dfrac{${p.a2}}{2}$, $MN=${dT}$. Ответ: $${dT}$.`,
        ],
      },
      { title: 'Ответ', lines: [`Ответ: $${dT}$.`] },
    ],
    razbor: [
      { slovo: 'а) $CD\\perp AM$ и $CD\\perp BM$', formula: 'CD\\perp(ABM)' },
      { slovo: 'б) Общий перпендикуляр — медиана $MN$', formula: 'MN^2=AM^2-AN^2' },
      { slovo: 'Ответ', formula: dT },
    ],
    kontrol: { otvet: ch.d },
  };
}

export const W15_TETRAEDR: Shablon2<PW15> = {
  no: 15,
  prototip: 'Правильный тетраэдр: перпендикулярность противолежащих рёбер и расстояние между ними',
  sobrat,
};
