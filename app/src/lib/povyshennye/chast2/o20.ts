/**
 * №20 (варианты 13–14): НОД и НОК двух натуральных чисел.
 *
 * НОД(a, b) = d, НОК(a, b) = L: a = du, b = dv, uv = L/d, НОД(u, v) = 1.
 * а) Может ли a + b = X? б) Может ли a + b = Y? в) Наименьшее a + b.
 */

import type { Chast2Zadacha, Shablon2 } from './types';

export interface PO20 {
  d: number;
  /** L = d·m. */
  m: number;
  X: number;
  Y: number;
}

const nod = (a: number, b: number): number => (b === 0 ? a : nod(b, a % b));

export function chislaO20(p: PO20) {
  const pary: [number, number][] = [];
  for (let u = 1; u * u <= p.m; u += 1)
    if (p.m % u === 0 && nod(u, p.m / u) === 1) pary.push([p.d * u, (p.d * p.m) / u]);
  if (pary.length < 2) throw new Error('o20: мало пар');
  const summy = pary.map(([a, b]) => a + b);
  const daA = summy.includes(p.X);
  const daB = summy.includes(p.Y);
  const min = Math.min(...summy);
  const minPara = pary[summy.indexOf(min)]!;
  return { pary, summy, daA, daB, min, minPara, L: p.d * p.m };
}

function sobrat(p: PO20): Chast2Zadacha {
  const ch = chislaO20(p);
  const otv = (b: boolean) => (b ? 'да' : 'нет');
  const pr = ch.pary.map(([a, b]) => `(${a};\\ ${b})`).join(',\\ ');
  return {
    no: 20,
    shablon: 'o20.nodNok',
    uslovie:
      `Наибольший общий делитель натуральных чисел $a$ и $b$ равен $${p.d}$, а их наименьшее общее кратное равно $${ch.L}$.\n` +
      `а) Может ли сумма $a+b$ быть равна $${p.X}$?\n` +
      `б) Может ли сумма $a+b$ быть равна $${p.Y}$?\n` +
      `в) Найдите наименьшее возможное значение суммы $a+b$.`,
    risunok: null,
    punkty: [
      { bukva: 'а', pole: { vid: 'danet', verno: ch.daA } },
      { bukva: 'б', pole: { vid: 'danet', verno: ch.daB } },
      { bukva: 'в', podpis: 'Наименьшая сумма', pole: { vid: 'chislo', verno: String(ch.min) } },
    ],
    otvet: `а) ${otv(ch.daA)}; б) ${otv(ch.daB)}; в) $${ch.min}$`,
    reshenie: [
      {
        title: 'Вид чисел',
        lines: [
          `Пусть $a=${p.d}u$, $b=${p.d}v$, где $u$ и $v$ взаимно просты. Тогда $\\text{НОК}(a,b)=${p.d}uv$, откуда $uv=${p.m}$.`,
          `Разбиваем $${p.m}$ на два взаимно простых множителя (каждое простое число входит целиком в один из них). Получаем пары $(a;\\ b)$ с $a\\le b$: $${pr}$.`,
        ],
      },
      {
        title: 'а) и б)',
        lines: [
          `Возможные суммы: $${ch.summy.join(',\\ ')}$.`,
          `а) $${p.X}$ ${ch.daA ? 'есть среди них — да' : 'среди них нет — нет'}. б) $${p.Y}$ ${ch.daB ? 'есть среди них — да' : 'среди них нет — нет'}.`,
        ],
      },
      {
        title: 'в) Наименьшая сумма',
        lines: [
          `Из перечисленных сумм наименьшая — $${ch.min}$, она достигается при $a=${ch.minPara[0]}$, $b=${ch.minPara[1]}$.`,
          `Ответ: а) ${otv(ch.daA)}; б) ${otv(ch.daB)}; в) $${ch.min}$.`,
        ],
      },
    ],
    razbor: [
      { slovo: 'Запись через НОД', formula: `a=${p.d}u,\\ b=${p.d}v,\\ uv=${p.m}` },
      { slovo: 'Пары взаимно простых множителей', formula: pr },
      { slovo: 'Возможные суммы', formula: ch.summy.join(',\\ ') },
      { slovo: 'Наименьшая сумма', formula: String(ch.min) },
    ],
    kontrol: { daA: ch.daA, daB: ch.daB, min: ch.min },
  };
}

export const O20_NOD_NOK: Shablon2<PO20> = {
  no: 20,
  prototip: 'Теория чисел: пары чисел с заданными НОД и НОК, возможные суммы и наименьшая сумма',
  sobrat,
};
