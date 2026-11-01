/**
 * №19 (варианты 21–22): площадь фигуры между «корытом» и прямой y = a.
 *
 * y = |x − b| + |x + b| равно 2b на [−b; b] и 2|x| вне его. При a > 2b
 * прямая y = a отсекает трапецию: основания 2b и a, высота a − 2b,
 * S(a) = (a² − 4b²)/2, возрастает. При a ≤ 2b ограниченной фигуры
 * положительной площади нет.
 * Условие S1 ∨ S(a) ∨ S2 ⇔ a² в промежутке [4b² + 2S1; 4b² + 2S2], a > 2b.
 */

import { add, rat, toNumber } from '@/lib/zadanie15/core/rational';
import { sqrtRat, surdTex, surdToNumber } from '@/lib/zadanie15/core/surd';
import { mnozhKontrol, mnozhPole, mnozhTex, type Kus } from './kMnozh';
import type { Chast2Zadacha, Shablon2 } from './types';

export interface PL19 {
  b: number;
  S1: number;
  S2: number;
  /** Нижняя граница: «не меньше» (ge) или «больше» (gt); верхняя — «меньше» (lt) или «не больше» (le). */
  n1: 'ge' | 'gt';
  n2: 'lt' | 'le';
}

export function chislaL19(p: PL19) {
  if (!(0 < p.S1 && p.S1 < p.S2)) throw new Error('l19: площади');
  const lo2 = add(rat(4 * p.b * p.b), rat(2 * p.S1));
  const hi2 = add(rat(4 * p.b * p.b), rat(2 * p.S2));
  const lo = sqrtRat(lo2);
  const hi = sqrtRat(hi2);
  const kuski: Kus[] = [
    {
      lo: { tex: surdTex(lo), v: surdToNumber(lo) },
      hi: { tex: surdTex(hi), v: surdToNumber(hi) },
      loZ: p.n1 === 'ge',
      hiZ: p.n2 === 'le',
    },
  ];
  return { lo2, hi2, kuski };
}

function sobrat(p: PL19): Chast2Zadacha {
  const ch = chislaL19(p);
  const otv = mnozhTex(ch.kuski);
  const sl1 = p.n1 === 'ge' ? 'не меньше' : 'больше';
  const sl2 = p.n2 === 'lt' ? 'меньше' : 'не больше';
  const z1 = p.n1 === 'ge' ? '\\ge' : '>';
  const z2 = p.n2 === 'lt' ? '<' : '\\le';
  return {
    no: 19,
    shablon: 'l19.koryto',
    uslovie: `Найдите все значения $a$, при каждом из которых площадь фигуры, ограниченной графиком функции $y=|x-${p.b}|+|x+${p.b}|$ и прямой $y=a$, ${sl1} ${p.S1}, но ${sl2} ${p.S2}.`,
    risunok: null,
    punkty: [
      {
        bukva: null,
        podpis: 'Значения $a$',
        pole: { vid: 'promezhutki', verno: mnozhPole(ch.kuski) },
      },
    ],
    otvet: `$${otv}$`,
    reshenie: [
      {
        title: 'График функции',
        lines: [
          `При $|x|\\le ${p.b}$: $y=(${p.b}-x)+(x+${p.b})=${2 * p.b}$. При $x>${p.b}$: $y=2x$, при $x<-${p.b}$: $y=-2x$.`,
          `График — «корыто»: горизонтальный отрезок на высоте $${2 * p.b}$ и два луча $y=2|x|$.`,
        ],
      },
      {
        title: 'Площадь фигуры',
        lines: [
          `При $a\\le${2 * p.b}$ прямая $y=a$ не отсекает фигуры положительной площади. При $a>${2 * p.b}$ фигура — трапеция с основаниями $${2 * p.b}$ (дно) и $a$ (отрезок прямой $y=a$ между лучами, $x=\\pm\\dfrac a2$) и высотой $a-${2 * p.b}$.`,
          `$S(a)=\\dfrac{${2 * p.b}+a}{2}\\cdot(a-${2 * p.b})=\\dfrac{a^2-${4 * p.b * p.b}}{2}$ — функция возрастает при $a>${2 * p.b}$.`,
        ],
      },
      {
        title: 'Условие на площадь',
        lines: [
          `$S(a)${z1}${p.S1}$: $\\dfrac{a^2-${4 * p.b * p.b}}{2}${z1}${p.S1}\\iff a^2${z1}${toNumber(ch.lo2)}$; $\\dfrac{a^2-${4 * p.b * p.b}}{2}${z2}${p.S2}\\iff a^2${z2}${toNumber(ch.hi2)}$.`,
          `С учётом $a>${2 * p.b}$: $a\\in${otv}$.`,
          `Ответ: $${otv}$.`,
        ],
      },
    ],
    razbor: [
      {
        slovo: 'Раскрываем модули',
        formula: `y=${2 * p.b}\\ \\text{при}\\ |x|\\le${p.b},\\ y=2|x|\\ \\text{иначе}`,
      },
      { slovo: 'Площадь трапеции', formula: `S=\\frac{a^2-${4 * p.b * p.b}}{2},\\ a>${2 * p.b}` },
      {
        slovo: 'Двойное неравенство для площади',
        formula: `${toNumber(ch.lo2)}${z1 === '>' ? '<' : '\\le'}a^2${z2}${toNumber(ch.hi2)}`,
      },
      { slovo: 'Ответ', formula: otv },
    ],
    kontrol: { kuski: mnozhKontrol(ch.kuski), b: p.b },
  };
}

export const L19_KORYTO: Shablon2<PL19> = {
  no: 19,
  prototip:
    'Параметр: площадь фигуры между графиком y = |x − b| + |x + b| и прямой y = a в заданных границах',
  sobrat,
};
