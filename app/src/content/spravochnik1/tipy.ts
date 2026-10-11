/**
 * Справочник по планиметрии (задание №1): устройство данных.
 *
 * Один источник на всё: из этих записей собираются веб-страница
 * справочника, PDF и рамки «Повторяем» в листах генератора. Для
 * вычитки автором из них же генерируется docs/spravochnik-1/soderzhanie.md
 * (scripts/build-spravochnik-1.mjs).
 *
 * Тексты — свои формулировки. Математика — в $…$, её набирает KaTeX;
 * обозначения как в остальном разделе №1: $\angle A$, $^\circ$,
 * десятичная запятая $0{,}5$, $\operatorname{tg}$.
 */

/** Одно утверждение блока: словами и, если есть, формулой. */
export interface Utverzhdenie {
  /** Полное предложение. Может содержать $…$ и **жирное**. */
  tekst: string;
  /** Формула отдельной строкой (TeX без $). */
  formula?: string;
}

/** Теорема или формула: название, формулировка словами, формула. */
export interface Teorema {
  nazvanie?: string;
  slovami: string;
  formula: string;
}

/**
 * Откуда числа примера.
 * - `fipi` — задача открытого банка (номер в Блоке 1): условие и ответ
 *   собирает прототип, ответ разбора сверяется с ним автоматически;
 * - `analog` — наш аналог прототипа (прототип, номер аналога);
 * - `svoy` — свой пример для темы без прототипа: условие пишется здесь,
 *   ответ сверяется с `znachenie`.
 */
export type IstochnikPrimera =
  { fipi: number } | { analog: { proto: number; no: number } } | { svoy: { uslovie: string } };

/** Шаг разбора: подпись этапа и что на нём делаем. */
export interface ShagPrimera {
  /** Подпись этапа: «Что знаем», «Применяем теорему», «Считаем»… */
  etap: string;
  tekst?: string;
  /** Строки выкладки (TeX без $), каждая — отдельной строкой. */
  tex?: string[];
}

export interface Primer {
  /** Короткое название хода: «Найти внешний угол». */
  title: string;
  istochnik: IstochnikPrimera;
  shagi: ShagPrimera[];
  /** Ответ в TeX: «118^\circ», «1{,}5», «10\sqrt2». */
  otvet: string;
  /** Числовое значение ответа, если его не прочитать из `otvet` (корни). */
  znachenie?: number;
}

/**
 * Что нарисовать на чертеже теории (этап 2 строит его движком).
 * В теории никаких чисел — только обозначения.
 */
export interface OpisanieChertezha {
  /** Что на чертеже: точки, отрезки, дуги, засечки, подписи. */
  chto: string;
  /** Ключевой элемент — выделяется золотисто-оранжевым. */
  vydelit: string;
}

/** Карточка-тема справочника. Блоки берутся только нужные. */
export interface Tema1 {
  /** Якорь карточки: #k-<id>. */
  id: string;
  title: string;
  /** Большая тема — на всю ширину сетки (параллельные прямые). */
  shirokaya?: boolean;
  chertezh?: OpisanieChertezha;
  opredeleniya?: Utverzhdenie[];
  svoystva?: Utverzhdenie[];
  priznaki?: Utverzhdenie[];
  teoremy?: Teorema[];
  /** «Как применять»: 2–4 типичных хода в задании №1. */
  primenenie?: string[];
  /** «Важно»: ловушка или частая ошибка. */
  vazhno?: string[];
  primery?: Primer[];
  /** «Где на ЕГЭ»: прототипы задания №1. */
  prototipy: number[];
  /**
   * Карточки прежней теории, которые эта заменяет: старые якоря
   * #k-<id> (ссылки «Повторить теорию» из тренажёра) ведут сюда.
   */
  zamenyaet?: string[];
}

export interface Razdel1 {
  no: number;
  id: string;
  title: string;
  /** Одна-две фразы о разделе. */
  lead: string;
  temy: Tema1[];
}

/** Подписи блоков — одни на веб, PDF и файл вычитки. */
export const BLOKI_SPRAVOCHNIKA = {
  opredeleniya: 'Определение',
  svoystva: 'Свойство',
  priznaki: 'Признак',
  teoremy: 'Теорема / формула',
  primenenie: 'Как применять',
  vazhno: 'Важно',
  primery: 'Пример',
  prototipy: 'Где на ЕГЭ',
} as const;

export const SPRAVOCHNIK_1 = {
  title: 'Справочник по планиметрии',
  lead: 'Всё для задания №1 первой части ЕГЭ профильного уровня',
} as const;
