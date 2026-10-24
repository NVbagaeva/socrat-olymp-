/**
 * Общий генератор листов: типы конфига раздела, состояния и движка.
 *
 * Конфиг описывает только то, чем разделы отличаются: темы и подтипы,
 * уровни, источники, пресеты, ограничения. Раскладка экрана, фильтры,
 * предпросмотр, комплекты — общие (components/generator/). Движок
 * раздела не меняется: его подключает адаптер (GenEngine).
 *
 * Схема согласована в docs/generator/02-design.md, раздел 8.
 */

import type { KitScope } from '@/lib/komplekt';

/** ★, ★★, ★★★. */
export type Level = 1 | 2 | 3;

/** Откуда брать задачи. */
export type SourceId = 'mix' | 'bank' | 'new';

export interface GenSubtype {
  /** Идентификатор движка: 'PR-04'. */
  id: string;
  /** Код на экране: 'ПР-04'. */
  code: string;
  title: string;
  level: Level;
  /** Задач в открытом банке; 0 — только генерируются. */
  bank: number;
}

export interface GenTopic {
  /** 'PR'. */
  id: string;
  title: string;
  /** Подпись вместо «в банке N»: «не входит в ЕГЭ». */
  note?: string;
  /** Источники, в которых тема доступна. Нет поля — во всех. */
  sources?: SourceId[];
  subtypes: GenSubtype[];
}

export interface GenPreset {
  id: string;
  title: string;
  /** «6 задач · 1 вариант». */
  sub: string;
  variants: number;
  levels: Level[];
  /**
   * Состав: тема → число задач, либо подтип → число задач. Ключ с
   * дефисом ('PR-04') — подтип, без дефиса ('PR') — тема.
   */
  sostav: Record<string, number>;
  /** «Один тип»: учитель выбирает тему, в ней столько задач. */
  pickTopic?: number;
}

export interface GenConfig {
  /** Номер раздела: '11'. */
  id: string;
  /** Область комплекта (lib/komplekt.ts). */
  scope: KitScope;
  /** Экран генератора: текущий комплект хранится по этому ключу. */
  slot: string;
  /** Раздел в «Моих комплектах»: «№11 · Текстовые задачи». */
  section: string;
  sheet: { chip: string; title: string; course: string; teacher: string };
  topics: GenTopic[];
  levels: { level: Level; words: string }[];
  sources: { id: SourceId; title: string; short: string; note: string }[];
  /** Первый — по умолчанию. */
  presets: GenPreset[];
  limits: { maxPerTopic: number; maxTasks: number; variantsMax: number };
}

/**
 * Состояние генератора. План — подтип на каждой позиции варианта, по
 * порядку листа: так состав однозначно переводится в параметры любого
 * движка, где состав — список «подтип × число».
 */
export interface GenState {
  source: SourceId;
  levels: Level[];
  variants: number;
  plan: string[];
  /** Код набора (seed). null — лист ещё не собирали. */
  seed: string | null;
  /** Замены: «вариант.позиция» → сколько раз заменяли. */
  zameny: Record<string, number>;
}

/** Задача листа для предпросмотра. */
export interface GenTask {
  /** «вариант.позиция»: ключ замены. */
  pos: string;
  no: number;
  questionHtml: string;
  answerHtml: string;
  solutionHtml: string;
  /** Задача из открытого банка ФИПИ: для строки источника в листе учителя. */
  fromBank: boolean;
}

export interface GenSheet {
  variants: GenTask[][];
  /** Предупреждение под листом: «в банке не хватило задач…». */
  note: string | null;
}

/** Адреса набора. */
export interface GenHrefs {
  student: string;
  teacher: string;
  all: string;
  /** Ссылка на набор: открывает генератор с тем же листом. */
  link: string;
}

/** Движок раздела через адаптер. Движок сам не меняется. */
export interface GenEngine {
  build: (state: GenState & { seed: string }) => Promise<GenSheet>;
  hrefs: (state: GenState & { seed: string }) => GenHrefs;
  /** Состояние из адреса генератора или листа печати; null — адрес не наш. */
  parse: (query: URLSearchParams) => (GenState & { seed: string }) | null;
  /** Подзаголовок листа: «Вариант в формате ЕГЭ». */
  subtitle: (state: GenState) => string;
}
