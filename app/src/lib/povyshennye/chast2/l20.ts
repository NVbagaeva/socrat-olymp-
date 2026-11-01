/**
 * №20 (варианты 21–22): фишка на числовой прямой, ходы +a и −b.
 *
 * Фишка в точке 0; за ход её сдвигают на a вправо или на b влево
 * (a, b взаимно просты). После x ходов вправо и y влево она в точке
 * ax − by.
 * а) Можно ли за N ходов оказаться в точке T1: x = (T1 + bN)/(a + b) —
 *    целое из [0; N].
 * б) Наименьшее число ходов до точки T2: min (x + y) при ax − by = T2.
 * в) То же для точки T3, если два хода подряд в одну сторону делать
 *    нельзя: ходы чередуются, после k ходов фишка в точке
 *    ⌊k/2⌋(a − b) + (a или −b при нечётном k, в зависимости от первого хода).
 */

import type { Chast2Zadacha, Shablon2 } from './types';

export interface PL20 {
  a: number;
  b: number;
  N: number;
  T1: number;
  T2: number;
  T3: number;
}

export function chislaL20(p: PL20) {
  const xA = (p.T1 + p.b * p.N) / (p.a + p.b);
  const daA = Number.isInteger(xA) && xA >= 0 && xA <= p.N;
  /* б) перебор числа ходов вправо. */
  let best: { x: number; y: number } | null = null;
  for (let x = 0; x <= 1000; x += 1) {
    const r = p.a * x - p.T2;
    if (r < 0 || r % p.b !== 0) continue;
    const y = r / p.b;
    if (best === null || x + y < best.x + best.y) best = { x, y };
  }
  if (best === null) throw new Error('l20: б) недостижимо');
  /* в) чередование: позиции после k ходов при старте вправо / влево. */
  const poz = (k: number, pervyyVpravo: boolean) =>
    Math.floor(k / 2) * (p.a - p.b) + (k % 2 === 1 ? (pervyyVpravo ? p.a : -p.b) : 0);
  let kV: { k: number; vpravo: boolean } | null = null;
  for (let k = 1; k <= 2000 && kV === null; k += 1) {
    if (poz(k, true) === p.T3) kV = { k, vpravo: true };
    else if (poz(k, false) === p.T3) kV = { k, vpravo: false };
  }
  if (kV === null) throw new Error('l20: в) недостижимо');
  return { xA, daA, best, kV, poz };
}

function sobrat(p: PL20): Chast2Zadacha {
  const ch = chislaL20(p);
  const { best, kV } = ch;
  const nB = best.x + best.y;
  const d = p.a - p.b;
  const uslovie =
    `На числовой прямой в точке $0$ стоит фишка. За один ход её сдвигают либо на ${p.a} вправо, либо на ${p.b} влево.\n` +
    `а) Может ли фишка оказаться в точке $${p.T1}$ ровно через ${p.N} ходов?\n` +
    `б) За какое наименьшее число ходов фишка может попасть в точку $${p.T2}$?\n` +
    `в) За какое наименьшее число ходов фишка может попасть в точку $${p.T3}$, если делать два хода подряд в одну и ту же сторону нельзя?`;
  const aLine = ch.daA
    ? `Да: ${ch.xA} ходов вправо и ${p.N - ch.xA} влево дают $${p.a}\\cdot${ch.xA}-${p.b}\\cdot${p.N - ch.xA}=${p.T1}$.`
    : `Нет. Если сделано $x$ ходов вправо и $${p.N}-x$ влево, то $${p.a}x-${p.b}(${p.N}-x)=${p.T1}$, откуда $${p.a + p.b}x=${p.T1 + p.b * p.N}$; ${Number.isInteger(ch.xA) ? `$x=${ch.xA}$ не лежит на отрезке $[0;\\ ${p.N}]$` : `число $${p.T1 + p.b * p.N}$ не делится на $${p.a + p.b}$`}.`;
  return {
    no: 20,
    shablon: 'l20.fishka',
    uslovie,
    risunok: null,
    punkty: [
      { bukva: 'а', pole: { vid: 'danet', verno: ch.daA } },
      { bukva: 'б', podpis: 'Наименьшее число ходов', pole: { vid: 'chislo', verno: String(nB) } },
      {
        bukva: 'в',
        podpis: 'Наименьшее число ходов',
        pole: { vid: 'chislo', verno: String(kV.k) },
      },
    ],
    otvet: `а) ${ch.daA ? 'да' : 'нет'}; б) $${nB}$; в) $${kV.k}$`,
    reshenie: [
      {
        title: 'а) Уравнение для числа ходов',
        lines: [
          `После $x$ ходов вправо и $y$ ходов влево фишка в точке $${p.a}x-${p.b}y$ — порядок ходов не важен.`,
          aLine,
        ],
      },
      {
        title: 'б) Наименьшее число ходов',
        lines: [
          `Нужно $${p.a}x-${p.b}y=${p.T2}$, $x,y\\ge0$ — целые, $x+y$ наименьшее. Из уравнения $${p.a}x\\equiv${p.T2}\\pmod{${p.b}}$; наименьшее подходящее $x=${best.x}$, тогда $y=${best.y}$.`,
          `Каждое следующее решение получается прибавлением $${p.b}$ к $x$ и $${p.a}$ к $y$, число ходов растёт. Значит, наименьшее число ходов $${best.x}+${best.y}=${nB}$.`,
          `Ответ б): $${nB}$.`,
        ],
      },
      {
        title: 'в) Ходы чередуются',
        lines: [
          `Ходы идут через один: каждая пара соседних ходов сдвигает фишку на $${d}$. После $2m$ ходов фишка в точке $${d}m$, после $2m+1$ — в точке $${d}m+${p.a}$ (первый ход вправо) или $${d}m-${p.b}$ (первый ход влево).`,
          `Наименьшее $k$, при котором получается $${p.T3}$: $k=${kV.k}$ (первый ход ${kV.vpravo ? 'вправо' : 'влево'}); при меньших $k$ точки $${p.T3}$ среди возможных положений нет.`,
          `Ответ в): $${kV.k}$.`,
        ],
      },
    ],
    razbor: [
      {
        slovo: 'Положение зависит только от числа ходов в каждую сторону',
        formula: `${p.a}x-${p.b}y`,
      },
      { slovo: 'а) Целое $x$ на отрезке', formula: `${p.a + p.b}x=${p.T1 + p.b * p.N}` },
      { slovo: 'б) Наименьшее решение уравнения', formula: `x=${best.x},\\ y=${best.y}` },
      { slovo: 'в) Чередование: шаг пары ходов', formula: `${d}` },
    ],
    kontrol: { a: ch.daA, b: nB, v: kV.k },
  };
}

export const L20_FISHKA: Shablon2<PL20> = {
  no: 20,
  prototip:
    'Фишка на прямой с ходами +a и −b: достижимость, наименьшее число ходов, ходы с чередованием',
  sobrat,
};
