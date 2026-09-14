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

/** Иконка карточки формулировки. Рисуется инлайновым SVG в проекте. */
export type FormulationIconId = 'value' | 'argument' | 'abscissa' | 'ordinate';

/** Одна из типичных формулировок задания. Тексты финальные, из макета. */
export interface Formulation {
  /** Номер на карточке: 01 … 04. */
  no: string;
  title: string;
  /** Что требуется одной строкой. */
  hint: string;
  icon: FormulationIconId;
  /** Формула примера в записи TeX. Нет — карточка без примера. */
  formula?: string;
  /** Условие примера обычным текстом. */
  example?: string;
}

/** Вкладка «О задании»: всё её содержимое приходит отсюда. */
export interface SectionAbout {
  /** Заголовок блока под номером задания. */
  title: string;
  description: string;
  /** Текст плашки-подсказки рядом с описанием. */
  hint: string;
  formsTitle: string;
  forms: Formulation[];
  skillsTitle: string;
  skills: string[];
  /** Блок-анонс: раздел, до которого дело дойдёт позже. */
  later: { title: string; text: string; action: string };
}

/** Материалы для репетиторов: отдельная страница, две карточки. */
export interface TutorMaterial {
  id: string;
  title: string;
  lead: string;
}

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
  /** Подсказка внизу окна выбора типа функции. */
  dialogHint: string;
  /** Вкладка «О задании» страницы подтемы. */
  about: SectionAbout;
  /** Страница «Для репетиторов»: заголовок, подзаголовок и карточки. */
  tutors: { title: string; lead: string; items: TutorMaterial[] };
  /** Шапка страницы подтемы: одна на все типы функций раздела. */
  topic: {
    badge: string;
    lead: string;
    quote: { text: string; author: string };
    /** Рукописная подпись под содержанием темы. */
    note: string;
  };
  subtopics: Subtopic[];
}

/* Одна и та же авторская подсказка стоит и в окне выбора типа функции,
   и на плашке вкладки «О задании»: текст записан один раз. */
const HINT_12 = 'Разные функции — разные истории, но одна идея: график всегда говорит правду.';

export const sections: ExamSection[] = [
  {
    no: '12',
    slug: '12',
    title: 'Задание 12',
    subtitle: 'Графики функций',
    description:
      'Научитесь распознавать графики, читать свойства функций и использовать формулы для решения задач.',
    badge: 'Базовый и средний уровни',
    dialogHint: HINT_12,
    about: {
      title: 'Графики функций',
      description:
        'В задании №12 вам могут предложить найти значение функции, аргумент или координаты точки пересечения графиков. Ниже — самые типичные формулировки этого задания.',
      hint: HINT_12,
      formsTitle: 'Возможные формулировки',
      forms: [
        {
          no: '01',
          title: 'Найти значение функции',
          hint: 'Найти y, если известен x.',
          icon: 'value',
          formula: 'f(x) = 2x + 3',
          example: 'Найдите f(4).',
        },
        {
          no: '02',
          title: 'Найти аргумент',
          hint: 'Найти x, если известно y.',
          icon: 'argument',
          formula: 'f(x) = 2x + 3',
          example: 'Найдите x, если f(x) = 11.',
        },
        {
          no: '03',
          title: 'Найти абсциссу точки пересечения',
          hint: 'Найти x точки пересечения графиков функций.',
          icon: 'abscissa',
        },
        {
          no: '04',
          title: 'Найти ординату точки пересечения',
          hint: 'Найти y точки пересечения графиков функций.',
          icon: 'ordinate',
        },
      ],
      skillsTitle: 'Что нужно уметь для задания №12',
      skills: [
        'Читать график функции',
        'Находить значение функции по графику',
        'Находить аргумент по заданному значению',
        'Находить координаты точки пересечения графиков',
        'Понимать основные виды функций',
        'Определять свойства графика',
      ],
      later: {
        title: 'Это пригодится позже',
        text: 'В дальнейшем, при подготовке к заданию №19 с параметрами, нам понадобится уметь работать с уравнениями различных геометрических фигур. Сейчас наша задача — уверенно работать с графиками функций. Подробнее разбирать эти темы будем в разделе задания №19.',
        action: 'Подробнее о №19',
      },
    },
    tutors: {
      title: 'Для репетиторов',
      lead: 'Материалы для занятий по теме «Графики функций».',
      items: [
        {
          id: 'workbook',
          title: 'Рабочая тетрадь для репетиторов',
          lead: 'Готовые материалы для занятий',
        },
        {
          id: 'pdf',
          title: 'PDF-практикум',
          lead: 'Все задания по теме в одном файле',
        },
      ],
    },
    topic: {
      badge: 'Базовый и средний уровень',
      lead: 'Теория, графики и приёмы, которые понадобятся для решения задания №12.',
      quote: {
        text: 'Всё, что можно измерить, можно описать функциями.',
        author: 'Г. Галилей',
      },
      note: 'Математика — это не про числа, а про понимание зависимостей.',
    },
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
