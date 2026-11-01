/**
 * №16 (варианты 11–12): log_x(bx − c) ⋚ 2, b = r₁ + r₂, c = r₁r₂,
 * 2 ≤ r₁ < r₂ — целые.
 *
 * ОДЗ: x > 0, x ≠ 1, bx − c > 0, то есть x > c/b; c/b = r₁r₂/(r₁ + r₂) > 1,
 * поэтому на ОДЗ x > 1 и логарифм с основанием x возрастает:
 * неравенство ⇔ bx − c ⋚ x² ⇔ x² − bx + c ⋛ 0.
 * «ge»: (x − r₁)(x − r₂) ≤ 0 ⇒ [r₁; r₂].
 * «le»: (x − r₁)(x − r₂) ≥ 0 ⇒ (c/b; r₁] ∪ [r₂; +∞).
 */

import { rat, ratTex, toNumber } from '@/lib/zadanie15/core/rational';
import { mnozhKontrol, mnozhPole, mnozhTex, type Kus } from './kMnozh';
import type { Chast2Zadacha, Shablon2 } from './types';

export interface PA16 {
  r1: number;
  r2: number;
  znak: 'le' | 'ge';
}

export function chislaA16(p: PA16) {
  if (!(p.r1 >= 2 && p.r1 < p.r2)) throw new Error('a16: параметры');
  const b = p.r1 + p.r2;
  const c = p.r1 * p.r2;
  const L = rat(c, b);
  const k = (v: number) => ({ tex: String(v), v });
  const kuski: Kus[] =
    p.znak === 'ge'
      ? [{ lo: k(p.r1), hi: k(p.r2), loZ: true, hiZ: true }]
      : [
          { lo: { tex: ratTex(L), v: toNumber(L) }, hi: k(p.r1), loZ: false, hiZ: true },
          { lo: k(p.r2), hi: null, loZ: true, hiZ: false },
        ];
  return { b, c, L, kuski };
}

function sobrat(p: PA16): Chast2Zadacha {
  const ch = chislaA16(p);
  const zn = p.znak === 'le' ? '\\le' : '\\ge';
  const obr = p.znak === 'le' ? '\\ge' : '\\le';
  const otv = mnozhTex(ch.kuski);
  const LT = ratTex(ch.L);
  return {
    no: 16,
    shablon: 'a16.logOsnovanieX',
    uslovie: `Решите неравенство $\\log_x(${ch.b}x-${ch.c})${zn}2$.`,
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
        title: 'Область допустимых значений',
        lines: [
          `Основание: $x>0$, $x\\ne1$; аргумент: $${ch.b}x-${ch.c}>0$, то есть $x>${LT}$.`,
          `Так как $${LT}>1$, на области допустимых значений $x>1$ — основание логарифма больше единицы.`,
        ],
      },
      {
        title: 'Переход к квадратному неравенству',
        lines: [
          `$2=\\log_x x^2$; при $x>1$ функция $y=\\log_x t$ возрастает, поэтому неравенство равносильно $${ch.b}x-${ch.c}${zn}x^2$, то есть $x^2-${ch.b}x+${ch.c}${obr}0$.`,
          `Корни трёхчлена: $${p.r1}$ и $${p.r2}$ (по теореме Виета). Решение: ${p.znak === 'ge' ? `$${p.r1}\\le x\\le${p.r2}$` : `$x\\le${p.r1}$ или $x\\ge${p.r2}$`}.`,
        ],
      },
      {
        title: 'С учётом области допустимых значений',
        lines: [`Пересекаем с $x>${LT}$: $${otv}$.`, `Ответ: $${otv}$.`],
      },
    ],
    razbor: [
      { slovo: 'Область допустимых значений', formula: `x>${LT}` },
      { slovo: 'Основание больше 1 — знак сохраняется', formula: `x^2-${ch.b}x+${ch.c}${obr}0` },
      { slovo: 'Корни трёхчлена', formula: `${p.r1};\\ ${p.r2}` },
      { slovo: 'Ответ', formula: otv },
    ],
    kontrol: { kuski: mnozhKontrol(ch.kuski), b: ch.b, c: ch.c },
  };
}

export const A16_LOG_OSNOVANIE_X: Shablon2<PA16> = {
  no: 16,
  prototip: 'Логарифмическое неравенство с переменным основанием: ОДЗ, переход к квадратному',
  sobrat,
};
