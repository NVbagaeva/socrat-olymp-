/**
 * №20 (варианты 9–10): произведение цифр.
 *
 * а) Есть ли двузначное число с произведением цифр P₁?
 * б) Есть ли трёхзначное число с произведением цифр P₂ и суммой цифр S₂?
 * в) Наименьшее натуральное число с произведением цифр P₃ (P₃ раскладывается
 *    на множители 2, 3, 5, 7): цифр должно быть как можно меньше, поэтому
 *    множители собираем в наибольшие цифры 9, 8, …, 2 (жадно), а затем
 *    пишем цифры по возрастанию.
 */

import type { Chast2Zadacha, Shablon2 } from './types';

export interface PY20 {
  P1: number;
  P2: number;
  S2: number;
  P3: number;
}

const cifry = (N: number) => String(N).split('').map(Number);
const proizv = (N: number) => cifry(N).reduce((u, v) => u * v, 1);
const summa = (N: number) => cifry(N).reduce((u, v) => u + v, 0);

export function naimenshee(P: number): number | null {
  let r = P;
  const d: number[] = [];
  for (let c = 9; c >= 2; c -= 1)
    while (r % c === 0) {
      d.push(c);
      r /= c;
    }
  if (r !== 1) return null;
  return Number(d.sort((a, b) => a - b).join(''));
}

export function chislaY20(p: PY20) {
  let pA: number | null = null;
  for (let N = 10; N <= 99 && pA === null; N += 1) if (proizv(N) === p.P1) pA = N;
  let pB: number | null = null;
  for (let N = 100; N <= 999 && pB === null; N += 1)
    if (proizv(N) === p.P2 && summa(N) === p.S2) pB = N;
  const v = naimenshee(p.P3);
  if (v === null || p.P3 < 10) throw new Error('y20: P3');
  return { pA, pB, v };
}

function razlozh(P: number): string {
  const f: number[] = [];
  let r = P;
  for (const q of [2, 3, 5, 7])
    while (r % q === 0) {
      f.push(q);
      r /= q;
    }
  if (r !== 1) f.push(r);
  return f.join('\\cdot');
}

function sobrat(p: PY20): Chast2Zadacha {
  const ch = chislaY20(p);
  const da = (x: number | null) => x !== null;
  const vT = String(ch.v);
  const linA =
    ch.pA !== null
      ? `Да, например $${ch.pA}$: $${cifry(ch.pA).join('\\cdot')}=${p.P1}$.`
      : `Нет. $${p.P1}=${razlozh(p.P1)}$; произведение двух цифр не больше $81$ и не может содержать простой множитель больше $7$, а представить $${p.P1}$ произведением двух чисел от $1$ до $9$ нельзя (перебор делителей).`;
  const linB =
    ch.pB !== null
      ? `Да, например $${ch.pB}$: произведение цифр $${cifry(ch.pB).join('\\cdot')}=${p.P2}$, сумма $${cifry(ch.pB).join('+')}=${p.S2}$.`
      : `Нет. $${p.P2}=${razlozh(p.P2)}$. Переберём все тройки цифр с таким произведением (порядок не важен) — ни у одной из них сумма не равна $${p.S2}$.`;
  return {
    no: 20,
    shablon: 'y20.proizvCifr',
    uslovie:
      `а) Существует ли двузначное число, произведение цифр которого равно $${p.P1}$?\n` +
      `б) Существует ли трёхзначное число, произведение цифр которого равно $${p.P2}$, а сумма цифр равна $${p.S2}$?\n` +
      `в) Найдите наименьшее натуральное число, произведение цифр которого равно $${p.P3}$.`,
    risunok: null,
    punkty: [
      { bukva: 'а', pole: { vid: 'danet', verno: da(ch.pA) } },
      { bukva: 'б', pole: { vid: 'danet', verno: da(ch.pB) } },
      { bukva: 'в', podpis: 'Число', pole: { vid: 'chislo', verno: vT } },
    ],
    otvet: `а) ${da(ch.pA) ? 'да' : 'нет'}; б) ${da(ch.pB) ? 'да' : 'нет'}; в) $${vT}$`,
    reshenie: [
      { title: 'а)', lines: [linA] },
      { title: 'б)', lines: [linB] },
      {
        title: 'в) Наименьшее число',
        lines: [
          `$${p.P3}=${razlozh(p.P3)}$. Число с меньшим количеством цифр меньше, поэтому цифр должно быть как можно меньше: простые множители собираем в возможно большие цифры (сначала $9=3\\cdot3$ и $8=2\\cdot2\\cdot2$, затем остальные). Получаются цифры $${cifry(ch.v).join(',\\ ')}$ — меньше их быть не может.`,
          `При данном наборе цифр наименьшее число — с цифрами по возрастанию: $${vT}$.`,
          `Ответ в): $${vT}$.`,
        ],
      },
    ],
    razbor: [
      { slovo: 'Разложение на простые множители', formula: razlozh(p.P3) },
      { slovo: 'Как можно меньше цифр — крупные цифры', formula: cifry(ch.v).join(',\\ ') },
      { slovo: 'Цифры по возрастанию', formula: vT },
    ],
    kontrol: { a: da(ch.pA), b: da(ch.pB), v: ch.v },
  };
}

export const Y20_PROIZV_CIFR: Shablon2<PY20> = {
  no: 20,
  prototip: 'Произведение цифр числа: существование и наименьшее число с данным произведением цифр',
  sobrat,
};
