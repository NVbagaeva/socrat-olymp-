/**
 * Типы и общие помощники шаблонов задания №5 («ДЗ» и генератор).
 *
 * Шаблон — как набор движка графиков (lib/graph/): параметры с
 * ограничениями, ответ считается в коде, вариант — чистая функция
 * `(шаблон, seed) → задача`. Здесь нет React и нет DOM: модуль берут
 * и страницы, и автотест scripts/check-dz5.mjs.
 *
 * Текст задачи и шаги решения — строки с формулами в $…$
 * (lib/razmetka.ts): на экране их набирает Tex, на листе — KaTeX.
 */

import type { Drob } from './drob';

/** Типы задач: по ним учитель выбирает задачи ДЗ из генератора. */
export type Tip5 = 'hotya-by' | 'bernulli' | 'polnaya' | 'bayes' | 'kost' | 'eyler';

export interface TipOpisanie {
  id: Tip5;
  nazvanie: string;
  /** Короткая подпись типа у задачи — видна только учителю. */
  metka: string;
}

export const TIPY_5: readonly TipOpisanie[] = [
  { id: 'hotya-by', nazvanie: 'Хотя бы одно событие', metka: 'Хотя бы одно' },
  { id: 'bernulli', nazvanie: 'Схема Бернулли', metka: 'Бернулли' },
  { id: 'polnaya', nazvanie: 'Формула полной вероятности', metka: 'Полная вероятность' },
  { id: 'bayes', nazvanie: 'Формула Байеса', metka: 'Байес' },
  { id: 'kost', nazvanie: 'Сумма очков: сколько было бросков', metka: 'Кость, Байес' },
  { id: 'eyler', nazvanie: 'Условная вероятность по диаграмме Эйлера', metka: 'Диаграмма Эйлера' },
];

export function tipOpisanie(id: Tip5): TipOpisanie {
  return TIPY_5.find((t) => t.id === id) ?? (TIPY_5[0] as TipOpisanie);
}

/** Шаг решения: текст с формулами $…$ и, если нужна, формула выключкой. */
export interface Shag5 {
  text: string;
  tex?: string;
}

/**
 * Как записывать ответ части:
 *  'avto'   — конечная дробь до четырёх знаков пишется точно, иначе
 *             округление до сотых (и фраза «Ответ округлите до сотых»);
 *  'sotye'  — всегда до сотых, как в задачах «во сколько раз».
 */
export type Rezhim = 'avto' | 'sotye';

/** Часть задачи до записи ответа: вопрос и точное значение. */
export interface ChastChernovik {
  /** «а», «б» … — у задачи из одной части null. */
  metka: string | null;
  vopros: string;
  /** Точное значение ответа; null — ответ словом. */
  znachenie: Drob | null;
  /** Ответ словом («нет») — у вопроса-ловушки. */
  slovo?: string;
  rezhim?: Rezhim;
  /** Ответ не вероятность (во сколько раз): проверка «в [0; 1]» не нужна. */
  neVeroyatnost?: boolean;
}

/** Записанный ответ части. */
export interface Chast5 {
  metka: string | null;
  vopros: string;
  znachenie: Drob | null;
  /** Ответ по-ЕГЭ: «0,87», «нет». */
  otvet: string;
  /** Округлён ли ответ (в условии стоит «Ответ округлите до сотых»). */
  okruglen: boolean;
  neVeroyatnost: boolean;
}

/** Готовая задача. */
export interface Zadacha5 {
  /** Код задачи: шаблон и seed, у задач наборов — номер в наборе. */
  id: string;
  shablon: string;
  tip: Tip5;
  syuzhet: string;
  /** Условие целиком: абзацы через пустую строку, формулы в $…$. */
  uslovie: string;
  chasti: Chast5[];
  /** Чертёж (диаграмма Эйлера) — готовая строка SVG. */
  risunok: string | null;
  /** Ответ одной строкой: «0,85» или «а) нет; б) 0,052; в) 0,52». */
  otvet: string;
  reshenie: Shag5[];
}

/** Детерминированный генератор случайных чисел по строке seed. */
export interface Rng {
  next(): number;
  /** Целое от a до b включительно. */
  int(a: number, b: number): number;
  pick<T>(xs: readonly T[]): T;
  shuffle<T>(xs: readonly T[]): T[];
}

/** FNV-1a: одна строка — одно число. */
export function hash(text: string): number {
  let h = 0x811c9dc5;
  for (const ch of text) {
    h ^= ch.codePointAt(0) ?? 0;
    h = Math.imul(h, 0x01000193) >>> 0;
  }
  return h;
}

/** mulberry32 от хеша строки. */
export function rng(seed: string): Rng {
  let a = hash(seed) || 1;
  const next = () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
  const int = (lo: number, hi: number) => lo + Math.floor(next() * (hi - lo + 1));
  return {
    next,
    int,
    pick: <T>(xs: readonly T[]) => xs[Math.floor(next() * xs.length)] as T,
    shuffle: <T>(xs: readonly T[]) => {
      const out = [...xs];
      for (let i = out.length - 1; i > 0; i -= 1) {
        const j = Math.floor(next() * (i + 1));
        [out[i], out[j]] = [out[j] as T, out[i] as T];
      }
      return out;
    },
  };
}
