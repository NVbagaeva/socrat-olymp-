/**
 * №19 (варианты 29–30): система { x² + y² = R²; y = √(x + a) }, R ≥ 1.
 *
 * y ≥ 0, x = y² − a; u = y² ≥ 0: (u − a)² + u = R², то есть
 * u² − (2a − 1)u + a² − R² = 0. Каждому корню u ≥ 0 — одно решение (x; y).
 * D = 4R² + 1 − 4a.
 *   ровно два: два различных корня u ≥ 0 — D > 0, u₁u₂ = a² − R² ≥ 0,
 *     u₁ + u₂ = 2a − 1 > 0 ⇒ a ∈ [R; R² + 1/4);
 *   ровно одно: u₁u₂ < 0 (|a| < R), или a = −R (корни 0 и −2R − 1),
 *     или D = 0 (a = R² + 1/4, u = R² − 1/4 > 0) ⇒ a ∈ [−R; R) ∪ {R² + 1/4}.
 */

import type { Kusok, Mnozhestvo } from '@/lib/chast2/sravnenie';
import { add, mul, neg, rat, ratTex, toNumber, type Rat } from '@/lib/zadanie15/core/rational';
import { ratDecTex } from './tex';
import type { Chast2Zadacha, Shablon2 } from './types';

export interface PQ19 {
  /** R = Rn/Rd. */
  Rn: number;
  Rd: number;
  N: 1 | 2;
}

export function chislaQ19(p: PQ19) {
  const R = rat(p.Rn, p.Rd);
  if (toNumber(R) < 1) throw new Error('q19: R < 1');
  const top = add(mul(R, R), rat(1, 4));
  return { R, top };
}

/** Число решений при данном a — формулой по корням u (для контроля). */
export function chisloQ19(a: number, R: number): number {
  const D = 4 * R * R + 1 - 4 * a;
  if (D < -1e-12) return 0;
  const s = 2 * a - 1;
  if (Math.abs(D) <= 1e-12) return s / 2 >= -1e-12 ? 1 : 0;
  const r1 = (s - Math.sqrt(D)) / 2;
  const r2 = (s + Math.sqrt(D)) / 2;
  return [r1, r2].filter((u) => u >= -1e-12).length;
}

function sobrat(p: PQ19): Chast2Zadacha {
  const ch = chislaQ19(p);
  const RT = ratDecTex(ch.R);
  const topT = ratDecTex(ch.top);
  const mR = ratDecTex(neg(ch.R));
  const t = (x: Rat) => ratDecTex(x).replace(/\\dfrac/g, '\\frac');
  const kuski: Kusok[] =
    p.N === 2
      ? [{ t: 'interval', lo: t(ch.R), loZakr: true, hi: t(ch.top), hiZakr: false }]
      : [
          { t: 'interval', lo: t(neg(ch.R)), loZakr: true, hi: t(ch.R), hiZakr: false },
          { t: 'tochka', x: t(ch.top) },
        ];
  const pole: Mnozhestvo = { kuski };
  const otv =
    p.N === 2
      ? `\\left[${RT};\\ ${topT}\\right)`
      : `\\left[${mR};\\ ${RT}\\right)\\cup\\left\\{${topT}\\right\\}`;
  const R2T = ratTex(mul(ch.R, ch.R));
  const sistema = `\\begin{cases}x^2+y^2=${R2T},\\\\ y=\\sqrt{x+a}\\end{cases}`;
  return {
    no: 19,
    shablon: 'q19.okrKoren',
    uslovie: `Найдите все значения $a$, при каждом из которых система уравнений\n$${sistema}$\nимеет ${p.N === 2 ? 'ровно два решения' : 'ровно одно решение'}.`,
    risunok: null,
    punkty: [
      { bukva: null, podpis: 'Множество значений $a$', pole: { vid: 'promezhutki', verno: pole } },
    ],
    otvet: `$${otv}$`,
    reshenie: [
      {
        title: 'Сведение к квадратному уравнению',
        lines: [
          `Второе уравнение: $y\\ge0$ и $x=y^2-a$. Подставим в первое и обозначим $u=y^2\\ge0$: $(u-a)^2+u=${R2T}$, то есть $u^2-(2a-1)u+a^2-${R2T}=0$.`,
          `Каждому корню $u\\ge0$ соответствует ровно одно решение системы: $y=\\sqrt u$, $x=u-a$ (и $x+a=u\\ge0$). Поэтому число решений системы равно числу неотрицательных корней этого уравнения.`,
        ],
      },
      {
        title: 'Корни по теореме Виета',
        lines: [
          `$D=(2a-1)^2-4\\left(a^2-${R2T}\\right)=${ratTex(add(mul(rat(4), mul(ch.R, ch.R)), rat(1)))}-4a$, $u_1u_2=a^2-${R2T}$, $u_1+u_2=2a-1$.`,
          `При $|a|<${RT}$ произведение отрицательно — один положительный корень (одно решение). При $a=-${RT}$ корни $0$ и $-2\\cdot${RT}-1<0$ — одно решение. При $a<-${RT}$ оба корня отрицательны (сумма отрицательна, произведение положительно) — решений нет.`,
          `При $a\\ge ${RT}$ сумма корней $2a-1>0$, произведение неотрицательно: при $D>0$, то есть $a<${topT}$, — два различных неотрицательных корня (два решения); при $a=${topT}$ — один корень $u=${ratDecTex(add(mul(ch.R, ch.R), rat(-1, 4)))}>0$ (одно решение); при $a>${topT}$ — корней нет.`,
        ],
      },
      { title: 'Ответ', lines: [`Ответ: $${otv}$.`] },
    ],
    razbor: [
      { slovo: 'Замена $u=y^2\\ge0$', formula: `u^2-(2a-1)u+a^2-${R2T}=0` },
      { slovo: 'Число решений — число корней $u\\ge0$', formula: 'u_1u_2=a^2-R^2,\\ u_1+u_2=2a-1' },
      { slovo: 'Граница по дискриминанту', formula: `a=${topT}` },
      { slovo: 'Ответ', formula: otv },
    ],
    kontrol: { R: toNumber(ch.R), top: toNumber(ch.top), N: p.N },
  };
}

export const Q19_OKR_KOREN: Shablon2<PQ19> = {
  no: 19,
  prototip:
    'Параметр: окружность и полупарабола y = √(x + a); число решений по корням квадратного уравнения относительно y²',
  sobrat,
};
