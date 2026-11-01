/**
 * №17 (варианты 31–36), свои задачи раздела: наибольшее или наименьшее
 * значение функции в прикладной задаче. Три сюжета:
 *   korobka  — из листа a × b вырезают по углам квадраты x и сгибают
 *              коробку без крышки: V(x) = x(a − 2x)(b − 2x);
 *              x* = ((a + b) − √(a² − ab + b²))/6;
 *   pribyl   — цена p, спрос A − p², себестоимость c:
 *              П(p) = (p − c)(A − p²), p* = (c + √(c² + 3A))/3;
 *   marshrut — по шоссе со скоростью v₁, по полю v₂ < v₁; пункт в поле
 *              на расстоянии d от шоссе и L вдоль него:
 *              T(x) = (L − x)/v₁ + √(x² + d²)/v₂, x* = d·v₂/√(v₁² − v₂²).
 * Числа подобраны так, что корни — рациональные.
 */

import { add, div, mul, rat, ratTex, sub, toNumber, type Rat } from '@/lib/zadanie15/core/rational';
import type { Chast2Zadacha, Shablon2 } from './types';

export type PR17 =
  | { vid: 'korobka'; a: number; b: number; vopros: 'x' | 'V' }
  | { vid: 'pribyl'; A: number; c: number; vopros: 'p' | 'P' }
  | { vid: 'marshrut'; v1: number; v2: number; d: number; L: number; vopros: 'T' | 'AC' };

function isqrt(n: number): number {
  const r = Math.round(Math.sqrt(n));
  if (r * r !== n) throw new Error(`r17: ${n} — не квадрат`);
  return r;
}

export function chislaR17(p: PR17) {
  if (p.vid === 'korobka') {
    if (p.b > p.a) throw new Error('r17: a ≥ b');
    const D = p.a * p.a - p.a * p.b + p.b * p.b;
    const s = isqrt(D);
    const x = rat(p.a + p.b - s, 6);
    const x2 = rat(p.a + p.b + s, 6);
    if (!(toNumber(x) > 0 && toNumber(x) < p.b / 2)) throw new Error('r17: x вне (0; b/2)');
    const V = mul(x, mul(sub(rat(p.a), mul(rat(2), x)), sub(rat(p.b), mul(rat(2), x))));
    return { x, x2, V, s, otv: p.vopros === 'x' ? x : V };
  }
  if (p.vid === 'pribyl') {
    const s = isqrt(p.c * p.c + 3 * p.A);
    const pz = rat(p.c + s, 3);
    if (!(toNumber(pz) > p.c && toNumber(pz) ** 2 < p.A)) throw new Error('r17: p* вне области');
    const P = mul(sub(pz, rat(p.c)), sub(rat(p.A), mul(pz, pz)));
    return { pz, P, s, otv: p.vopros === 'p' ? pz : P };
  }
  if (!(p.v2 < p.v1)) throw new Error('r17: v2 < v1');
  const w = isqrt(p.v1 * p.v1 - p.v2 * p.v2);
  const x = rat(p.d * p.v2, w);
  if (!(toNumber(x) < p.L)) throw new Error('r17: x > L');
  /* T* = L/v₁ + d·w/(v₁v₂). */
  const T = add(rat(p.L, p.v1), rat(p.d * w, p.v1 * p.v2));
  const AC = sub(rat(p.L), x);
  return { w, x, T, AC, otv: p.vopros === 'T' ? T : AC };
}

function sobrat(p: PR17): Chast2Zadacha {
  const ch = chislaR17(p);
  let uslovie = '';
  let reshenie: Chast2Zadacha['reshenie'] = [];
  let razbor: Chast2Zadacha['razbor'] = [];
  let edinica = '';
  if (p.vid === 'korobka') {
    const c = ch as { x: Rat; x2: Rat; V: Rat; s: number };
    const kv = p.a === p.b;
    uslovie = `Из ${kv ? `квадратного листа картона со стороной ${p.a} дм` : `прямоугольного листа картона размером ${p.a} дм на ${p.b} дм`} вырезают по углам одинаковые квадраты и из оставшейся части сгибают коробку без крышки. ${p.vopros === 'x' ? 'Какой должна быть сторона вырезаемых квадратов (в дециметрах), чтобы объём коробки был наибольшим?' : 'Найдите наибольший возможный объём такой коробки (в кубических дециметрах).'}`;
    edinica = p.vopros === 'x' ? 'дм' : 'дм³';
    const S = p.a + p.b;
    reshenie = [
      {
        title: 'Функция',
        lines: [
          `Пусть сторона вырезаемого квадрата равна $x$ дм, $0<x<${ratTex(rat(p.b, 2))}$. Коробка имеет высоту $x$ и дно $(${p.a}-2x)\\times(${p.b}-2x)$: $V(x)=x(${p.a}-2x)(${p.b}-2x)=4x^3-${2 * S}x^2+${p.a * p.b}x$.`,
        ],
      },
      {
        title: 'Производная',
        lines: [
          `$V'(x)=12x^2-${4 * S}x+${p.a * p.b}=0$, $3x^2-${S}x+${ratTex(rat(p.a * p.b, 4))}=0$: $x=\\dfrac{${S}\\pm${c.s}}{6}$, то есть $x=${ratTex(c.x)}$ или $x=${ratTex(c.x2)}$.`,
          `Второй корень не меньше $${ratTex(rat(p.b, 2))}$ — вне области. На $\\left(0;\\ ${ratTex(c.x)}\\right)$ производная положительна, на $\\left(${ratTex(c.x)};\\ ${ratTex(rat(p.b, 2))}\\right)$ — отрицательна: $x=${ratTex(c.x)}$ — точка максимума.`,
        ],
      },
      {
        title: 'Ответ',
        lines: [
          p.vopros === 'x'
            ? `Сторона квадрата $${ratTex(c.x)}$ дм.`
            : `$V\\left(${ratTex(c.x)}\\right)=${ratTex(c.x)}\\cdot${ratTex(sub(rat(p.a), mul(rat(2), c.x)))}\\cdot${ratTex(sub(rat(p.b), mul(rat(2), c.x)))}=${ratTex(c.V)}$ дм³.`,
        ],
      },
    ];
    razbor = [
      { slovo: 'Объём как функция $x$', formula: `V(x)=x(${p.a}-2x)(${p.b}-2x)` },
      { slovo: 'Нули производной', formula: `x=${ratTex(c.x)}` },
      {
        slovo: 'Знак производной — максимум',
        formula: `V'>0\\ \\text{слева},\\ V'<0\\ \\text{справа}`,
      },
      { slovo: 'Ответ', formula: ratTex(ch.otv) },
    ];
  } else if (p.vid === 'pribyl') {
    const c = ch as { pz: Rat; P: Rat; s: number };
    uslovie = `Фирма продаёт товар по цене $p$ тыс. рублей за единицу. При такой цене за месяц продаётся $q=${p.A}-p^2$ единиц товара. Себестоимость единицы товара равна ${p.c} тыс. рублей. ${p.vopros === 'p' ? 'При какой цене (в тыс. рублей) месячная прибыль фирмы будет наибольшей?' : 'Найдите наибольшую возможную месячную прибыль фирмы (в тыс. рублей).'}`;
    edinica = 'тыс. руб.';
    reshenie = [
      {
        title: 'Функция',
        lines: [
          `Прибыль — выручка минус затраты: $\\Pi(p)=(p-${p.c})(${p.A}-p^2)$. Прибыль положительна при $${p.c}<p<\\sqrt{${p.A}}$.`,
        ],
      },
      {
        title: 'Производная',
        lines: [
          `$\\Pi'(p)=(${p.A}-p^2)-2p(p-${p.c})=-3p^2+${2 * p.c}p+${p.A}$. Корни: $p=\\dfrac{${p.c}\\pm\\sqrt{${p.c * p.c}+${3 * p.A}}}{3}=\\dfrac{${p.c}\\pm${c.s}}{3}$; положительный — $p=${ratTex(c.pz)}$.`,
          `Производная меняет знак с плюса на минус: $p=${ratTex(c.pz)}$ — точка максимума.`,
        ],
      },
      {
        title: 'Ответ',
        lines: [
          p.vopros === 'p'
            ? `Цена $${ratTex(c.pz)}$ тыс. рублей.`
            : `$\\Pi\\left(${ratTex(c.pz)}\\right)=${ratTex(sub(c.pz, rat(p.c)))}\\cdot${ratTex(sub(rat(p.A), mul(c.pz, c.pz)))}=${ratTex(c.P)}$ тыс. рублей.`,
        ],
      },
    ];
    razbor = [
      { slovo: 'Прибыль как функция цены', formula: `\\Pi(p)=(p-${p.c})(${p.A}-p^2)` },
      { slovo: 'Нуль производной', formula: `p=${ratTex(c.pz)}` },
      { slovo: 'Знак производной — максимум', formula: `\\Pi'>0\\ \\to\\ \\Pi'<0` },
      { slovo: 'Ответ', formula: ratTex(ch.otv) },
    ];
  } else {
    const c = ch as { w: number; x: Rat; T: Rat; AC: Rat };
    uslovie = `Пункт $A$ стоит на прямом шоссе, пункт $B$ — в поле на расстоянии ${p.d} км от шоссе. Основание перпендикуляра из $B$ на шоссе — точка $H$, $AH=${p.L}$ км. Курьер едет от $A$ по шоссе со скоростью ${p.v1} км/ч до некоторой точки $C$ отрезка $AH$, а затем по полю прямо к $B$ со скоростью ${p.v2} км/ч. ${p.vopros === 'T' ? 'Найдите наименьшее время (в часах), за которое курьер может добраться из $A$ в $B$.' : 'На каком расстоянии от $A$ (в км) курьеру нужно свернуть с шоссе, чтобы добраться быстрее всего?'}`;
    edinica = p.vopros === 'T' ? 'ч' : 'км';
    reshenie = [
      {
        title: 'Функция',
        lines: [
          `Пусть $CH=x$, $0\\le x\\le${p.L}$. По шоссе курьер проезжает $${p.L}-x$ км, по полю — $CB=\\sqrt{x^2+${p.d * p.d}}$ км (по теореме Пифагора): $T(x)=\\dfrac{${p.L}-x}{${p.v1}}+\\dfrac{\\sqrt{x^2+${p.d * p.d}}}{${p.v2}}$.`,
        ],
      },
      {
        title: 'Производная',
        lines: [
          `$T'(x)=-\\dfrac{1}{${p.v1}}+\\dfrac{x}{${p.v2}\\sqrt{x^2+${p.d * p.d}}}=0\\Leftrightarrow ${p.v1}x=${p.v2}\\sqrt{x^2+${p.d * p.d}}\\Leftrightarrow ${p.v1 * p.v1 - p.v2 * p.v2}x^2=${p.v2 * p.v2 * p.d * p.d}$, $x=${ratTex(c.x)}$.`,
          `При $x<${ratTex(c.x)}$ производная отрицательна, при $x>${ratTex(c.x)}$ — положительна: $x=${ratTex(c.x)}$ — точка минимума на $[0;\\ ${p.L}]$.`,
        ],
      },
      {
        title: 'Ответ',
        lines: [
          p.vopros === 'T'
            ? `$CB=\\sqrt{${ratTex(mul(c.x, c.x))}+${p.d * p.d}}=${ratTex(div(rat(p.d * p.v1), rat(c.w)))}$, $T=\\dfrac{${ratTex(c.AC)}}{${p.v1}}+\\dfrac{${ratTex(div(rat(p.d * p.v1), rat(c.w)))}}{${p.v2}}=${ratTex(c.T)}$ ч.`
            : `$AC=${p.L}-${ratTex(c.x)}=${ratTex(c.AC)}$ км.`,
        ],
      },
    ];
    razbor = [
      {
        slovo: 'Время как функция $x$',
        formula: `T(x)=\\frac{${p.L}-x}{${p.v1}}+\\frac{\\sqrt{x^2+${p.d * p.d}}}{${p.v2}}`,
      },
      { slovo: 'Нуль производной', formula: `x=${ratTex(c.x)}` },
      { slovo: 'Знак производной — минимум', formula: `T'<0\\ \\to\\ T'>0` },
      { slovo: 'Ответ', formula: ratTex(ch.otv) },
    ];
  }
  const otvT = ratTex(ch.otv).replace(/\\dfrac/g, '\\frac');
  return {
    no: 17,
    shablon: 'r17.ekstremum',
    uslovie,
    risunok: null,
    punkty: [{ bukva: null, podpis: `Ответ, ${edinica}`, pole: { vid: 'chislo', verno: otvT } }],
    otvet: `$${ratTex(ch.otv)}$`,
    reshenie,
    razbor,
    kontrol: { otv: toNumber(ch.otv) },
  };
}

export const R17_EKSTREMUM: Shablon2<PR17> = {
  no: 17,
  prototip:
    'Прикладная задача на наибольшее или наименьшее значение: коробка из листа, прибыль при спросе A − p², маршрут по шоссе и полю',
  sobrat,
};
