/**
 * «Собрать вариант»: модель варианта первой части (задания 1–13).
 *
 * Набор вариантов — один объект `VariantSet`. Из него и только из него
 * строятся все три листа (ученик, учитель, разбор для ученика): кнопки
 * печати задач не генерируют. Набор детерминирован по коду: настройки
 * состава + seed + замены дают те же задачи. Поэтому для кабинета
 * («Выдать домашнее задание») достаточно сохранить `config`, `seed` и
 * `zameny`; задачи в объекте — готовая разметка для печати.
 *
 * Разделы подключаются адаптерами (`SectionAdapter`): каждый отдаёт
 * случайную задачу по фильтрам и честно говорит, каких полей у него
 * нет (`capabilities`, `VariantTask.fallbacks`).
 */

import type { Rng } from '@/lib/veroyatnost/generator';

export type { Rng };

/** Номер задания первой части. */
export type EgeNo = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11 | 12 | 13;

export const EGE_NUMBERS: readonly EgeNo[] = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13];

/** Источник задач: только открытый банк ФИПИ, только свои, вперемешку. */
export type SourceFilter = 'fipi' | 'own' | 'mix';

/** Сложность по общей шкале генератора. */
export type Stars = 1 | 2 | 3;

/* ── Раздел ─────────────────────────────────────────────────────── */

export interface Subtype {
  /** Идентификатор в адресе и в коде варианта: короткий, латиница. */
  id: string;
  label: string;
}

/** Чего у раздела нет или есть частично — для пометок на экране. */
export interface Capabilities {
  /** Сложность размечена. false — фильтр звёзд к разделу не применяется. */
  difficulty: boolean;
  /** Есть задачи открытого банка ФИПИ. */
  fipi: boolean;
  /** Есть свои (сгенерированные, аналоги) задачи. */
  own: boolean;
  /** Ученический разбор: свой, собранный из подсказок, из шагов учителя. */
  studentSolution: 'full' | 'hints' | 'teacher';
  /** Рисунки: у всех задач, у части, нет вовсе (и не нужно). */
  figure: 'all' | 'partial' | 'none';
  /** Пометки для отчёта и режима разработчика. */
  notes: string[];
}

/** Лёгкое описание раздела: экрану фильтров движок не нужен. */
export interface SectionInfo {
  egeNumber: EgeNo;
  title: string;
  subtypes: Subtype[];
  capabilities: Capabilities;
}

/* ── Задача ─────────────────────────────────────────────────────── */

export interface TaskFilters {
  /** Подтипы раздела. null — все. */
  subtypes: readonly string[] | null;
  source: SourceFilter;
  /** Звёзды. null — любая сложность. */
  stars: readonly Stars[] | null;
  /**
   * Параллельные варианты: задача того же прототипа, что в первом
   * варианте. Не задан — любой прототип по фильтрам.
   */
  prototype?: string;
  /** Задачи, уже взятые в эту партию вариантов (`taskId`): повторов нет. */
  exclude: ReadonlySet<string>;
}

/** Поле задачи, взятое из запасного варианта. */
export type FallbackField =
  | 'difficulty'
  | 'source'
  | 'prototype'
  | 'figure'
  | 'solutionTeacher'
  | 'solutionStudent'
  | 'stars'
  | 'subtypes'
  | 'repeat';

export interface Fallback {
  field: FallbackField;
  /** Что подставлено, по-русски: для режима разработчика и учителя. */
  note: string;
}

export interface Figure {
  svg: string;
  /** Ширина рисунка на листе, мм. Не задана — по шаблону листа. */
  width?: number;
  /** Рисунок под условием, а не справа. */
  below?: boolean;
}

export interface TaskSource {
  kind: 'fipi' | 'own';
  /** «Открытый банк ФИПИ, прототип 5», «Аналог прототипа 12», «Своя». */
  label: string;
}

/** Подсказка-вопрос онлайн-тренировки: HTML, формулы набраны KaTeX. */
export interface HintStep {
  question: string;
  options: string[];
  /** Номер верного варианта. */
  correct: number;
  /** Пояснение после верного выбора. */
  comment: string | null;
}

export interface VariantTask {
  egeNumber: EgeNo;
  /** Задача в разделе: по нему исключаются повторы в партии. */
  taskId: string;
  /** Прототип: в параллельных вариантах он общий у задания k. */
  prototypeId: string;
  /** Подтип фильтра (`Subtype.id`). */
  subtype: string;
  source: TaskSource;
  difficulty: Stars | null;
  /** Условие: готовый HTML, формулы набраны KaTeX или заглушкой `.math`. */
  statement: string;
  /** Рисунок условия: без построений и без того, что «не видно». */
  figure: Figure | null;
  /** Рисунок к разбору с построениями — только для листа учителя. */
  figureTeacher: Figure | null;
  /** Ответ строкой для бланка: «2,25», «−3». */
  answer: string;
  /** Ответ, набранный KaTeX. */
  answerHtml: string;
  /** Решение для учителя по шагам (HTML). */
  solutionTeacher: string | null;
  /** Разбор для ученика: шаги словами и формулы (HTML). */
  solutionStudent: string | null;
  /**
   * Подсказки-вопросы для онлайн-тренировки (как в тренажёре раздела).
   * Нет — после ошибки разбор открывается по шагам.
   */
  hints?: HintStep[];
  /** Поля, взятые из запасного варианта. Пусто — всё своё. */
  fallbacks: Fallback[];
  /** Как восстановить задачу без сохранения разметки (кабинет). */
  ref: Record<string, string | number>;
}

/**
 * Раздел, готовый отдавать задачи. Данные банка уже загружены
 * (`SectionModule.init`). Функция не бросает: нет задачи по фильтрам —
 * `null`, и сборщик ослабит фильтры сам (с пометкой).
 */
export interface SectionAdapter {
  info: SectionInfo;
  getRandomTask(filters: TaskFilters, rng: Rng): VariantTask | null;
}

/**
 * Модуль адаптера: грузится динамически (lib/variant/load.ts), чтобы
 * экран фильтров не тянул движки разделов.
 *
 * `load` — данные банка в браузере: у разделов, чьи банки собираются
 * на сборке сайта, это JSON маршрута `/variant/dannye/zNN.json/` (ответы
 * закрыты, как в тренажёрах). В проверках на Node те же данные отдаёт
 * `lib/variant/data/zNN.ts`. Раздел без данных (задачи считаются по
 * формулам) возвращает `null`.
 */
export interface SectionModule {
  load(): Promise<unknown>;
  init(data: unknown): SectionAdapter;
}

/* ── Набор ──────────────────────────────────────────────────────── */

export type Numbering = 'ege' | 'seq';

/** Настройки состава: всё, что влияет на выбор задач. Входят в код. */
export interface VariantConfig {
  /** Включённые задания по порядку. */
  tasks: EgeNo[];
  /** Выбранные подтипы задания. Нет ключа — все подтипы. */
  subtypes: Partial<Record<EgeNo, string[]>>;
  source: SourceFilter;
  /** Звёзды. Пусто — любая сложность. */
  stars: Stars[];
  /** Вариантов в партии: 1…10. */
  count: number;
  /** Параллельные варианты: у задания k во всех вариантах один прототип. */
  parallel: boolean;
}

export const MAX_VARIANTS = 10;

/** Шапка работы: на выбор задач не влияет, в код не входит. */
export interface VariantMeta {
  /** Тип работы из списка или своё название. */
  kind: string;
  customTitle: string;
  topic: string;
  group: string;
  /** ГГГГ-ММ-ДД или пусто. */
  date: string;
  /** Время выполнения: «90 минут». */
  duration: string;
  teacher: string;
  /** «Вариант 1», «Вариант 2» … или пустое «Вариант №___». */
  variantLabels: 'numbered' | 'blank';
  numbering: Numbering;
  instruction: boolean;
  instructionText: string;
}

export interface Variant {
  /** Номер варианта в партии: 1…count. */
  index: number;
  /** Задачи по порядку заданий. Номер на листе считает лист (`Numbering`). */
  tasks: VariantTask[];
}

/** Партия вариантов: единственный источник всех листов. */
export interface VariantSet {
  /** Код партии: настройки состава + seed + замены, см. lib/variant/code.ts. */
  code: string;
  seed: string;
  /** Версия генератора: коды, собранные другой версией, могут дать другие задачи. */
  version: string;
  config: VariantConfig;
  /** Замены: «вариант.задание» → сколько раз заменяли. */
  zameny: Record<string, number>;
  variants: Variant[];
  /** Когда собран, ISO. */
  createdAt: string;
}
