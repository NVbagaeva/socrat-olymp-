/**
 * Генератор №18 «Планиметрия»: слова листа, источник и пресеты. Темы —
 * группы ключевых схем, подтипы — типы задач тренажёра
 * (content/zadanie18/trenazher.ts); их собирает lib/zadanie18/gen/generator18.ts.
 */

import { GEN_UI } from '@/content/generatorUi';
import type { GenPreset } from '@/lib/generator/obshchiy/types';
import { head, foot } from './sheet12.js';

export const GENERATOR18_TEXTS = {
  section: '№18 · Планиметрия',
  sheet: {
    chip: 'Задание 18',
    title: 'Планиметрия',
    course: head.course,
    teacher: head.author,
  },
  /* «Дополнительно»: чертежи на листе. На экране сайта чертёж всегда
     цветной; на печать по умолчанию — монохромный (lib/skhemy/tema.ts). */
  cvetnye: {
    title: 'Цветные чертежи',
    note: 'В PDF и на печати — фирменные цвета. Выключено — чёрно-белые чертежи: так их видно на любом принтере.',
  },
  povtor: (n: number) =>
    `Задач одного типа на листе больше, чем вариантов чисел (по три на тип): ${n} повторяются.`,
};

/* Все задачи №18 составлены для сайта: источник один. */
export const GENERATOR18_SOURCES = [
  {
    id: 'new' as const,
    title: 'Наши задачи',
    short: 'наши',
    note: 'Задачи в формате задания 18: пункт а) — доказать, пункт б) — найти. Составлены для сайта, у каждой три набора чисел.',
  },
];

/** Пресеты. Ключ состава — тема (группа схем) или тип задачи. */
export const GENERATOR18_PRESETS: GenPreset[] = [
  {
    id: 'ege',
    title: 'По одной на тему',
    sub: '6 задач · 2 варианта',
    variants: 2,
    levels: [1, 2, 3],
    sostav: {
      treugolnik: 1,
      okruzhnost: 1,
      kasatelnye: 1,
      trapeciya: 1,
      otnosheniya: 1,
      ploshchadi: 1,
    },
  },
  {
    id: 'dz',
    title: 'Домашка',
    sub: '4 задачи · 1 вариант',
    variants: 1,
    levels: [1, 2],
    sostav: { treugolnik: 2, okruzhnost: 1, trapeciya: 1 },
    kind: 'dz',
  },
  {
    id: 'one',
    title: 'Одна тема',
    sub: 'отработать · 3 задачи',
    variants: 1,
    levels: [1, 2, 3],
    sostav: { treugolnik: 3 },
    pickTopic: 3,
  },
];

/** Слова листа печати. Шапка и подвал — общие со сборниками. */
export const SHEET_GEN_18 = {
  head,
  foot,
  title: { chip: 'Задание 18', text: 'Планиметрия' },
  runner: 'Задание 18 · Планиметрия',
  subtitle: 'Задания для отработки',
  vidy: GEN_UI.vidyRaboty,
  otvety: 'Ответы пункта б)',
  otvetyNote: 'сквозная нумерация',
  otvet: 'Ответ',
  resheniya: 'Решения',
  punktA: 'а)',
  punktB: 'б)',
  dokA: 'Доказательство пункта а)',
  reshB: 'Решение пункта б)',
  variant: (n: number) => `Вариант ${n}`,
};

/** Страницы печати: кнопка и пояснение. */
export const PECHAT_GEN_18 = {
  uchenik: 'Лист ученика',
  uchitel: 'Лист учителя',
  vse: 'Все листы',
  knopka: 'Скачать PDF / Печать',
  lead: 'Листы ученика и учителя по одной ссылке — из одного и того же набора задач.',
  zagruzka: 'Собираем лист…',
  oshibka: 'Не удалось собрать лист. Обновите страницу.',
};
