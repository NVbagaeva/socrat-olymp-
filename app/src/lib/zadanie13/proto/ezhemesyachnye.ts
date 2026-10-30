/**
 * Задание №13 для раздела «Ежемесячные варианты».
 *
 * Две задачи — прототипы банка (D-08 «два вклада», C-03 «на сколько
 * больше при большем числе равных платежей») с числами варианта: их
 * `make` получает не случайный, а заданный поток чисел (`zadannyeChisla`),
 * поэтому условие, таблица, решение и подсказки — те же, что у банка.
 *
 * Ещё две — задачи не про кредит и вклад (оптимизация дохода и
 * «таяние» запаса с продажей), их решатели — здесь же: шаги, подсказки
 * и независимый пересчёт.
 */

import type { Rng } from '../rng';
import { PROTOTYPE_BY_ID } from './index';
import type { Prototype } from './types';

/* ── Прототип банка с заданными числами ─────────────────────────── */

/**
 * Поток «случайных» чисел, который отдаёт заданные значения: int — по
 * очереди из списка (вне диапазона — ошибка), pick — первый элемент,
 * подходящий под очередное условие.
 */
function zadannyyPotok(ints: readonly number[], picks: readonly ((x: unknown) => boolean)[]): Rng {
  const i = [...ints];
  const p = [...picks];
  return {
    int(a: number, b: number) {
      const x = i.shift() ?? a;
      if (x < a || x > b) throw new Error(`№13: число ${x} вне [${a}; ${b}]`);
      return x;
    },
    dec(a: number) {
      return a;
    },
    pick<T>(items: readonly T[]): T {
      const f = p.shift();
      const x = f === undefined ? items[0] : items.find((t) => f(t));
      if (x === undefined) throw new Error('№13: нет подходящего элемента');
      return x;
    },
    sample<T>(items: readonly T[], n: number): T[] {
      return items.slice(0, n);
    },
    next() {
      return 0;
    },
  };
}

/** Прототип банка `id`, у которого числа задаёт вариант. */
export function zadannyeChisla(
  id: string,
  ints: readonly number[],
  picks: readonly ((x: unknown) => boolean)[] = [],
): Prototype {
  const p = PROTOTYPE_BY_ID[id];
  if (p === undefined) throw new Error(`№13: нет прототипа ${id}`);
  return {
    ...p,
    id: `EV-${id}`,
    source: 'own',
    make: (ctx) => p.make({ ...ctx, rng: zadannyyPotok(ints, picks) }),
  };
}

/* ── Решатели задач без таблицы кредита ─────────────────────────── */

export interface Shag13 {
  title: string;
  lines: string[];
}

export interface Podskazka13 {
  question: string;
  options: string[];
  correct: number;
  comment?: string;
}

export interface Reshenie13 {
  uslovie: string;
  otvet: number;
  /** Независимый пересчёт ответа другим путём. */
  proverka: number;
  shagi: Shag13[];
  hints: Podskazka13[];
}

const r9 = (x: number) => Math.round(x * 1e9) / 1e9;
const ru = (x: number) => String(r9(x)).replace('.', ',');
const tx = (x: number) => {
  const s = String(r9(x));
  const [c, f] = s.split('.');
  const cel = c!.replace(/\B(?=(\d{3})+(?!\d))/g, '\\,');
  return f === undefined ? cel : `${cel}{,}${f}`;
};

/* Теплицы: два участка, две культуры. */

export interface Teplicy {
  /** Площади участков, га. */
  s1: number;
  s2: number;
  /** Урожайность огурцов и томатов на участках, ц/га. */
  o1: number;
  o2: number;
  t1: number;
  t2: number;
  /** Цены, руб. за центнер. */
  co: number;
  ct: number;
}

/**
 * Доход с гектара каждой культуры на каждом участке; участок можно
 * делить в любой пропорции, доход линеен по доле — выгоднее отдать
 * весь участок под культуру с большим доходом с гектара. Подвох —
 * сравнивать урожайность, а не доход (цены разные).
 */
export function teplicy(p: Teplicy): Reshenie13 {
  const d = (u: number, c: number) => u * c;
  const o1 = d(p.o1, p.co);
  const t1 = d(p.t1, p.ct);
  const o2 = d(p.o2, p.co);
  const t2 = d(p.t2, p.ct);
  const m1 = Math.max(o1, t1);
  const m2 = Math.max(o2, t2);
  const otvet = r9((p.s1 * m1 + p.s2 * m2) / 1e6);
  /* Второй счёт: перебор долей участков с шагом 1 %. */
  let best = 0;
  for (let a = 0; a <= 100; a += 1) {
    for (let b = 0; b <= 100; b += 1) {
      const doh =
        p.s1 * ((a / 100) * o1 + (1 - a / 100) * t1) + p.s2 * ((b / 100) * o2 + (1 - b / 100) * t2);
      best = Math.max(best, doh);
    }
  }
  const k1 = o1 >= t1 ? 'огурцы' : 'томаты';
  const k2 = o2 >= t2 ? 'огурцы' : 'томаты';
  return {
    uslovie: '',
    otvet,
    proverka: r9(best / 1e6),
    shagi: [
      {
        title: 'Доход с гектара',
        lines: [
          `Первая теплица: огурцы $${tx(p.o1)}\\cdot${tx(p.co)}=${tx(o1)}$ руб./га, томаты $${tx(p.t1)}\\cdot${tx(p.ct)}=${tx(t1)}$ руб./га.`,
          `Вторая теплица: огурцы $${tx(p.o2)}\\cdot${tx(p.co)}=${tx(o2)}$ руб./га, томаты $${tx(p.t2)}\\cdot${tx(p.ct)}=${tx(t2)}$ руб./га.`,
        ],
      },
      {
        title: 'Как делить теплицу',
        lines: [
          'Пусть под одну культуру отдана доля $x$ теплицы, под другую — $1-x$. Доход — линейная функция $x$, поэтому наибольший он на конце отрезка $[0;\\,1]$: всю теплицу выгодно занять культурой с большим доходом с гектара.',
          `В первой теплице — ${k1}, во второй — ${k2}. Урожайность сравнивать нельзя: цены у культур разные.`,
        ],
      },
      {
        title: 'Наибольший доход',
        lines: [
          `$${tx(p.s1)}\\cdot${tx(m1)}+${tx(p.s2)}\\cdot${tx(m2)}=${tx(p.s1 * m1)}+${tx(p.s2 * m2)}=${tx(p.s1 * m1 + p.s2 * m2)}$ руб., то есть $${tx(otvet)}$ млн руб.`,
        ],
      },
    ],
    hints: [
      {
        question: 'Что сравниваем, выбирая культуру для теплицы?',
        options: ['Доход с гектара: урожайность × цена', 'Только урожайность', 'Только цену'],
        correct: 0,
      },
      {
        question: 'Как выгоднее разделить одну теплицу?',
        options: [
          'Целиком под культуру с большим доходом с гектара',
          'Пополам',
          'Пропорционально урожайности',
        ],
        correct: 0,
        comment: 'Доход линеен по доле — наибольшее значение на конце отрезка.',
      },
      {
        question: 'В каких единицах ответ?',
        options: ['В миллионах рублей', 'В рублях', 'В тысячах рублей'],
        correct: 0,
      },
    ],
  };
}

/* Сухой лёд: за сутки испаряется доля, затем продают фиксированную массу. */

export interface SuhoyLed {
  /** Начальная масса, кг. */
  M: number;
  /** Сколько процентов испаряется за сутки. */
  p: number;
  /** Сколько килограммов продают каждый день. */
  k: number;
  /** Сколько дней продают по k кг; на следующий день продают остаток. */
  n: number;
  /** Цена, руб. за кг. */
  c: number;
}

/**
 * Каждые сутки масса умножается на q = 1 − p/100, затем продают k кг; так
 * n дней, на (n + 1)-й день после испарения продают остаток. Выручка —
 * c·(nk + остаток). Подвох — продать «всё, что было»: испарившееся не
 * продаётся; и не забыть испарение в последний день.
 */
export function suhoyLed(p: SuhoyLed): Reshenie13 {
  const q = 1 - p.p / 100;
  const massy: { den: number; utro: number; vecher: number }[] = [];
  let m = p.M;
  for (let den = 1; den <= p.n; den += 1) {
    const utro = r9(m * q);
    m = r9(utro - p.k);
    massy.push({ den, utro, vecher: m });
  }
  const ostatok = r9(m * q);
  const prodano = r9(p.n * p.k + ostatok);
  const otvet = r9(prodano * p.c);
  if (!Number.isInteger(otvet)) throw new Error(`№13: выручка не целая ${otvet}`);
  /* Второй счёт: формула через геометрическую прогрессию. */
  const qn = q ** p.n;
  const sumGeo = (1 - qn) / (1 - q);
  const ostatokFormula = q * (p.M * qn - p.k * sumGeo);
  const proverka = r9((p.n * p.k + ostatokFormula) * p.c);
  return {
    uslovie: '',
    otvet,
    proverka,
    shagi: [
      {
        title: 'Как меняется масса',
        lines: [
          `За сутки испаряется $${ru(p.p)}\\%$ — масса умножается на $q=1-\\dfrac{${ru(p.p)}}{100}=${ru(q)}$; затем продают $${tx(p.k)}$ кг.`,
        ],
      },
      {
        title: 'Считаем по дням',
        lines: [
          ...massy.map(
            (x, i) =>
              `${x.den}-й день: $${tx(i === 0 ? p.M : massy[i - 1]!.vecher)}\\cdot${ru(q)}-${tx(p.k)}=${tx(x.utro)}-${tx(p.k)}=${tx(x.vecher)}$ кг.`,
          ),
          `${p.n + 1}-й день: $${tx(m)}\\cdot${ru(q)}=${tx(ostatok)}$ кг — продают весь остаток.`,
        ],
      },
      {
        title: 'Выручка',
        lines: [
          `Продано $${p.n}\\cdot${tx(p.k)}+${tx(ostatok)}=${tx(prodano)}$ кг, выручка $${tx(prodano)}\\cdot${tx(p.c)}=${tx(otvet)}$ руб.`,
          `Проверка формулой: после $n$ дней масса $M_n=Mq^n-k(1+q+\\ldots+q^{n-1})=${tx(p.M)}\\cdot${ru(q)}^{${p.n}}-${tx(p.k)}\\cdot\\dfrac{1-${ru(q)}^{${p.n}}}{1-${ru(q)}}=${tx(m)}$ — сходится.`,
        ],
      },
    ],
    hints: [
      {
        question: 'На что умножается масса за сутки?',
        options: [`$${ru(q)}$`, `$${ru(p.p / 100)}$`, `$${ru(1 + p.p / 100)}$`],
        correct: 0,
      },
      {
        question: `Сколько килограммов продано в ${p.n + 1}-й день?`,
        options: [`$${tx(ostatok)}$`, `$${tx(m)}$`, `$${tx(p.k)}$`],
        correct: 0,
        comment: 'Утром последнего дня масса тоже уменьшилась.',
      },
      {
        question: 'Как найти выручку?',
        options: [
          'Цена × всё проданное: по дням и остаток',
          `Цена × начальная масса $${tx(p.M)}$ кг`,
          `Цена × $${p.n}\\cdot${tx(p.k)}$ кг`,
        ],
        correct: 0,
      },
    ],
  };
}
