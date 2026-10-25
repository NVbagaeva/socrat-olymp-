/**
 * Конфиг раздела для общего компонента <Generator>.
 *
 * Конфиг описывает только то, что отличает разделы: темы и типы,
 * уровни, режимы (как пресеты), пресеты, шапку PDF и ограничения.
 * Раскладка, фильтры, предпросмотр, PDF, ссылка на набор — общие.
 * Движок задач не меняется: конфиг ссылается на него через адаптер.
 */

/** ★, ★★, ★★★. */
export type Level = 1 | 2 | 3;

/** Откуда брать задачи. */
export type SourceId = 'bank' | 'mix' | 'new';

/** Имя пиктограммы из общего набора иконок разделов. */
export type IconName =
  | 'bolt' | 'percent' | 'flask' | 'car' | 'train' | 'boat' | 'cycle' | 'gear' | 'stairs'
  | 'calendar-minus' | 'calendar-broken' | 'calendar-equal' | 'piggy-bank';

/** Подтип: раскрывается под строкой темы («подтипы ⌄»). */
export interface SubtypeConfig {
  /** Идентификатор движка: 'PR-04', 'A-02'. */
  id: string;
  /** Код на экране: 'ПР-04'. */
  code: string;
  title: string;
  level: Level;
  /** Задач в открытом банке. 0 — только генерируются. */
  bank: number;
}

/** Тема (тип задач) — одна строка «Состава». */
export interface TopicConfig {
  /** 'PR', 'A'. Используется в адресе набора. */
  id: string;
  title: string;
  /** Короткая метка для типов, которые учитель называет буквой: «А». */
  letter?: string;
  icon: IconName;
  /** Цвет пиктограммы, из палитры сайта. */
  color: string;
  /** Подпись под названием вместо «в банке N». */
  note?: string;
  /** Тема не входит в экзаменационный вариант (разминка). */
  outsideExam?: boolean;
  subtypes: SubtypeConfig[];
  /** Короткая рамка «Повторяем» для опции «Рамка с теорией» (TeX). */
  theory?: string;
}

/** Уровень и его расшифровка словами (в фильтре и в подсказке). */
export interface LevelConfig {
  level: Level;
  /** «одно уравнение первой степени». */
  words: string;
}

/** Состояние генератора: всё, что попадает в адрес набора. */
export interface GeneratorState {
  source: SourceId;
  levels: Level[];
  variants: number;
  /** Задач по темам: { PR: 1, SM: 1 }. */
  sostav: Record<string, number>;
  /** Точная раскладка по подтипам, если учитель её раскрыл. */
  podtipy?: Record<string, number>;
  extras: ExtrasState;
  /** Код набора (seed). Тот же код — тот же лист у любого, без входа. */
  seed: string;
  /** Замены: позиция → сколько раз заменили. */
  zameny: Record<string, number>;
  /** Порядок позиций после перетаскивания. Нет — порядок тем. */
  order?: string[];
}

export interface ExtrasState {
  /** Рамка с теорией перед каждым типом. */
  theory: boolean;
  /** Разобранных примеров на тип: 0–2. */
  examples: 0 | 1 | 2;
  /** QR-код на ссылку набора в шапке листа. */
  qr: boolean;
  /** Вид работы — подзаголовок листа. */
  workKind: string;
  /** Дата на листе, ISO. Пусто — без даты. */
  date: string;
  teacher: string;
}

/**
 * Пресет — сценарий старта. Заполняет всё, дальше учитель правит.
 * Бывший блок «Режим» тоже пресет: «Один тип — отработать».
 */
export interface PresetConfig {
  id: string;
  title: string;
  /** Строка под названием: «6 задач · 1 вариант». */
  sub: string;
  settings: Pick<GeneratorState, 'variants' | 'levels' | 'sostav'> & {
    source?: SourceId;
    workKind: string;
  };
  /** Пресет просит выбрать одну тему: состав = выбранная тема × N. */
  pickTopic?: { count: number };
}

/** Шапка и поля листа. Общий стиль PDF «Будет на ЕГЭ». */
export interface SheetConfig {
  /** «Задание 11». */
  chip: string;
  /** «Текстовые задачи». */
  title: string;
  course: string;
  /** Учитель по умолчанию. */
  teacher: string;
  /** Виды работы для «Дополнительно → Вид работы». */
  workKinds: string[];
  /** Поле ответа: строка (часть 1) или место под решение (часть 2). */
  answer: { kind: 'line' } | { kind: 'box'; lines: number };
  /** Сколько задач помещается на страницу A4: для разбивки PDF. */
  perPage: number;
}

/** Ограничения состава. Нарушение — степпер «+» неактивен, подсказка под составом. */
export interface LimitsConfig {
  /** Не больше N задач одного типа в варианте. */
  maxPerTopic: number;
  /** Всего задач в варианте. */
  maxTasks: number;
  variants: { min: number; max: number };
}

/** Что показывать в «Дополнительно». Нет поля — опции нет. */
export interface ExtrasConfig {
  theory: boolean;
  examples: boolean;
  qr: boolean;
}

/**
 * Связь с движком раздела. Движок не меняется: адаптер переводит
 * GeneratorState в параметры существующего sobratList / sheetQuery.
 */
export interface EngineAdapter<List = unknown> {
  /** Собрать лист: один seed — один и тот же лист ученика и учителя. */
  build: (state: GeneratorState) => Promise<List>;
  /** Адреса печати по состоянию: /pechat/, /pechat/otvety/, /pechat/vse/. */
  printHref: (state: GeneratorState, which: 'student' | 'teacher' | 'all') => string;
}

export interface GeneratorConfig {
  /** Номер раздела: '11'. Входит в адрес набора и в «Мои комплекты». */
  id: string;
  sheet: SheetConfig;
  topics: TopicConfig[];
  levels: LevelConfig[];
  /** Доступные источники. Один источник — фильтр «Источник» скрыт. */
  sources: SourceId[];
  /** Первый — пресет по умолчанию. */
  presets: PresetConfig[];
  limits: LimitsConfig;
  extras: ExtrasConfig;
  defaults: Omit<GeneratorState, 'seed' | 'zameny' | 'order' | 'sostav' | 'variants' | 'levels'>;
}
