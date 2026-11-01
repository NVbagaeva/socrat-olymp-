/**
 * №17 (варианты 25–26): концентрация вещества в крови после приёма
 * C(t) = C₀·(2^{−t/T₁} − 2^{−t/T₂}), T₁ = r·T₂ (r = 2, 4, 8).
 *
 * C′(t) = C₀ ln2·(−2^{−t/T₁}/T₁ + 2^{−t/T₂}/T₂) = 0 ⇔ 2^{t(1/T₂ − 1/T₁)} = T₁/T₂ = r,
 * t* = log₂r / (1/T₂ − 1/T₁) = T₂·r·log₂r/(r − 1); производная меняет знак
 * с «+» на «−» — максимум.
 */

import type { Chast2Zadacha, Shablon2 } from './types';

const SYUZHETY = [
  { chto: 'таблетки жаропонижающего', veshch: 'действующего вещества' },
  { chto: 'капсулы антибиотика', veshch: 'антибиотика' },
  { chto: 'сиропа от кашля', veshch: 'действующего вещества' },
  { chto: 'таблетки витамина', veshch: 'витамина' },
  { chto: 'противоаллергической таблетки', veshch: 'действующего вещества' },
  { chto: 'обезболивающей таблетки', veshch: 'обезболивающего' },
] as const;

export interface PN17 {
  /** Период полувсасывания T₂, ч. */
  T2: number;
  /** T₁ = r·T₂. */
  r: 2 | 4 | 8;
  syuzhet: number;
}

export function chislaN17(p: PN17) {
  const T1 = p.r * p.T2;
  const lg = Math.log2(p.r);
  const t = (p.T2 * p.r * lg) / (p.r - 1);
  return { T1, lg, t };
}

function sobrat(p: PN17): Chast2Zadacha {
  const S = SYUZHETY[p.syuzhet];
  if (S === undefined) throw new Error('n17: сюжет');
  const ch = chislaN17(p);
  if (!Number.isInteger(ch.t)) throw new Error('n17: время не целое');
  const C = `C(t)=C_0\\left(2^{-\\frac{t}{T_1}}-2^{-\\frac{t}{T_2}}\\right)`;
  const uslovie =
    `После приёма ${S.chto} концентрация ${S.veshch} в крови меняется по закону\n` +
    `$\\displaystyle ${C},$\n` +
    `где $t$ — время после приёма (в часах), $C_0>0$ — постоянная, $T_1$ — период полувыведения, $T_2$ — период полувсасывания вещества ($T_2<T_1$). ` +
    `Через сколько часов после приёма концентрация будет наибольшей, если $T_1=${ch.T1}$ ч, $T_2=${p.T2}$ ч?`;
  const raz = `\\dfrac{1}{${p.T2}}-\\dfrac{1}{${ch.T1}}=\\dfrac{${p.r - 1}}{${ch.T1}}`;
  return {
    no: 17,
    shablon: 'n17.koncentraciya',
    uslovie,
    risunok: null,
    punkty: [{ bukva: null, podpis: 'Время $t$, ч', pole: { vid: 'chislo', verno: String(ch.t) } }],
    otvet: `$t=${ch.t}$ ч`,
    reshenie: [
      {
        title: 'Производная',
        lines: [
          `$(2^{kt})'=k\\ln2\\cdot 2^{kt}$, поэтому $C'(t)=C_0\\ln2\\left(\\dfrac{2^{-\\frac{t}{T_2}}}{T_2}-\\dfrac{2^{-\\frac{t}{T_1}}}{T_1}\\right)$.`,
        ],
      },
      {
        title: 'Нуль производной',
        lines: [
          `$C'(t)=0\\iff \\dfrac{2^{-\\frac{t}{T_2}}}{T_2}=\\dfrac{2^{-\\frac{t}{T_1}}}{T_1}\\iff 2^{t\\left(\\frac1{T_2}-\\frac1{T_1}\\right)}=\\dfrac{T_1}{T_2}=${p.r}$.`,
          `$${raz}$, поэтому $\\dfrac{${p.r - 1}t}{${ch.T1}}=\\log_2${p.r}=${ch.lg}$ и $t=\\dfrac{${ch.T1}\\cdot ${ch.lg}}{${p.r - 1}}=${ch.t}$.`,
        ],
      },
      {
        title: 'Максимум',
        lines: [
          `При $0<t<${ch.t}$ левая часть $2^{t\\left(\\frac1{T_2}-\\frac1{T_1}\\right)}$ меньше $${p.r}$ и $C'(t)>0$, при $t>${ch.t}$ — больше и $C'(t)<0$: функция возрастает, затем убывает, $t=${ch.t}$ — точка максимума.`,
          `Ответ: через $${ch.t}$ ч.`,
        ],
      },
    ],
    razbor: [
      { slovo: 'Производная показательной функции', formula: `(2^{kt})'=k\\ln2\\cdot2^{kt}` },
      { slovo: "Уравнение $C'(t)=0$", formula: `2^{\\frac{${p.r - 1}t}{${ch.T1}}}=${p.r}` },
      { slovo: 'Смена знака производной: максимум', formula: `t=${ch.t}` },
    ],
    kontrol: { t: ch.t, T1: ch.T1, T2: p.T2 },
  };
}

export const N17_KONCENTRACIYA: Shablon2<PN17> = {
  no: 17,
  prototip:
    'Концентрация вещества в крови — разность двух показательных функций; момент наибольшей концентрации',
  sobrat,
};
