/**
 * Разделы заданий: то, что раскрывается за карточкой банка.
 *
 * Сам раздел описывается здесь, а его подтемы — в data/functionTypes.ts:
 * список типов функций один на весь проект, и страница раздела берёт
 * его оттуда же, откуда карточки выбора типа и маршруты.
 *
 * Тексты берутся только из конфигов. Если поля нет — страница
 * показывает честное пустое состояние, а не придуманный текст.
 */

import { prep, prototypes } from '@/lib/graph/data/index.js';
import { functionTypes, type FunctionType } from '@/data/functionTypes';

export type { TheoryBlock, TheoryBlockType } from '@/data/functionTypes';

export type SubtopicStatus = 'active' | 'soon';

/** Подтема раздела — тот же тип функции, вид сбоку страницы раздела. */
export type Subtopic = FunctionType;

export interface ExamSection {
  /** Номер задания в экзамене, две цифры — как в банке. */
  no: string;
  /** Часть адреса: /zadaniya/{slug}. */
  slug: string;
  /** Заголовок страницы раздела. На карточке банка название другое. */
  title: string;
  /** Короткое название под заголовком: «Графики функций». */
  subtitle: string;
  description: string;
  badge?: string;
  subtopics: Subtopic[];
}

export const sections: ExamSection[] = [
  {
    no: '12',
    slug: '12',
    title: 'Задание 12',
    subtitle: 'Графики функций',
    description:
      'Научитесь распознавать графики, читать свойства функций и использовать формулы для решения задач.',
    badge: 'Базовый и средний уровни',
    subtopics: functionTypes,
  },
];

export function findSection(slug: string): ExamSection | undefined {
  return sections.find((section) => section.slug === slug);
}

export function findSubtopic(sectionSlug: string, subtopicSlug: string): Subtopic | undefined {
  return findSection(sectionSlug)?.subtopics.find((item) => item.id === subtopicSlug);
}

/* ── Параметры статического экспорта ──────────────────────────────
   Сборка без сервера: каждый динамический сегмент перечисляется
   заранее. Списки считаются из конфига, руками нигде не повторяются. */

export function sectionParams(): { task: string }[] {
  return sections.map((section) => ({ task: section.slug }));
}

export function subtopicParams(): { task: string; type: string }[] {
  return sections.flatMap((section) =>
    section.subtopics.map((item) => ({ task: section.slug, type: item.id })),
  );
}

/** Вложенные разделы существуют только у открытых подтем. */
export function activeSubtopicParams(): { task: string; type: string }[] {
  return sections.flatMap((section) =>
    section.subtopics
      .filter((item) => item.status === 'active')
      .map((item) => ({ task: section.slug, type: item.id })),
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
