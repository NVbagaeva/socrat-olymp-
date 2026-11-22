/**
 * База, задание №15: общие ходы решения задач на проценты и отношения
 * (разбор по шагам и подсказки-вопросы) и точная арифметика проверки.
 *
 * Все числа — точные: проценты считаются в целых, а в запись ответа
 * переводятся делением в столбик (lib/baza/chisla.ts).
 */

import { konechna, nod, tex, zapis } from '../chisla';
import type { Etap, HintStep, Resheno } from '../types';

/** m/n в TeX: «6{,}65». */
export function T(m: number, n = 1): string {
  return tex(zapis(m, n));
}

/** m/n в TeX, если дробь конечна; иначе null (отвлекающий вариант не годится). */
export function Tili(m: number, n = 1): string | null {
  if (!Number.isInteger(m) || !Number.isInteger(n) || n === 0 || !konechna(m, n)) return null;
  return T(m, n);
}

/** Вариант подсказки в $…$; null отбрасывается. */
export function fm(x: string | null): string | null {
  return x === null ? null : `$${x}$`;
}

/**
 * Подсказка-вопрос: верный вариант и отвлекающие (типичные ошибки).
 * Повторы и пустые убираются, место верного зависит от sdvig.
 */
export function vopros(
  question: string,
  verno: string,
  drugie: readonly (string | null)[],
  sdvig: number,
  comment?: string,
): HintStep {
  const prochie = [...new Set(drugie.filter((d): d is string => d !== null && d !== verno))].slice(
    0,
    2,
  );
  if (prochie.length === 0) throw new Error(`у подсказки «${question}» нет отвлекающих`);
  const mesto = Math.abs(sdvig) % (prochie.length + 1);
  const options = [...prochie.slice(0, mesto), verno, ...prochie.slice(mesto)];
  return { question, options, correct: mesto, ...(comment === undefined ? {} : { comment }) };
}

/** Последний шаг разбора: строки и ответ. */
export function itog(title: string, lines: string[], otvet: string): Etap {
  return { title, lines: [...lines, `Ответ: $${tex(otvet)}$.`] };
}

/* ── Точные дроби для проверки ─────────────────────────────────── */

/** Несократимая дробь n/d, d > 0. */
export interface Q {
  n: number;
  d: number;
}

export function q(n: number, d = 1): Q {
  if (d === 0) throw new Error('деление на ноль');
  const g = nod(n, d) || 1;
  const s = d < 0 ? -1 : 1;
  return { n: (s * n) / g, d: (s * d) / g };
}
export const plus = (a: Q, b: Q): Q => q(a.n * b.d + b.n * a.d, a.d * b.d);
export const minus = (a: Q, b: Q): Q => q(a.n * b.d - b.n * a.d, a.d * b.d);
export const umn = (a: Q, b: Q): Q => q(a.n * b.n, a.d * b.d);
export const del = (a: Q, b: Q): Q => q(a.n * b.d, a.d * b.n);
/** p процентов как дробь: p/100. */
export const pr = (p: number): Q => q(p, 100);
export const zapisQ = (a: Q): string => zapis(a.n, a.d);

/* ── Процент от числа ──────────────────────────────────────────── */

export interface ProcentOt {
  /** Целое (100 %). */
  N: number;
  /** Сколько процентов нужно найти. */
  p: number;
  /** Что за 100 %: «все жители города». */
  tseloe: string;
  /** Что ищем: «пенсионеры». */
  iskomoe: string;
  /** Отвлекающие ответы на «что принимаем за 100 %?». */
  neTseloe: string[];
  /** Шаги перед основным расчётом (например, 100 % − p %). */
  pered?: Etap[];
  /** Подсказки перед основными. */
  hintsPered?: HintStep[];
}

/** N · p / 100: «за 100 % — целое, 1 % — сотая часть, p % — p таких частей». */
export function procentOt(o: ProcentOt): Resheno {
  const { N, p } = o;
  const otvet = zapis(N * p, 100);
  return {
    otvet,
    etapy: [
      ...(o.pered ?? []),
      { title: 'Что принимаем за 100 %', lines: [`За $100\\%$ берём ${o.tseloe}: $${T(N)}$.`] },
      {
        title: 'Один процент',
        lines: [`$1\\%$ — сотая часть: $${T(N)} : 100 = ${T(N, 100)}$.`],
      },
      itog(
        'Нужные проценты',
        [`${o.iskomoe} — это $${p}\\%$: $${T(N, 100)} \\cdot ${p} = ${tex(otvet)}$.`],
        otvet,
      ),
    ],
    hints: [
      ...(o.hintsPered ?? []),
      vopros('Что принимаем за 100 %?', o.tseloe, o.neTseloe, N + p),
      vopros(
        `Чему равен $1\\%$ от $${T(N)}$?`,
        `$${T(N, 100)}$`,
        [fm(Tili(N, 10)), `$${T(N * 100)}$`],
        p,
        'Один процент — это сотая часть: делим на 100.',
      ),
      vopros(
        `Сколько составляют $${p}\\%$ от $${T(N)}$?`,
        `$${tex(otvet)}$`,
        [fm(Tili(N * (100 - p), 100)), fm(Tili(N * 100, p)), fm(Tili(N * p))],
        N,
      ),
    ],
  };
}

/* ── Цена после повышения или снижения на p % ──────────────────── */

export interface Izmenenie {
  /** Прежняя величина (100 %). */
  S: number;
  p: number;
  vverh: boolean;
  /** Что за 100 %: «цена шкафа». */
  tseloe: string;
  /** Изменение в винительном падеже: «наценку», «скидку», «налог». */
  izm: string;
  /** Сколько штук покупают (умножаем в конце). */
  shtuk?: number;
  /** Что считаем штуками, в разборе: «Погремушек». */
  shtukSlovo?: string;
  pered?: Etap[];
  hintsPered?: HintStep[];
}

export function izmenenie(o: Izmenenie): Resheno {
  const { S, p, vverh } = o;
  const k = o.shtuk ?? 1;
  const nov = vverh ? 100 + p : 100 - p;
  const ne = vverh ? 100 - p : 100 + p;
  const odna = zapis(S * nov, 100);
  const otvet = zapis(S * nov * k, 100);
  const znak = vverh ? '+' : '-';
  return {
    otvet,
    etapy: [
      ...(o.pered ?? []),
      {
        title: 'Что принимаем за 100 %',
        lines: [`За $100\\%$ берём ${o.tseloe}: $${T(S)}$ руб.`],
      },
      {
        title: 'Сколько процентов составит новая сумма',
        lines: [
          `${vverh ? 'Прибавляем' : 'Вычитаем'} ${o.izm} $${p}\\%$: $100\\% ${znak} ${p}\\% = ${nov}\\%$.`,
        ],
      },
      itog(
        'Считаем',
        [
          `$${nov}\\%$ от $${T(S)}$: $${T(S)} \\cdot ${T(nov, 100)} = ${tex(odna)}$.`,
          ...(k === 1
            ? []
            : [`${o.shtukSlovo ?? 'Штук'} $${k}$: $${tex(odna)} \\cdot ${k} = ${tex(otvet)}$.`]),
        ],
        otvet,
      ),
    ],
    hints: [
      ...(o.hintsPered ?? []),
      vopros(
        'Сколько процентов от прежней суммы составит новая?',
        `$${nov}\\%$`,
        [`$${p}\\%$`, `$${ne}\\%$`],
        S + p,
        vverh ? 'Проценты прибавляем к 100 %.' : 'Проценты вычитаем из 100 %.',
      ),
      vopros(
        'Какой получится ответ?',
        `$${tex(otvet)}$`,
        [fm(Tili(S * p * k, 100)), fm(Tili(S * ne * k, 100)), fm(Tili(S * nov, 100))],
        p,
        vverh
          ? 'Нужна вся сумма вместе с прибавкой, а не одна прибавка.'
          : 'Нужно то, что останется после вычета, а не сам вычет.',
      ),
    ],
  };
}

/* ── Целое по его части ────────────────────────────────────────── */

export interface Tseloe {
  /** Известная часть. */
  k: number;
  /** Сколько процентов она составляет. */
  p: number;
  /** Что известно: «104 учащихся». */
  chast: string;
  /** Что за 100 % (и что ищем): «все учащиеся школы». */
  tseloe: string;
  pered?: Etap[];
  hintsPered?: HintStep[];
}

/** k — это p %; 1 % = k : p; 100 % = (k : p) · 100. */
export function tseloePoChasti(o: Tseloe): Resheno {
  const { k, p } = o;
  const otvet = zapis(k * 100, p);
  return {
    otvet,
    etapy: [
      ...(o.pered ?? []),
      {
        title: 'Что принимаем за 100 %',
        lines: [`За $100\\%$ берём ${o.tseloe} — это и нужно найти.`],
      },
      {
        title: 'Один процент',
        lines: [`${o.chast} — это $${p}\\%$, значит, $1\\% = ${T(k)} : ${p} = ${T(k, p)}$.`],
      },
      itog('Всё целое', [`$100\\% = ${T(k, p)} \\cdot 100 = ${tex(otvet)}$.`], otvet),
    ],
    hints: [
      ...(o.hintsPered ?? []),
      vopros(
        `Известное число $${T(k)}$ — это сколько процентов целого?`,
        `$${p}\\%$`,
        [`$100\\%$`, `$${Math.abs(100 - p)}\\%$`, `$${100 + p}\\%$`],
        k + p,
      ),
      vopros(
        'Какой получится ответ?',
        `$${tex(otvet)}$`,
        [fm(Tili(k * p, 100)), fm(Tili(k * (100 + p), 100)), fm(Tili(k * (100 - p), 100))],
        k,
        'Находим не процент от известного числа, а целое, частью которого оно является: делим на проценты и умножаем на 100.',
      ),
    ],
  };
}

/* ── На сколько процентов изменилось ───────────────────────────── */

export interface NaSkolko {
  bylo: number;
  stalo: number;
  /** Что сравнивают: «цена футболки». */
  chto: string;
}

/** |стало − было| : было · 100 %. */
export function naSkolkoProcentov(o: NaSkolko): Resheno {
  const { bylo, stalo } = o;
  const vverh = stalo > bylo;
  const raz = Math.abs(stalo - bylo);
  const otvet = zapis(raz * 100, bylo);
  return {
    otvet,
    etapy: [
      {
        title: 'Что принимаем за 100 %',
        lines: [`Сравниваем с тем, что было: ${o.chto} до изменения $${T(bylo)}$ — это $100\\%$.`],
      },
      {
        title: vverh ? 'На сколько выросло' : 'На сколько уменьшилось',
        lines: [
          vverh
            ? `$${T(stalo)} - ${T(bylo)} = ${T(raz)}$.`
            : `$${T(bylo)} - ${T(stalo)} = ${T(raz)}$.`,
        ],
      },
      itog(
        'В процентах',
        [`$\\dfrac{${T(raz)}}{${T(bylo)}} \\cdot 100\\% = ${tex(otvet)}\\%$.`],
        otvet,
      ),
    ],
    hints: [
      vopros(
        'Что принимаем за 100 %?',
        `То, что было: $${T(bylo)}$`,
        [`То, что стало: $${T(stalo)}$`, `Изменение: $${T(raz)}$`],
        bylo,
        'Проценты изменения считают от прежнего значения.',
      ),
      vopros(
        'Какой получится ответ?',
        `$${tex(otvet)}$`,
        [fm(Tili(raz * 100, stalo)), fm(Tili(stalo * 100, bylo)), fm(Tili(raz))],
        raz,
        'Делим изменение на прежнее значение, а не на новое.',
      ),
    ],
  };
}

/* ── Отношение частей ──────────────────────────────────────────── */

/** Сумма частей и TeX «a + b (+ c)». */
export function chasti(ch: readonly number[]): { s: number; tex: string } {
  return { s: ch.reduce((x, y) => x + y, 0), tex: ch.join(' + ') };
}
