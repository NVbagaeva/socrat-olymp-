/**
 * Домашнее задание — типы, общие для всех разделов.
 *
 * Задачи ДЗ хранятся готовыми (docs/kabinet-dz-8.md): условие видит
 * ученик, ответ и решение — только репетитор и только через базу.
 * Раздел (№8 и дальше №5, №7, №12) отвечает лишь за то, как собрать
 * задачи при выдаче: lib/dz/z08.ts.
 */

import type { PriznakHtml, RazborHtml } from '@/lib/vychisleniya/razbor';

/** Когда ученик видит решение. */
export type SolutionsWhen = 'instant' | 'after_submit' | 'after_due';

/** Откуда выдано ДЗ. */
export type HwOrigin = 'kabinet' | 'generator' | 'opornye' | 'trenazher' | 'oshibki';

/** Ход решения: задача — open / right / wrong / revealed; карточка-самооценка — known / repeat. */
export type HwState = 'open' | 'right' | 'wrong' | 'revealed' | 'known' | 'repeat';

/** Откуда пункт ДЗ. */
export type Istochnik = 'kartochki' | 'opornye' | 'trenazher';

/**
 * Вид ответа: number — число по правилам бланка; choice — номер
 * варианта; verno — «верно / неверно» (da / net); self — самооценка
 * карточки «Знаю / Повторить».
 */
export type AnswerKind = 'number' | 'choice' | 'verno' | 'self';

/** Шаг решения в ДЗ: подпись, выкладка, название и выделение (ОДЗ, отбор корней). */
export interface ShagDz {
  chto: string;
  tex: string;
  zag?: string;
  ton?: 'odz' | 'otbor';
}

/**
 * Решение в ДЗ — одно на все разделы: шаги, признаки делимости (№8),
 * панель под шагами (№7 «Считаем с умом»), оборот карточки. Решение
 * ДЗ этапа 3 (RazborHtml №8) — частный случай.
 */
export interface RazborDz {
  shagi: ShagDz[];
  delimost: PriznakHtml[];
  /** HTML под шагами. */
  posle?: string;
  /** Оборот карточки с проверкой. */
  oborot?: { back: string; pochemu?: string };
}

/** Подсказка-вопрос с кнопками (№7). */
export interface VoprosDz {
  voprosHtml: string;
  variantyHtml: string[];
  verno: number;
  kommentariyHtml?: string;
}

/**
 * Что видит ученик кроме условия (homework_tasks.view). Ответа здесь
 * нет никогда. Подсказки, «Запомни» и пример база вырезает сама при
 * «Без подсказок».
 */
export interface VidDz {
  /** Подсказка текстом, HTML. */
  podskazka?: string;
  /** Подсказка-вопросы (№7). */
  voprosy?: VoprosDz[];
  /** «Запомни»: правило блока или формула навыка, HTML. */
  zapomni?: string;
  /** Разобранный пример (у первой задачи пункта тренажёра). */
  primer?: { uslovieHtml: string; razbor: RazborDz; otvet: string };
  /** Варианты выбора (№8 опорные «плюс / минус»). */
  varianty?: { number: string; label: string }[];
  /** Название типа над условием, HTML. */
  tipHtml?: string;
  /** Условие — текст задачи, а не выражение (№7): набирается обычным кеглем. */
  tekst?: boolean;
  /** Карточка: вид, уровень, чертежи, оборот самооценки. */
  kartochka?: {
    tip: 'formula' | 'svoystvo' | 'chertezh' | 'verno' | 'vychislenie';
    level: string;
    figury: string[];
    figuryOborota?: string[];
    figuraNaLitse: boolean;
    /** Оборот — только у самооценки; у карточки с проверкой он в ключе. */
    back?: string;
    pochemu?: string;
    teoriya?: string;
  };
}

/** Попыток на задачу: 1, 2 или без ограничения. */
export type AttemptsLimit = 1 | 2 | null;

export interface HwSettings {
  title: string;
  note: string;
  /** ISO-время срока сдачи; null — без срока. */
  dueAt: string | null;
  attemptsLimit: AttemptsLimit;
  solutionsWhen: SolutionsWhen;
  /** «Запомни» — по умолчанию выключено. */
  showMemo: boolean;
  /** Разобранный пример — по умолчанию выключен. */
  showExample: boolean;
  /** ДЗ этапа 3: у каждого ученика свои задачи. В новых ДЗ — у пункта. */
  individual: boolean;
  /** «Без подсказок»: выключает подсказки, «Запомни» и пример. */
  noHints: boolean;
}

/** Единица пункта при выдаче: задача или карточка. */
export interface HwUnitInput {
  studentId: string | null;
  kind: string;
  ref: string;
  answerKind: AnswerKind;
  questionHtml: string;
  view: VidDz;
  /** null — самооценка. */
  answer: string | null;
  razbor: RazborDz | null;
  source: string;
}

/** Пункт ДЗ при выдаче. */
export interface HwPartInput {
  source: Istochnik;
  taskNo: number;
  ref: string;
  titleHtml: string;
  rule: Record<string, unknown>;
  perStudent: boolean;
  comment: string | null;
  units: HwUnitInput[];
}

export interface HwIssuePartsInput {
  classId: string | null;
  students: string[];
  settings: HwSettings;
  origin: HwOrigin;
  parentId: string | null;
  parts: HwPartInput[];
}

/** Пункт ДЗ так, как его видят ученик и репетитор. */
export interface HwPartView {
  id: string;
  position: number;
  source: Istochnik;
  taskNo: number;
  ref: string;
  titleHtml: string;
  rule: Record<string, unknown>;
  perStudent: boolean;
  comment: string | null;
}

/** Задача, собранная при выдаче: условие, ключ и решение. */
export interface HwTaskInput {
  /** null — задача для всех получателей. */
  studentId: string | null;
  position: number;
  /** Тип задачи: прототип «8.A». */
  kind: string;
  /** «прототип|seed|уровень» — для работы над ошибками и печати учителю. */
  ref: string;
  questionHtml: string;
  /** Нормальная запись ответа: «-2.25». */
  answer: string;
  razbor: RazborHtml;
  /** Источник — только для учителя: «банк 8.A № 3» или «новая». */
  source: string;
  comment: string | null;
}

export interface HwIssueInput {
  classId: string | null;
  students: string[];
  taskNo: number;
  settings: HwSettings;
  origin: HwOrigin;
  parentId: string | null;
  tasks: HwTaskInput[];
}

/** Задача так, как её видит ученик. */
export interface HwTaskView {
  id: string;
  position: number;
  kind: string;
  questionHtml: string;
  comment: string | null;
  studentId: string | null;
  partId: string;
  answerKind: AnswerKind;
  view: VidDz;
}

/** Ход решения задачи учеником. */
export interface HwAnswerView {
  taskId: string;
  userId: string;
  state: HwState;
  attempts: number;
  /** Что вводил: исходная запись, нормальная (или null), верно ли, когда. */
  entries: { a: string; n: string | null; ok: boolean; at: string }[];
  seconds: number;
}

export interface HwView {
  id: string;
  tutorId: string;
  classId: string | null;
  title: string;
  note: string;
  dueAt: string | null;
  createdAt: string;
  closedAt: string | null;
  taskNo: number;
  /** Разделы ДЗ по порядку пунктов. */
  sections: number[];
  attemptsLimit: AttemptsLimit;
  solutionsWhen: SolutionsWhen;
  showMemo: boolean;
  showExample: boolean;
  individual: boolean;
  noHints: boolean;
  origin: HwOrigin;
  parentId: string | null;
}

export interface HwRecipientView {
  userId: string;
  name: string;
  startedAt: string | null;
  submittedAt: string | null;
}

/** Ответ базы на проверку ответа. */
export type HwCheck =
  | {
      kind: 'right' | 'wrong';
      state: HwState;
      attempts: number;
      /** Сколько попыток осталось; null — без ограничения. */
      left: number | null;
      solution: RazborDz | null;
    }
  | { kind: 'fractionRight'; decimal: string }
  | { kind: 'format' }
  | { kind: 'closed'; state: HwState };

/** Решение задачи, когда его уже можно показать. */
export interface HwSolution {
  razbor: RazborDz;
  /** Нормальная запись ответа. */
  answer: string;
}
