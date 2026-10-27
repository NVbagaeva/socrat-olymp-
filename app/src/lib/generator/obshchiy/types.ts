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
  /** Название с формулами, набранное KaTeX; нет — title текстом. */
  titleHtml?: string;
  level: Level;
  /**
   * Уровни, которые подтип умеет, если их несколько (№8: почти каждый
   * прототип даёт и базовую задачу, и повышенную). Нет — только level.
   */
  levels?: Level[];
  /** Задач в открытом банке; 0 — только генерируются. */
  bank: number;
}

export interface GenTopic {
  /** 'PR'. */
  id: string;
  title: string;
  /** Название с формулами, набранное KaTeX; нет — title текстом. */
  titleHtml?: string;
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
   * Состав: тема → число задач, либо подтип → число задач. Ключ —
   * id темы ('PR', 'IV') или подтипа ('PR-04', 'p05').
   */
  sostav: Record<string, number>;
  /** «Один тип»: учитель выбирает тему, в ней столько задач. */
  pickTopic?: number;
  /** Вид работы в шапке листа (GenConfig.extras.kinds); нет — по составу. */
  kind?: string;
  /** Значение фильтра раздела (GenConfig.filtr); нет — первое. */
  filtr?: string;
  /** Свой заголовок листа вместо вида работы из списка (№13: «Разминка»). */
  svoy?: string;
  /** Переключатель раздела (GenConfig.extras.flag); нет — как был. */
  flag?: boolean;
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
  /** Уровни сложности; пусто — у раздела их нет: фильтра и «Другого уровня» нет. */
  levels: { level: Level; words: string }[];
  /**
   * false — уровень задаётся на весь лист (№8: движок получает его вместе
   * с прототипом), у отдельной задачи «Другого уровня» нет.
   */
  taskLevel?: false;
  sources: { id: SourceId; title: string; short: string; note: string }[];
  /**
   * Фильтр задач раздела рядом с источником: у №6 — «Формулировка»
   * (сюжетные, стандартные, все). Нет поля — фильтра нет. Первое
   * значение — по умолчанию.
   */
  filtr?: { title: string; options: { id: string; title: string; note: string }[] };
  /** Первый — по умолчанию. */
  presets: GenPreset[];
  limits: { maxPerTopic: number; maxTasks: number; variantsMax: number };
  /**
   * «Дополнительно» к листу; нет поля — раздел его не поддерживает.
   * theory, examples: false — рамки теории или разобранных примеров у
   * раздела нет, переключателя тоже.
   */
  extras?: {
    kinds: { id: string; title: string }[];
    theory?: boolean;
    /** Подпись памятки, если она стоит не перед каждым типом (№13 — одна рамка в начале). */
    teoriyaNote?: string;
    examples?: boolean;
    /**
     * Уроков в серии (№9): один код комплекта — серия листов, урок 2, 3, …
     * берёт следующие задачи банка. Нет поля — серии у раздела нет.
     */
    seriya?: number;
    /**
     * Переключатель раздела в «Дополнительно» (у №10 — «Картинки
     * сюжетов»): по умолчанию выключен. Нет поля — переключателя нет.
     */
    flag?: { title: string; note: string };
    /**
     * Выбор раздела в «Дополнительно» (у №13 — «Лист учителя»: только
     * ответы, краткие решения, полные). Нет поля — выбора нет.
     */
    vybor?: { title: string; options: { id: string; title: string }[]; poUmolchaniyu: string };
  };
}

/**
 * «Дополнительно» (docs/generator/02-design.md, макет А): что лист
 * получает сверх задач. Всё — в ссылке на набор.
 */
export interface GenExtras {
  /** Рамка «Повторяем» с теорией перед типом задач. */
  theory: boolean;
  /** Разобранных примеров на тип. */
  examples: 0 | 1 | 2;
  /** QR-код на лист ученика. */
  qr: boolean;
  /** Вид работы в шапке: id из GenConfig.extras.kinds, SVOY_VID — свой заголовок; null — по составу. */
  kind: string | null;
  /** Свой заголовок (kind === SVOY_VID). */
  svoy?: string;
  /** Дата на листе, «2026-10-24»; пусто — пустая линия. */
  date: string;
  teacher: string;
  /** Урок серии с нуля (GenConfig.extras.seriya); 0 — первый урок. */
  urok: number;
  /** Переключатель раздела (GenConfig.extras.flag); нет — выключен. */
  flag?: boolean;
  /** Выбор раздела (GenConfig.extras.vybor); нет — по умолчанию. */
  vybor?: string;
}

/**
 * Позиция плана: подтип и номер внутри подтипа. Номер не меняется, пока
 * позиция в составе: по ключу «PR-04_0» движок держит задачу на месте,
 * что бы ни менялось вокруг — темы, порядок, соседние задачи.
 */
export interface GenSlot {
  id: string;
  k: number;
}

/**
 * Состояние генератора. План — позиции варианта по порядку листа: так
 * состав однозначно переводится в параметры движка.
 */
export interface GenState {
  source: SourceId;
  levels: Level[];
  variants: number;
  plan: GenSlot[];
  /** Код набора (seed). null — лист ещё не собирали. */
  seed: string | null;
  /** Замены: «вариант.ключ позиции» («2.PR-04_0») → сколько раз заменяли. */
  zameny: Record<string, number>;
  extras: GenExtras;
  /** Значение фильтра раздела (GenConfig.filtr). */
  filtr?: string;
  /**
   * Набор открыт по адресу прежнего генератора: лист собирается по
   * старой схеме, как был напечатан. Значение понимает адаптер раздела:
   * у №11 и №1 — код режима листа из того адреса («v», «o»), у №2 —
   * сам прежний адрес. Первая правка состава переводит набор на ключи
   * позиций.
   */
  legacy?: string;
}

/** Задача листа для предпросмотра. */
export interface GenTask {
  /** «вариант.ключ позиции»: ключ замены. */
  pos: string;
  no: number;
  questionHtml: string;
  answerHtml: string;
  solutionHtml: string;
  /** Задача из открытого банка ФИПИ: для строки источника в листе учителя. */
  fromBank: boolean;
  /** Перед задачей на листе: рамка теории и разобранные примеры, HTML. */
  lead?: string;
  /** Чертёж условия, SVG; у учителя — чертёж со всеми построениями. */
  figureSvg?: string | null;
  figureTeacherSvg?: string | null;
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
  /** Онлайн-набор (№13): ученик решает и проверяет ответы; QR-код ведёт сюда. */
  online?: string;
}

/** Движок раздела через адаптер. Движок сам не меняется. */
export interface GenEngine {
  build: (state: GenState & { seed: string }) => Promise<GenSheet>;
  hrefs: (state: GenState & { seed: string }) => GenHrefs;
  /** Состояние из адреса генератора или листа печати; null — адрес не наш. */
  parse: (query: URLSearchParams) => (GenState & { seed: string }) | null;
  /** Подзаголовок листа: «Вариант в формате ЕГЭ». */
  subtitle: (state: GenState) => string;
  /**
   * Лист с адреса прежнего генератора умеет замены по-старому. Нет —
   * «Заменить» на таком листе сначала переводит набор на ключи позиций.
   */
  legacyZameny?: boolean;
  /**
   * Лист в формате варианта ЕГЭ, когда вид работы «по составу» (№11,
   * №1: несколько тем). Нет — такого листа у раздела нет.
   */
  formatEge?: (state: GenState) => boolean;
}
