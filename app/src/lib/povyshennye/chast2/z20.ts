/**
 * №20: забор из секций одной ширины, соседние секции скрепляются
 * внахлёст на p или q см. а) можно ли собрать длину A (да);
 * б) длину B (нет); в) наименьшая L, при которой собираются L и все
 * L + 10n.
 *
 * Длина из 1 + k₁ + k₂ секций: S + (S − q)k₁ + (S − p)k₂. Шаги S − q
 * и S − p в десятках сантиметров взаимно просты, поэтому все кратные 10
 * длины начиная с некоторой собираются; наибольшая несобираемая M —
 * число Фробениуса, ответ в) — M + 10. Как в образцах (нахлёст 10/30 и
 * 10/40): да / нет / число.
 */

import { decText } from './tex';
import type { Chast2Zadacha, Shablon2 } from './types';

export interface P20 {
  /** Ширина секции, см. */
  S: number;
  /** Меньший нахлёст, см. */
  p: number;
  /** Больший нахлёст, см (по умолчанию p + 20). */
  q?: number;
  /** Длина пункта а (собирается), см. */
  A: number;
  /** Длина пункта б (не собирается), см. */
  B: number;
}

/** Разложение длины: k₁ соединений по q, k₂ — по p; null — не собирается. */
export function razlozhit(p: P20, L: number): { k1: number; k2: number } | null {
  const q = p.q ?? p.p + 20;
  const a = p.S - q;
  const b = p.S - p.p;
  const r = L - p.S;
  if (r < 0) return null;
  for (let k2 = 0; k2 * b <= r; k2 += 1) {
    const ost = r - k2 * b;
    if (ost % a === 0) return { k1: ost / a, k2 };
  }
  return null;
}

/** Наибольшая несобираемая длина, кратная 10 и не меньше S − 10. */
export function naibolshayaNe(p: P20): number {
  const a = (p.S - (p.q ?? p.p + 20)) / 10;
  const b = (p.S - p.p) / 10;
  return p.S + 10 * (a * b - a - b);
}

const m = (cm: number) => `${decText(cm / 100)} м`;

function sobrat(p: P20): Chast2Zadacha {
  const q = p.q ?? p.p + 20;
  const a = p.S - q;
  const b = p.S - p.p;
  /* Шаги длины a и b (в десятках см) взаимно просты: собираются все
     кратные 10 длины начиная с некоторой. */
  const nod = (x: number, y: number): number => (y === 0 ? x : nod(y, x % y));
  if (a <= 0 || q <= p.p || a % 10 !== 0 || b % 10 !== 0 || nod(a / 10, b / 10) !== 1)
    throw new Error('z20: не та структура');
  const ra = razlozhit(p, p.A);
  if (ra === null || razlozhit(p, p.B) !== null) throw new Error('z20: пункты а/б не те');
  const M = naibolshayaNe(p);
  if (razlozhit(p, M) !== null || p.B >= M) throw new Error('z20: M посчитано неверно');
  const L = M + 10;
  const sekc = ra.k1 + ra.k2 + 1;

  const uslovie =
    `Ширина одной секции забора — $${p.S}$ см. Соседние секции можно скреплять только внахлёст: ` +
    `на $${p.p}$ см или на $${q}$ см (одна секция накладывается на другую). Так получается забор определённой длины.\n` +
    `а) Можно ли из таких секций собрать забор длиной ${m(p.A)}?\n` +
    `б) Можно ли собрать забор длиной ${m(p.B)}?\n` +
    `в) Найдите наименьшую длину $L$ (в сантиметрах) забора, который можно собрать из таких секций так, чтобы можно было собрать и забор любой длины $L+10n$ см ($n\\in\\mathbb N$).`;

  /* б): перебор k₂. */
  const perebor = (len: number) => {
    const r = (len - p.S) / 10;
    const ks: string[] = [];
    for (let k2 = 0; k2 * (b / 10) <= r; k2 += 1)
      ks.push(`\\dfrac{${r - k2 * (b / 10)}}{${a / 10}}`);
    return { r, ks, maxK2: Math.floor(r / (b / 10)) };
  };
  const pb = perebor(p.B);
  const pM = perebor(M);

  /* в): окно из a/10 подряд идущих длин от L. */
  const okno: { len: number; k1: number; k2: number }[] = [];
  for (let len = L; len < L + a; len += 10) {
    const r = razlozhit(p, len);
    if (r === null) throw new Error(`z20: ${len} не собирается`);
    okno.push({ len, ...r });
  }
  const tablica =
    `\\begin{array}{|c|${'c|'.repeat(okno.length)}}\\hline\\text{Длина, см}&${okno.map((o) => o.len).join('&')}\\\\\\hline ` +
    `k_1&${okno.map((o) => o.k1).join('&')}\\\\\\hline k_2&${okno.map((o) => o.k2).join('&')}\\\\\\hline\\end{array}`;

  return {
    no: 20,
    shablon: 'z20.zabor',
    uslovie,
    risunok: null,
    punkty: [
      { bukva: 'а', podpis: 'Ответ', pole: { vid: 'danet', verno: true } },
      { bukva: 'б', podpis: 'Ответ', pole: { vid: 'danet', verno: false } },
      { bukva: 'в', podpis: 'Длина $L$, см', pole: { vid: 'chislo', verno: String(L) } },
    ],
    otvet: `а) да; б) нет; в) $${L}$ см`,
    reshenie: [
      {
        title: 'Длина забора',
        lines: [
          `Пусть в заборе $k_1$ соединений внахлёст на $${q}$ см и $k_2$ — на $${p.p}$ см. Первая секция даёт $${p.S}$ см, каждая следующая добавляет $${a}$ или $${b}$ см:`,
          `$\\text{длина}=${p.S}+${a}k_1+${b}k_2$, $k_1,k_2\\ge0$ — целые.`,
        ],
      },
      {
        title: 'а) Пример',
        lines: [
          `Можно: $${sekc}$ секций, $${ra.k1}$ соединений по $${q}$ см и $${ra.k2}$ — по $${p.p}$ см: $${p.S}+${a}\\cdot${ra.k1}+${b}\\cdot${ra.k2}=${p.A}$ см.`,
        ],
      },
      {
        title: 'б) Перебор',
        lines: [
          `Пусть можно. Тогда $${p.B}=${p.S}+${a}k_1+${b}k_2$, то есть $${pb.r}=${a / 10}k_1+${b / 10}k_2$.`,
          `При $k_2=0,1,\\ldots,${pb.maxK2}$ (больше нельзя: $${b / 10}k_2\\le${pb.r}$) получаем $k_1=${pb.ks.join(',\\ ')}$ — ни одно не целое. Значит, нельзя.`,
        ],
      },
      {
        title: `в) Длину ${M} см собрать нельзя`,
        lines: [
          `$${M}=${p.S}+${a}k_1+${b}k_2$ даёт $${pM.r}=${a / 10}k_1+${b / 10}k_2$. При $k_2=0,\\ldots,${pM.maxK2}$: $k_1=${pM.ks.join(',\\ ')}$ — не целые.`,
          `Поэтому $L\\ge${L}$: если $L\\le${M - 10}$, то длина $${M}=L+10n$ при натуральном $n$ — а её собрать нельзя; $L=${M}$ тоже не подходит.`,
        ],
      },
      {
        title: `в) Все длины от ${L} см собираются`,
        lines: [
          `Подряд идущие длины от $${L}$ до $${L + a - 10}$ см:`,
          `$${tablica}$`,
          `Добавляя к любой из них секцию с нахлёстом $${q}$ см (длина растёт на $${a}$ см), получаем все следующие длины, кратные 10. Значит, $L=${L}$.`,
        ],
      },
    ],
    razbor: [
      {
        slovo: 'Записываем длину через число соединений каждого вида',
        formula: `${p.S}+${a}k_1+${b}k_2`,
      },
      {
        slovo: 'а) Подбираем пример',
        formula: `${p.S}+${a}\\cdot${ra.k1}+${b}\\cdot${ra.k2}=${p.A}`,
      },
      {
        slovo: 'б) Перебираем $k_2$ — $k_1$ не выходит целым',
        formula: `${pb.r}=${a / 10}k_1+${b / 10}k_2`,
      },
      { slovo: `в) Длина ${M} не собирается, а ${L}…${L + a - 10} собираются`, formula: `L=${L}` },
    ],
    kontrol: { A: true, B: false, L },
  };
}

export const Z20_ZABOR: Shablon2<P20> = {
  no: 20,
  prototip: 'Забор из секций с двумя видами нахлёста: да / нет / наименьшая длина',
  sobrat,
};
