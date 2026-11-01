/**
 * №16 (варианты 9–10): log_{1/2}((x − r₁)(x − r₂)) ≥ −k, записанное
 * в виде log_{1/2}(x² − bx + c) ≥ −k.
 *
 * Основание 1/2 < 1, функция убывает: неравенство ⇔
 * 0 < x² − bx + c ≤ 2ᵏ. Первое: x < r₁ или x > r₂; второе:
 * s₁ ≤ x ≤ s₂ (корни x² − bx + c − 2ᵏ). Ответ: [s₁; r₁) ∪ (r₂; s₂].
 */

import { mnozhKontrol, mnozhPole, mnozhTex, type Kus } from './kMnozh';
import type { Chast2Zadacha, Shablon2 } from './types';

export interface PY16 {
  r1: number;
  r2: number;
  k: number;
}

const tri = (b: number, c: number) =>
  `x^2${b === 0 ? '' : b > 0 ? `-${b}x` : `+${-b}x`}${c === 0 ? '' : c > 0 ? `+${c}` : `-${-c}`}`;

export function chislaY16(p: PY16) {
  if (!(p.r1 < p.r2) || p.k < 1) throw new Error('y16: параметры');
  const b = p.r1 + p.r2;
  const c = p.r1 * p.r2;
  const K = 2 ** p.k;
  const D = b * b - 4 * (c - K);
  const m = Math.sqrt(D);
  if (!Number.isInteger(m)) throw new Error('y16: дискриминант');
  const s1 = (b - m) / 2;
  const s2 = (b + m) / 2;
  if (!Number.isInteger(s1)) throw new Error('y16: корни не целые');
  const k = (v: number) => ({ tex: String(v), v });
  const kuski: Kus[] = [
    { lo: k(s1), hi: k(p.r1), loZ: true, hiZ: false },
    { lo: k(p.r2), hi: k(s2), loZ: false, hiZ: true },
  ];
  return { b, c, K, s1, s2, kuski };
}

function sobrat(p: PY16): Chast2Zadacha {
  const ch = chislaY16(p);
  const T = tri(ch.b, ch.c);
  const otv = mnozhTex(ch.kuski);
  return {
    no: 16,
    shablon: 'y16.logPolovina',
    uslovie: `Решите неравенство $\\log_{\\frac12}\\left(${T}\\right)\\ge -${p.k}$.`,
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
        title: 'Переход к системе',
        lines: [
          `$-${p.k}=\\log_{\\frac12}${ch.K}$. Основание $\\dfrac12<1$, функция $y=\\log_{\\frac12}t$ убывает, поэтому неравенство равносильно системе $0<${T}\\le ${ch.K}$ (первое неравенство — область допустимых значений).`,
        ],
      },
      {
        title: 'Решаем каждое неравенство',
        lines: [
          `$${T}>0$: корни $${p.r1}$ и $${p.r2}$, решение $x<${p.r1}$ или $x>${p.r2}$.`,
          `$${tri(ch.b, ch.c - ch.K)}\\le0$: корни $${ch.s1}$ и $${ch.s2}$, решение $${ch.s1}\\le x\\le ${ch.s2}$.`,
        ],
      },
      {
        title: 'Пересечение',
        lines: [`Отмечаем на прямой обе системы промежутков: $${otv}$.`, `Ответ: $${otv}$.`],
      },
    ],
    razbor: [
      { slovo: 'Основание меньше 1 — знак меняется', formula: `0<${T}\\le${ch.K}` },
      { slovo: 'Область допустимых значений', formula: `x<${p.r1}\\ \\text{или}\\ x>${p.r2}` },
      { slovo: 'Второе неравенство', formula: `${ch.s1}\\le x\\le${ch.s2}` },
      { slovo: 'Ответ', formula: otv },
    ],
    kontrol: { kuski: mnozhKontrol(ch.kuski), b: ch.b, c: ch.c },
  };
}

export const Y16_LOG_POLOVINA: Shablon2<PY16> = {
  no: 16,
  prototip: 'Логарифмическое неравенство с основанием меньше 1: система с ОДЗ, два промежутка',
  sobrat,
};
