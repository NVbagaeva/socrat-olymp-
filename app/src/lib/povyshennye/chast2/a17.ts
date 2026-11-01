/**
 * №17 (варианты 11–12): два объекта движутся к перекрёстку по
 * перпендикулярным дорогам. Первый — на расстоянии d₁ км со скоростью
 * v₁ км/ч, второй — d₂ км и v₂ км/ч (v₁² + v₂² = w², w — целое).
 *
 * ρ²(t) = (d₁ − v₁t)² + (d₂ − v₂t)² — квадратичная функция,
 * вершина t* = (d₁v₁ + d₂v₂)/w², ρ_min = |d₁v₂ − d₂v₁|/w.
 * Спрашивается ρ_min («rho») или t* в минутах («t»).
 */

import { rat, ratTex, toNumber, mul, div } from '@/lib/zadanie15/core/rational';
import type { Chast2Zadacha, Shablon2 } from './types';

const SYUZHETY = [
  ['Велосипедист', 'пешеход'],
  ['Автомобиль', 'автобус'],
  ['Катер', 'лодка'],
  ['Мотоциклист', 'велосипедист'],
] as const;

export interface PA17 {
  d1: number;
  v1: number;
  d2: number;
  v2: number;
  syuzhet: number;
  vopros: 'rho' | 't';
}

export function chislaA17(p: PA17) {
  const w2 = p.v1 * p.v1 + p.v2 * p.v2;
  const w = Math.round(Math.sqrt(w2));
  if (w * w !== w2) throw new Error('a17: скорости');
  const t = rat(p.d1 * p.v1 + p.d2 * p.v2, w2);
  const rho = rat(Math.abs(p.d1 * p.v2 - p.d2 * p.v1), w);
  if (toNumber(t) * p.v1 > p.d1 + 1e-9 && toNumber(t) * p.v2 > p.d2 + 1e-9)
    throw new Error('a17: оба проехали перекрёсток');
  if (rho.n === 0n) throw new Error('a17: встреча на перекрёстке');
  return { w, w2, t, rho };
}

function sobrat(p: PA17): Chast2Zadacha {
  const S = SYUZHETY[p.syuzhet];
  if (S === undefined) throw new Error('a17: сюжет');
  const ch = chislaA17(p);
  const tMin = mul(ch.t, rat(60));
  const otvR = p.vopros === 'rho' ? ch.rho : tMin;
  if (otvR.d !== 1n) throw new Error('a17: ответ не целый');
  const otv = ratTex(otvR);
  return {
    no: 17,
    shablon: 'a17.perekrestok',
    uslovie:
      `${S[0]} и ${S[1]} одновременно начинают двигаться к перекрёстку двух перпендикулярных дорог: первый находится на расстоянии $${p.d1}$ км от перекрёстка и движется со скоростью $${p.v1}$ км/ч, второй — на расстоянии $${p.d2}$ км и движется со скоростью $${p.v2}$ км/ч. ` +
      (p.vopros === 'rho'
        ? 'Каким будет наименьшее расстояние между ними (в километрах)?'
        : 'Через сколько минут после начала движения расстояние между ними будет наименьшим?'),
    risunok: null,
    punkty: [
      {
        bukva: null,
        podpis: p.vopros === 'rho' ? 'Расстояние, км' : 'Время, мин',
        pole: { vid: 'chislo', verno: otv },
      },
    ],
    otvet: `$${otv}$`,
    reshenie: [
      {
        title: 'Расстояние как функция времени',
        lines: [
          `Через $t$ ч первый находится на расстоянии $${p.d1}-${p.v1}t$ от перекрёстка, второй — $${p.d2}-${p.v2}t$ (знак показывает, с какой стороны перекрёстка). Дороги перпендикулярны, поэтому по теореме Пифагора $\\rho^2(t)=(${p.d1}-${p.v1}t)^2+(${p.d2}-${p.v2}t)^2$.`,
        ],
      },
      {
        title: 'Наименьшее значение',
        lines: [
          `$\\rho^2(t)=${ch.w2}t^2-${2 * (p.d1 * p.v1 + p.d2 * p.v2)}t+${p.d1 * p.d1 + p.d2 * p.d2}$ — парабола ветвями вверх, наименьшее значение в вершине $t^*=\\dfrac{${p.d1 * p.v1 + p.d2 * p.v2}}{${ch.w2}}=${ratTex(ch.t)}$ ч, то есть $${ratTex(tMin)}$ мин.`,
          `$\\rho(t^*)=\\sqrt{\\left(${p.d1}-${p.v1}\\cdot${ratTex(ch.t)}\\right)^2+\\left(${p.d2}-${p.v2}\\cdot${ratTex(ch.t)}\\right)^2}=${ratTex(ch.rho)}$ км.`,
        ],
      },
      { title: 'Ответ', lines: [`Ответ: $${otv}$.`] },
    ],
    razbor: [
      {
        slovo: 'Теорема Пифагора для положений',
        formula: `\\rho^2=(${p.d1}-${p.v1}t)^2+(${p.d2}-${p.v2}t)^2`,
      },
      { slovo: 'Вершина параболы', formula: `t^*=${ratTex(ch.t)}` },
      { slovo: 'Ответ', formula: otv },
    ],
    kontrol: { otvet: toNumber(otvR), t: toNumber(ch.t), rho: toNumber(div(ch.rho, rat(1))) },
  };
}

export const A17_PEREKRESTOK: Shablon2<PA17> = {
  no: 17,
  prototip:
    'Движение к перекрёстку по перпендикулярным дорогам: наименьшее расстояние и момент его достижения',
  sobrat,
};
