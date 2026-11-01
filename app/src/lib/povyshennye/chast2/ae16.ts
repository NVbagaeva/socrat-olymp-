/**
 * №16 (варианты 17–18): (x − r1)(x − r2)·√(x + a) ∨ 0.
 *
 * ОДЗ x ≥ −a; при x = −a произведение равно нулю и входит в ответ
 * нестрогого неравенства. На (−a; +∞) корень положителен, знак
 * определяет квадратный трёхчлен.
 */

import { kuskiPoTochkam } from './oMnozh';
import { mnozhKontrol, mnozhPole, mnozhTex } from './kMnozh';
import type { Chast2Zadacha, Shablon2 } from './types';

export interface PAE16 {
  r1: number;
  r2: number;
  a: number;
  znak: 'le' | 'ge';
}

export function chislaAE16(p: PAE16) {
  if (!(p.r1 < p.r2)) throw new Error('ae16: r1 < r2');
  const istina = (x: number) => {
    if (x < -p.a - 1e-12) return false;
    const v = (x - p.r1) * (x - p.r2) * Math.sqrt(Math.max(0, x + p.a));
    return p.znak === 'le' ? v <= 1e-12 : v >= -1e-12;
  };
  const kuski = kuskiPoTochkam(
    [p.r1, p.r2].map((v) => ({ v, tex: String(v) })),
    istina,
    { v: -p.a, tex: String(-p.a) },
    true,
  );
  return { kuski };
}

function sobrat(p: PAE16): Chast2Zadacha {
  const ch = chislaAE16(p);
  const S = p.r1 + p.r2;
  const P = p.r1 * p.r2;
  const tri = `x^2${S === 0 ? '' : S > 0 ? `-${S === 1 ? '' : S}x` : `+${-S === 1 ? '' : -S}x`}${P === 0 ? '' : P > 0 ? `+${P}` : `${P}`}`;
  const kor = `\\sqrt{x${p.a >= 0 ? '+' : ''}${p.a}}`;
  const zn = p.znak === 'le' ? '\\le' : '\\ge';
  const otv = mnozhTex(ch.kuski);
  return {
    no: 16,
    shablon: 'ae16.korenTrehchlen',
    uslovie: `Решите неравенство $\\left(${tri}\\right)${kor}${zn}0$.`,
    risunok: null,
    punkty: [
      {
        bukva: null,
        podpis: 'Множество решений',
        pole: { vid: 'promezhutki', verno: mnozhPole(ch.kuski) },
      },
    ],
    otvet: `$${otv}$`,
    reshenie: [
      {
        title: 'ОДЗ',
        lines: [`$x\\ge${-p.a}$. При $x=${-p.a}$ левая часть равна нулю, это решение.`],
      },
      {
        title: 'При $x>' + -p.a + '$',
        lines: [
          `Корень положителен, неравенство равносильно $${tri}${zn}0$, то есть $(x-${p.r1})(x-${p.r2})${zn}0$ (с учётом знаков у отрицательных чисел).`,
          `Решаем методом интервалов и пересекаем с лучом $x>${-p.a}$.`,
        ],
      },
      { title: 'Ответ', lines: [`$${otv}$.`] },
    ],
    razbor: [
      { slovo: 'ОДЗ и точка обнуления корня', formula: `x\\ge${-p.a}` },
      { slovo: 'Знак трёхчлена', formula: `(x-${p.r1})(x-${p.r2})` },
      { slovo: 'Пересечение с ОДЗ', formula: otv },
    ],
    kontrol: { kuski: mnozhKontrol(ch.kuski) },
  };
}

export const AE16_KOREN_TREHCHLEN: Shablon2<PAE16> = {
  no: 16,
  prototip: 'Неравенство: квадратный трёхчлен, умноженный на корень, — ОДЗ и метод интервалов',
  sobrat,
};
