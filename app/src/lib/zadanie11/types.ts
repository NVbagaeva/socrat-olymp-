/**
 * Модель задания №11 «Текстовые задачи».
 *
 * Раздел (ПР, СМ, ДП …) → подтип (ДП-07 «Обратный путь с
 * остановкой») → задача: параметры + что спрашивают. Условие,
 * ответ, разбор по этапам, таблица и пошаговые подсказки строит одна
 * функция подтипа `solve(params)` — и для задач открытого банка, и
 * для сгенерированных. Ответ банка в JSON — проверка этой функции.
 */

export type SectionId = 'RZ' | 'PR' | 'SM' | 'DP' | 'PT' | 'VD' | 'OK' | 'RB' | 'PG';

/** 1 — линейное уравнение, 2 — квадратное/дробное, 3 — система или нестандарт. */
export type Level = 1 | 2 | 3;

/** Параметры задачи: числа условия и выбор формы («кто спрашивается»). */
export type Params = Record<string, number | string>;

/** Карточки лайфхаков теории: ссылки из разбора. */
export type LifehackId =
  | 'root-guess'
  | 'divide-equation'
  | 'substitution'
  | 'x-x-plus-d'
  | 'fast-count'
  | 'dry-matter'
  | 'equal-mass-average'
  | 'closing-speed';

/** Этап разбора: «Шаг 1. Обозначаем» и строки с формулами в $…$. */
export interface Etap {
  title: string;
  lines: string[];
}

/**
 * Вид таблицы модели. Порядок столбцов и строк задан методикой:
 * движение — S | v | t; работа — A | p | t; концентрация —
 * развёрнутая таблица: строки m_{\text{в-ва}}, m_{\text{р-ра}}, p %, столбцы —
 * участники смешивания римскими цифрами («I», «II», «I + II»,
 * «вода»…; у равных масс звёздочка — верхний индекс: I*, II*).
 */
export type TablitsaVid = 'dvizhenie' | 'rabota' | 'koncentraciya' | 'prochee';

/** Таблица модели. Ячейки — текст с $…$. */
export interface Tablitsa {
  vid: TablitsaVid;
  /** Подпись над таблицей: «Смешали равные массы». */
  title?: string;
  head: string[];
  rows: string[][];
  /** Строка, по которой составляют уравнение: подсвечена и подписана. */
  uravnenie?: number;
}

/** Шаг подсказки: вопрос и кнопки-ответы, одна верная. */
export interface HintStep {
  question: string;
  options: string[];
  correct: number;
  /** Что сказать после верного ответа: одна строка с $…$. */
  comment?: string;
}

/** Вопрос с выбором вместо числа (РЗ-17 «что больше»). */
export interface Vybor {
  options: string[];
  correct: number;
}

export interface Solved {
  /** Условие: обычный текст, числа — как в условии ЕГЭ. */
  uslovie: string;
  /** Ответ числом: целое или конечная десятичная дробь. */
  answer: number;
  etapy: Etap[];
  /** Таблицы модели: обычно одна, для «равных масс» — две. */
  tables?: Tablitsa[];
  hints: HintStep[];
  lifehacks: LifehackId[];
  vybor?: Vybor;
}

export interface Subtype {
  /** Код: «DP-07». На сайте показывается как «ДП-07». */
  id: string;
  section: SectionId;
  title: string;
  level: Level;
  /** Слова для поиска в тренажёре: «баржа», «велосипедист». */
  keywords: string[];
  solve(params: Params): Solved;
}

/** Задача открытого банка или разминки в JSON. */
export interface BankItem {
  id: string;
  params: Params;
  answer: number;
}
