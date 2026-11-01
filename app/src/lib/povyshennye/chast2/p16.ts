/**
 * №16 (варианты 27–28): (√(x + p) − d) / (x² − q²) ⋚ 0.
 *
 * ОДЗ: x ≥ −p, x ≠ ±q. √(x + p) − d ≥ 0 ⇔ x ≥ d² − p (корень возрастает),
 * знак знаменателя — как у (x − q)(x + q). Метод интервалов на ОДЗ.
 */

import { kuskiKontrol, kuskiPole, kuskiTex, reshitZnaki, ZNAK_TEX, type Znak } from './nZnaki';
import type { Chast2Zadacha, Shablon2 } from './types';

export interface PP16 {
  p: number;
  d: number;
  q: number;
  znak: Znak;
}

export function chislaP16(p: PP16) {
  const x0 = p.d * p.d - p.p;
  const f = (x: number) => {
    if (x < -p.p - 1e-12) return Number.NaN;
    const den = x * x - p.q * p.q;
    if (Math.abs(den) < 1e-12) return Number.NaN;
    return (Math.sqrt(Math.max(0, x + p.p)) - p.d) / den;
  };
  const kuski = reshitZnaki(f, [-p.p, x0, -p.q, p.q], p.znak);
  return { x0, f, kuski };
}

const plus = (k: number) => (k === 0 ? '' : k > 0 ? `+${k}` : `${k}`);

function sobrat(p: PP16): Chast2Zadacha {
  if (p.d <= 0 || p.q <= 0) throw new Error('p16: параметры');
  const ch = chislaP16(p);
  if (ch.kuski.length === 0) throw new Error('p16: пустой ответ');
  const zn = ZNAK_TEX[p.znak];
  const ner = `\\dfrac{\\sqrt{x${plus(p.p)}}-${p.d}}{x^2-${p.q * p.q}}${zn}0`;
  const otv = kuskiTex(ch.kuski);
  const isk = [-p.q, p.q].filter((x) => x >= -p.p);
  const odz = `x\\ge ${-p.p}${isk.map((x) => `,\\ x\\ne ${x}`).join('')}`;
  return {
    no: 16,
    shablon: 'p16.korenDrob',
    uslovie: `Решите неравенство $${ner}$.`,
    risunok: null,
    punkty: [
      {
        bukva: null,
        podpis: 'Множество решений',
        pole: { vid: 'promezhutki', verno: kuskiPole(ch.kuski) },
      },
    ],
    otvet: `$${otv}$`,
    reshenie: [
      {
        title: 'ОДЗ',
        lines: [`Подкоренное выражение неотрицательно, знаменатель не равен нулю: $${odz}$.`],
      },
      {
        title: 'Знаки числителя и знаменателя',
        lines: [
          `Функция $y=\\sqrt{x${plus(p.p)}}$ возрастает, $\\sqrt{x${plus(p.p)}}=${p.d}$ при $x=${ch.x0}$. Поэтому числитель отрицателен при $${-p.p}\\le x<${ch.x0}$, равен нулю при $x=${ch.x0}$ и положителен при $x>${ch.x0}$.`,
          `Знаменатель $x^2-${p.q * p.q}=(x-${p.q})(x+${p.q})$ положителен при $|x|>${p.q}$ и отрицателен при $|x|<${p.q}$.`,
        ],
      },
      {
        title: 'Метод интервалов',
        lines: [
          `На ОДЗ отмечаем точки $${[...new Set([-p.p, ch.x0, ...isk])].sort((a, b) => a - b).join(';\\ ')}$ и в каждом промежутке перемножаем знаки числителя и знаменателя; точка $${ch.x0}$ ${p.znak === 'le' || p.znak === 'ge' ? 'входит в ответ (дробь равна нулю)' : 'не входит (неравенство строгое)'}${-p.p === ch.x0 ? '' : `, точка $${-p.p}$ проверяется подстановкой`}.`,
          `Ответ: $${otv}$.`,
        ],
      },
    ],
    razbor: [
      { slovo: 'ОДЗ', formula: odz },
      {
        slovo: 'Корень возрастает: знак числителя',
        formula: `\\sqrt{x${plus(p.p)}}-${p.d}\\ \\text{и}\\ x-${ch.x0}`,
      },
      { slovo: 'Знак знаменателя', formula: `(x-${p.q})(x+${p.q})` },
      { slovo: 'Ответ', formula: otv },
    ],
    kontrol: { kuski: kuskiKontrol(ch.kuski) },
  };
}

export const P16_KOREN_DROB: Shablon2<PP16> = {
  no: 16,
  prototip: 'Дробь (√(x + p) − d)/(x² − q²): ОДЗ, знак разности корня и числа, метод интервалов',
  sobrat,
};
