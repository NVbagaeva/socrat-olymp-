/**
 * «Заполни таблицу»: таблица для задач «таблица руками» (P-01…P-03),
 * которую ученик заполняет сам. Строки — величины по смыслу схемы,
 * столбцы — периоды. Что дано в условии (кредит или вклад на начало,
 * известные платежи и пополнения), стоит числом; остальное ученик
 * считает, клетка закрыта отпечатком числа — ответов в разметке нет.
 *
 * Модуль изоморфный: таблица собирается вместе с закрытой задачей на
 * сборке и в браузере по «Ещё вариант».
 */

import { katex } from '../graph/katex';
import { chislo } from './html';
import { sealAnswer } from './secret';
import type { PeriodRow, Task13 } from './types';

export interface KletkaZapolni13 {
  /** Дано в условии: готовая разметка числа. */
  dano: string | null;
  /** Считает ученик: отпечаток числа. */
  seal: string | null;
}

export interface StrokaZapolni13 {
  title: string;
  /** «Как найти долг после начисления?» — вопрос и ответ, свёрстаны. */
  vopros: string;
  podskazka: string;
  kletki: KletkaZapolni13[];
}

export interface TablitsaZapolni13 {
  /** «Месяц», «Год». */
  period: string;
  periody: string[];
  stroki: StrokaZapolni13[];
}

interface Stroka {
  pole: keyof PeriodRow;
  title: string;
  kak: string;
}

/* Строки по смыслу схемы: что было, что начислили, что заплатили, что осталось. */
const STROKI: Record<'dif' | 'ann' | 'dep', Stroka[]> = {
  dif: [
    {
      pole: 'start',
      title: 'Долг на начало',
      kak: 'В первом периоде — сумма кредита, дальше — долг на конец предыдущего периода.',
    },
    {
      pole: 'interest',
      title: 'Начисленные проценты',
      kak: 'Долг на начало умножаем на $\\dfrac{r}{100}$.',
    },
    {
      pole: 'change',
      title: 'Сумма изменения долга',
      kak: 'Кредит делим на число периодов: каждый период одна и та же сумма.',
    },
    { pole: 'payment', title: 'Платёж', kak: 'Сумма изменения долга плюс начисленные проценты.' },
    { pole: 'end', title: 'Долг на конец', kak: 'Долг на начало минус сумма изменения долга.' },
  ],
  ann: [
    {
      pole: 'start',
      title: 'Долг на начало',
      kak: 'В первом периоде — сумма кредита, дальше — долг после платежа в предыдущем периоде.',
    },
    {
      pole: 'interest',
      title: 'Начисленные проценты',
      kak: 'Долг на начало умножаем на $\\dfrac{r}{100}$.',
    },
    {
      pole: 'afterInterest',
      title: 'Долг после начисления',
      kak: 'Долг на начало плюс начисленные проценты — то же, что долг на начало, умноженный на $k = 1 + \\dfrac{r}{100}$.',
    },
    { pole: 'payment', title: 'Платёж', kak: 'Платёж дан в условии.' },
    { pole: 'end', title: 'Долг после платежа', kak: 'Долг после начисления минус платёж.' },
  ],
  dep: [
    {
      pole: 'start',
      title: 'Вклад на начало',
      kak: 'В первом периоде — сумма вклада, дальше — вклад на конец предыдущего периода.',
    },
    {
      pole: 'interest',
      title: 'Начисленные проценты',
      kak: 'Вклад на начало умножаем на $\\dfrac{r}{100}$.',
    },
    {
      pole: 'afterInterest',
      title: 'Вклад после начисления',
      kak: 'Вклад на начало плюс начисленные проценты.',
    },
    {
      pole: 'payment',
      title: 'Пополнение (+) или снятие (−)',
      kak: 'Пополнение или снятие дано в условии.',
    },
    {
      pole: 'end',
      title: 'Вклад на конец',
      kak: 'Вклад после начисления плюс пополнение или минус снятие.',
    },
  ],
};

/** Числа из текста условия: «1 200 000», «12,5», «10 %». */
function chislaUsloviya(text: string): number[] {
  const flat = text.replace(/(\d)[\s   ]+(?=\d{3}\b)/g, '$1');
  return [...flat.matchAll(/\d+(?:[.,]\d+)?/g)].map((m) => Number(m[0].replace(',', '.')));
}

const est = (list: readonly number[], x: number) => list.some((y) => Math.abs(y - x) < 1e-9);

function tex(x: number): string {
  return katex.renderToString(chislo(x), { throwOnError: true });
}

function strochnaya(s: string): string {
  return s.charAt(0).toLowerCase() + s.slice(1);
}

/** Таблица «Заполни таблицу» или null — задача не из «таблицы руками». */
export function tablitsaZapolni13(
  t: Task13,
  typeset: (s: string) => string,
): TablitsaZapolni13 | null {
  if (!t.prototypeId.startsWith('P-')) return null;
  const m = t.tableModel;
  const chisla = chislaUsloviya(t.condition);
  const stroki = STROKI[m.scheme].map((s): StrokaZapolni13 => ({
    title: s.title,
    vopros: `Как найти ${strochnaya(s.title).replace(' (+) или снятие (−)', ' или снятие')}?`,
    podskazka: typeset(s.kak),
    kletki: m.rows.map((row, i): KletkaZapolni13 => {
      const v = row[s.pole] as number;
      const dano =
        (s.pole === 'start' && i === 0) ||
        (s.pole === 'payment' && m.scheme !== 'dif' && est(chisla, Math.abs(v)));
      return dano ? { dano: tex(v), seal: null } : { dano: null, seal: sealAnswer(v) };
    }),
  }));
  return { period: m.period === 'year' ? 'Год' : 'Месяц', periody: [...m.labels], stroki };
}
