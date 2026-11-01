/**
 * №15 (варианты 9–10): куб ABCDA₁B₁C₁D₁ с ребром √a2.
 *
 * а) BD ⊥ AC, BD ⊥ AA₁ ⇒ BD ⊥ (AA₁C) ⇒ BD ⊥ A₁C; аналогично
 *    BC₁ ⊥ B₁C, BC₁ ⊥ A₁B₁ ⇒ BC₁ ⊥ A₁C. Значит, A₁C ⊥ (BDC₁).
 * б) «A1»: A₁B = A₁D = A₁C₁ — равные наклонные, их проекции равны,
 *    основание перпендикуляра — центр G правильного треугольника BDC₁:
 *    A₁G² = A₁B² − BG² = 2a² − 2a²/3 = 4a²/3.
 *    «A»: тетраэдр ABDC₁, V = a³/6, S(BDC₁) = a²√3/2,
 *    d = 3V/S = a/√3, d² = a²/3.
 */

import { chertezhSvg, postroit, sVidom, vybratVid, type Scenariy } from '@/lib/chertezh3';
import { div, mul, rat, toNumber } from '@/lib/zadanie15/core/rational';
import { sqrtRat, surdTex } from '@/lib/zadanie15/core/surd';
import type { Chast2Zadacha, Shablon2 } from './types';

export interface PY15 {
  /** Ребро² (ребро = √a2). */
  a2: number;
  ot: 'A' | 'A1';
}

export function chislaY15(p: PY15) {
  const a2 = rat(p.a2);
  const d2 = p.ot === 'A1' ? div(mul(rat(4), a2), rat(3)) : div(a2, rat(3));
  return { a2, d2 };
}

function scenariy(p: PY15, punkt: 'a' | 'b'): Scenariy {
  const a = Math.sqrt(p.a2);
  const sc: Scenariy = {
    id: `PV-Y15-${punkt}`,
    alt:
      punkt === 'a'
        ? 'Куб, плоскость через концы трёх рёбер из одной вершины и диагональ куба'
        : 'Куб, сечение через концы трёх рёбер и перпендикуляр из вершины к нему',
    telo: { vid: 'prizma', n: 4, a, h: a },
    imena: ['A', 'B', 'C', 'D', 'A1', 'B1', 'C1', 'D1'],
    tochki: [],
    elementy:
      punkt === 'a'
        ? [
            { id: 'bdc1', vid: 'treugolnik', tochki: ['B', 'D', 'C1'], rol: 'uslovie' },
            { id: 'a1c', vid: 'otrezok', tochki: ['A1', 'C'] },
            { id: 'bd', vid: 'diagonal', tochki: ['B', 'D'] },
            { id: 'ac', vid: 'diagonal', tochki: ['A', 'C'] },
          ]
        : [
            { id: 'bdc1', vid: 'treugolnik', tochki: ['B', 'D', 'C1'], rol: 'uslovie' },
            { id: 'a1c', vid: 'otrezok', tochki: ['A1', 'C'] },
          ],
  };
  if (punkt === 'b') {
    const s = scenariy(p, 'a');
    return { ...sc, rakurs: s.rakurs, szhatie: s.szhatie };
  }
  return sVidom(sc, vybratVid(postroit(sc)));
}

export function scenariyY15(p: PY15, punkt: 'a' | 'b'): Scenariy {
  return scenariy(p, punkt);
}

function chertezh(p: PY15, punkt: 'a' | 'b'): string {
  return chertezhSvg(scenariy(p, punkt), { rezhim: 'uchitel', shirina: 300, klass: 'ch3-svg' });
}

function sobrat(p: PY15): Chast2Zadacha {
  if (!(p.a2 > 0)) throw new Error('y15: ребро');
  const ch = chislaY15(p);
  const aT = surdTex(sqrtRat(ch.a2));
  const otv = surdTex(sqrtRat(ch.d2));
  const tochka = p.ot === 'A1' ? 'A_1' : 'A';
  const bLines =
    p.ot === 'A1'
      ? [
          `$A_1B=A_1D=A_1C_1=a\\sqrt2$ (диагонали граней). Равные наклонные из точки $A_1$ имеют равные проекции на плоскость $BDC_1$ ({{t:naklonnye-proekcii|наклонные и проекции}}), поэтому основание перпендикуляра — точка $G$, равноудалённая от $B$, $D$, $C_1$, то есть центр правильного треугольника $BDC_1$ (по пункту а) она лежит на $A_1C$).`,
          `Сторона треугольника $BDC_1$ равна $a\\sqrt2$, радиус описанной окружности $BG=\\dfrac{a\\sqrt2}{\\sqrt3}$. По {{t:pifagor|теореме Пифагора}} $A_1G^2=A_1B^2-BG^2=2a^2-\\dfrac{2a^2}{3}=\\dfrac{4a^2}{3}$.`,
          `При $a=${aT}$: $A_1G=${otv}$ ({{t:rasst-do-ploskosti|расстояние от точки до плоскости}}).`,
        ]
      : [
          `Расстояние от $A$ до плоскости $BDC_1$ — высота тетраэдра $ABDC_1$ из вершины $A$ ({{t:rasst-do-ploskosti|расстояние от точки до плоскости}}). Найдём его через объём.`,
          `Если основание — $ABD$, то высота — $CC_1=a$ (ребро $CC_1$ перпендикулярно плоскости $ABD$): $V=\\dfrac13\\cdot\\dfrac{a^2}{2}\\cdot a=\\dfrac{a^3}{6}$ ({{t:obem-piramidy|объём пирамиды}}).`,
          `Треугольник $BDC_1$ правильный со стороной $a\\sqrt2$: $S=\\dfrac{\\sqrt3}{4}\\cdot2a^2=\\dfrac{a^2\\sqrt3}{2}$. Тогда $d=\\dfrac{3V}{S}=\\dfrac{a}{\\sqrt3}$.`,
          `При $a=${aT}$: $d=${otv}$.`,
        ];
  return {
    no: 15,
    shablon: 'y15.kubDiagonal',
    uslovie:
      `Дан куб $ABCDA_1B_1C_1D_1$ с ребром $${aT}$.\n` +
      `а) Докажите, что прямая $A_1C$ перпендикулярна плоскости $BDC_1$.\n` +
      `б) Найдите расстояние от точки $${tochka}$ до плоскости $BDC_1$.`,
    risunok: null,
    punkty: [
      { bukva: 'а', pole: null },
      {
        bukva: 'б',
        podpis: 'Расстояние',
        pole: { vid: 'chislo', verno: otv.replace(/\\dfrac/g, '\\frac') },
      },
    ],
    otvet: `б) $${otv}$`,
    reshenie: [
      {
        title: 'а) $A_1C\\perp BD$',
        risunok: chertezh(p, 'a'),
        lines: [
          `$BD\\perp AC$ — диагонали квадрата ({{t:romb-diagonali|диагонали ромба перпендикулярны}}), $BD\\perp AA_1$ — ребро $AA_1$ перпендикулярно основанию. По {{t:priznak-perp-ploskosti|признаку перпендикулярности прямой и плоскости}} $BD\\perp(AA_1C)$, значит, $BD\\perp A_1C$.`,
        ],
      },
      {
        title: 'а) $A_1C\\perp BC_1$ и вывод',
        lines: [
          'Так же в грани $BCC_1B_1$: $BC_1\\perp B_1C$, а $A_1B_1\\perp(BCC_1)$, поэтому $BC_1\\perp(A_1B_1C)$ и $BC_1\\perp A_1C$.',
          'Прямая $A_1C$ перпендикулярна двум пересекающимся прямым $BD$ и $BC_1$ плоскости $BDC_1$, значит, $A_1C\\perp(BDC_1)$.',
        ],
      },
      { title: 'б) Расстояние', risunok: chertezh(p, 'b'), lines: bLines },
    ],
    razbor: [
      {
        slovo: 'а) Признак перпендикулярности дважды',
        formula: 'A_1C\\perp BD,\\ A_1C\\perp BC_1',
      },
      {
        slovo:
          p.ot === 'A1'
            ? 'б) Равные наклонные — центр треугольника'
            : 'б) Объём тетраэдра двумя способами',
        formula: p.ot === 'A1' ? 'A_1G^2=\\frac{4a^2}{3}' : 'd=\\frac{3V}{S}=\\frac{a}{\\sqrt3}',
      },
      { slovo: 'Ответ', formula: otv },
    ],
    kontrol: { otvet: Math.sqrt(toNumber(ch.d2)) },
  };
}

export const Y15_KUB_DIAGONAL: Shablon2<PY15> = {
  no: 15,
  prototip:
    'Куб: диагональ перпендикулярна плоскости через концы трёх рёбер; расстояние от вершины до этой плоскости',
  sobrat,
};
