/**
 * Базовая математика: типы данных раздела задания.
 *
 * Раздел базы описывается данными (content/baza), а не своей разметкой:
 * оболочка, вкладки и экраны у всех 21 задания общие (components/baza).
 * Вкладка, для которой данных ещё нет, показывает «Материал готовится».
 */

import type { Koloda } from '@/lib/kartochki/tipy';
import type { TipOtveta } from '@/lib/otvet/tipy';
import type { Rng } from '@/lib/veroyatnost/generator';

export type { TipOtveta };

/** Идентификаторы вкладок раздела базы. */
export type VkladkaBazy =
  'o-zadanii' | 'teoriya' | 'kartochki' | 'opornye' | 'trenazher' | 'generator';

/** Паспорт задания: что проверяет и как записывается ответ. */
export interface PasportZadaniya {
  /** Одна строка под заголовком: что нужно сделать в задании. */
  lead: string;
  /** Основной тип ответа номера. */
  otvet: TipOtveta;
}

/* ── Банк задач раздела ─────────────────────────────────────────
   Формат тот же, что у разделов профиля с тренажёром по банку (№6, №7,
   №10): прототип умеет подобрать числа, написать условие и решить
   задачу по шагам; в браузер уходят условие, параметры и отпечаток
   ответа (lib/baza/secret.ts), решение считается на месте. */

export type Params = Record<string, number | string | number[]>;

/** Шаг разбора: заголовок и строки (формулы — в $…$). */
export interface Etap {
  title: string;
  lines: string[];
}

/** Подсказка-вопрос тренажёра: варианты и номер верного. */
export interface HintStep {
  question: string;
  options: string[];
  correct: number;
  comment?: string;
}

export interface Resheno {
  /** Ответ в записи бланка: «0,25», «4132». */
  otvet: string;
  /** Тип lyuboe: все допустимые ответы. */
  dopustimye?: string[];
  etapy: Etap[];
  hints: HintStep[];
}

export interface Prototip {
  /** «P01» — номер прототипа в разделе. */
  id: string;
  /** Группа выбора тем (GruppaBazy.id). */
  gruppa: string;
  title: string;
  tip: TipOtveta;
  /** Сколько задач прототипа в банке. Не больше, чем разных наборов чисел. */
  zadach: number;
  generate(rng: Rng): Params;
  text(params: Params): string;
  solve(params: Params): Resheno;
  /**
   * Независимый пересчёт ответа по числам условия — другим способом,
   * чем solve (перебором, через целые). Его сверяет pnpm test:baza:
   * задача с расхождением в банк не попадает.
   */
  proverka(params: Params): string;
}

/** Группа прототипов в выборе тем тренажёра. */
export interface GruppaBazy {
  id: string;
  nazvanie: string;
  /** Значок группы, TeX. */
  znak: string;
  ton: 'blue' | 'navy' | 'orange' | 'terra' | 'green';
}

/** Задача банка на сборке: с открытым ответом. */
export interface ZadachaBazy {
  /** «P01-03». */
  id: string;
  prototypeId: string;
  params: Params;
  text: string;
  otvet: string;
  dopustimye?: string[];
  tip: TipOtveta;
}

/** Задача для браузера: ответ — отпечатком. */
export interface ZadachaLite {
  id: string;
  prototypeId: string;
  params: Params;
  text: string;
  seal: string;
}

/* ── Опорные задачи ─────────────────────────────────────────── */

export interface MikroZadacha {
  id: string;
  uslovie: string;
  otvet: string;
  podskazka: string;
  razbor: string[];
  /** Независимый пересчёт ответа (pnpm test:baza). */
  proverka: () => string;
}

export interface BlokOpornyh {
  slug: string;
  nazvanie: string;
  /** Описание для карточки блока — без формул. */
  opisanie: string;
  /** «Запомни»: правило блока, с формулами. */
  zapomni: string;
  /** Значок блока, TeX. */
  znak: string;
  zadachi: MikroZadacha[];
}

export interface NavykOpornyh {
  id: string;
  nazvanie: string;
  lead: string;
  ton: GruppaBazy['ton'];
  bloki: BlokOpornyh[];
}

/* ── Теория ─────────────────────────────────────────────────── */

/** Разобранный пример теории: условие, шаги, ответ. */
export interface PrimerTeorii {
  uslovie: string;
  shagi: string[];
  otvet: string;
}

export type BlokTeorii =
  | { vid: 'tekst'; text: string }
  | { vid: 'formula'; tex: string }
  | { vid: 'zapomni'; text: string }
  | { vid: 'vazhno'; text: string; primer: string }
  | { vid: 'layfhak'; text: string }
  | { vid: 'spisok'; punkty: string[] }
  | { vid: 'primer'; primer: PrimerTeorii };

export interface RazdelTeorii {
  id: string;
  title: string;
  bloki: BlokTeorii[];
}

/* ── Раздел целиком ─────────────────────────────────────────── */

/** Наполнение раздела задания базы. Нет поля — вкладка «готовится». */
export interface RazdelBazy {
  slug: string;
  /** Тексты «О задании»: что проверяется и типы задач. */
  oZadanii?: { title: string; text: string[]; tipy: { title: string; primer: string }[] };
  teoriya?: RazdelTeorii[];
  gruppy?: GruppaBazy[];
  prototipy?: Prototip[];
  opornye?: NavykOpornyh[];
  /** Колода карточек «Знаю / Не знаю» (формат — lib/kartochki/tipy.ts). */
  kartochki?: Koloda;
}
