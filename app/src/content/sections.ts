/**
 * Разделы заданий: то, что раскрывается за карточкой банка.
 *
 * Раздел описывается данными, а не разметкой. Чтобы открыть задание №3,
 * достаточно добавить сюда ещё один объект: маршруты, вкладки, карточки
 * подтем и статический экспорт соберутся сами.
 *
 * Тексты берутся только отсюда. Если поля нет — страница показывает
 * честное пустое состояние, а не придуманный текст.
 */

import { prep, prototypes } from '@/lib/graph/data/index.js';

export type SubtopicStatus = 'active' | 'soon';

/** Что лежит в блоке теории. Определяет, чем блок будет наполнен. */
export type TheoryBlockType = 'definition' | 'properties' | 'chart' | 'example' | 'note';

export interface TheoryBlock {
  id: string;
  title: string;
  type: TheoryBlockType;
  /** Содержимое блока. null — материала ещё нет. */
  content: string | null;
  /** ready только тогда, когда content заполнен. */
  status: 'ready' | 'empty';
}

/**
 * Банк заданий подтемы — не сами задания, а ссылки на наборы движка
 * graph/. Задания собирает generate() по id набора и seed, поэтому
 * дублировать их здесь нечем и незачем.
 */
export interface SubtopicBank {
  /** Идентификаторы наборов подготовки: P12-1 и далее. */
  prep: string[];
  /** Идентификаторы прототипов ФИПИ: 12.A и далее. */
  prototypes: string[];
}

export interface Subtopic {
  slug: string;
  name: string;
  /** Формула в записи TeX: набирается KaTeX, обычным текстом не выводится. */
  formula: string;
  /** Короткое описание. Пустая строка — текста ещё нет, его напишет автор. */
  lead: string;
  status: SubtopicStatus;
  theory: TheoryBlock[];
  bank: SubtopicBank;
}

export interface ExamSection {
  /** Номер задания в экзамене, две цифры — как в банке. */
  no: string;
  /** Часть адреса: /zadaniya/{slug}. */
  slug: string;
  /** Заголовок страницы раздела. На карточке банка название другое. */
  title: string;
  description: string;
  badge?: string;
  subtopics: Subtopic[];
}

/* Заголовки блоков теории заданы автором. Тип блока — служебное поле:
   оно говорит, чем блок будет наполнен, и ни на один видимый текст
   не влияет. Содержимого нет ни у одного, поэтому все empty. */
const LINEAR_THEORY: TheoryBlock[] = [
  { id: 'definition', title: 'Определение и свойства линейной функции', type: 'definition', content: null, status: 'empty' },
  { id: 'chart', title: 'График и его параметры', type: 'chart', content: null, status: 'empty' },
  { id: 'coefficients', title: 'Угловой коэффициент и свободный член', type: 'properties', content: null, status: 'empty' },
  { id: 'mutual', title: 'Взаимное расположение прямых', type: 'properties', content: null, status: 'empty' },
  { id: 'examples', title: 'Примеры решения задач', type: 'example', content: null, status: 'empty' },
  { id: 'mistakes', title: 'Типичные ошибки', type: 'note', content: null, status: 'empty' },
];

/** Подтема без материала: ни теории, ни заданий в движке пока нет. */
const EMPTY_BANK: SubtopicBank = { prep: [], prototypes: [] };

export const sections: ExamSection[] = [
  {
    no: '12',
    slug: '12',
    title: '№12. Графики функций',
    description:
      'Научитесь распознавать графики, читать свойства функций и использовать формулы для решения задач.',
    badge: 'ЕГЭ 2027',
    subtopics: [
      {
        slug: 'linear',
        name: 'Линейные функции',
        formula: 'y = kx + b',
        lead: '',
        status: 'active',
        theory: LINEAR_THEORY,
        bank: {
          prep: ['P12-1', 'P12-2', 'P12-3', 'P12-4', 'P12-5'],
          prototypes: ['12.A', '12.B', '12.C', '12.D'],
        },
      },
      {
        slug: 'quadratic',
        name: 'Квадратичные функции',
        formula: 'y = ax^2 + bx + c',
        lead: '',
        status: 'soon',
        theory: [],
        bank: EMPTY_BANK,
      },
      {
        slug: 'rational',
        name: 'Дробно-рациональные',
        formula: 'y = \\dfrac{ax + b}{cx + d}',
        lead: '',
        status: 'soon',
        theory: [],
        bank: EMPTY_BANK,
      },
      {
        slug: 'exponential',
        name: 'Показательные функции',
        formula: 'y = a^x',
        lead: '',
        status: 'soon',
        theory: [],
        bank: EMPTY_BANK,
      },
      {
        slug: 'logarithmic',
        name: 'Логарифмические функции',
        formula: 'y = \\log_a x',
        lead: '',
        status: 'soon',
        theory: [],
        bank: EMPTY_BANK,
      },
      {
        slug: 'trigonometric',
        name: 'Тригонометрические',
        formula: 'y = \\sin x',
        lead: '',
        status: 'soon',
        theory: [],
        bank: EMPTY_BANK,
      },
    ],
  },
];

export function findSection(slug: string): ExamSection | undefined {
  return sections.find((section) => section.slug === slug);
}

export function findSubtopic(sectionSlug: string, subtopicSlug: string): Subtopic | undefined {
  return findSection(sectionSlug)?.subtopics.find((item) => item.slug === subtopicSlug);
}

/* ── Параметры статического экспорта ──────────────────────────────
   Сборка без сервера: каждый динамический сегмент перечисляется
   заранее. Списки считаются из конфига, руками нигде не повторяются. */

export function sectionParams(): { task: string }[] {
  return sections.map((section) => ({ task: section.slug }));
}

export function subtopicParams(): { task: string; type: string }[] {
  return sections.flatMap((section) =>
    section.subtopics.map((item) => ({ task: section.slug, type: item.slug })),
  );
}

/** Вложенные разделы существуют только у открытых подтем. */
export function activeSubtopicParams(): { task: string; type: string }[] {
  return sections.flatMap((section) =>
    section.subtopics
      .filter((item) => item.status === 'active')
      .map((item) => ({ task: section.slug, type: item.slug })),
  );
}

/* ── Связь с движком чертежей ─────────────────────────────────────
   Наборы задач живут в graph/data. Здесь только выборка по id из
   конфига подтемы: числа заданий берутся из данных движка и нигде
   не дублируются. */

interface GraphSet {
  id: string;
  title?: string;
  subtitle?: string;
  composition?: { count?: number };
}

const ALL_SETS = [...(prep as unknown as GraphSet[]), ...(prototypes as unknown as GraphSet[])];

export interface BankSet {
  id: string;
  title: string;
  subtitle: string;
  /** Сколько заданий в наборе — из composition.count самого набора. */
  count: number;
  kind: 'prep' | 'prototype';
}

function toBankSet(set: GraphSet, kind: 'prep' | 'prototype'): BankSet {
  return {
    id: set.id,
    title: set.title ?? set.id,
    subtitle: set.subtitle ?? '',
    count: set.composition?.count ?? 0,
    kind,
  };
}

/** Наборы подтемы в порядке конфига. Неизвестные id молча не теряются. */
export function bankSets(subtopic: Subtopic): BankSet[] {
  const byId = new Map(ALL_SETS.map((set) => [set.id, set]));
  const pick = (ids: string[], kind: 'prep' | 'prototype') =>
    ids.flatMap((id) => {
      const set = byId.get(id);
      return set ? [toBankSet(set, kind)] : [];
    });
  return [...pick(subtopic.bank.prep, 'prep'), ...pick(subtopic.bank.prototypes, 'prototype')];
}

/** Сколько заданий реально доступно в подтеме. Считается, не задаётся. */
export function bankTotal(subtopic: Subtopic): number {
  return bankSets(subtopic).reduce((sum, set) => sum + set.count, 0);
}
