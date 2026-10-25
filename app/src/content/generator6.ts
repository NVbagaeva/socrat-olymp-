/**
 * Генератор №6 «Случайные величины»: слова и пресеты конфига. Группы
 * и прототипы приходят из движка (lib/zadanie6/protoInfo) через
 * lib/zadanie6/generator6.ts — здесь их не переписываем.
 */

import type { GenPreset } from '@/lib/generator/obshchiy/types';

export const GENERATOR6_TEXTS = {
  section: '№6 · Случайные величины',
  sheet: {
    chip: 'Задание 6',
    title: 'Случайные величины и распределения',
    course: 'Профильная математика',
    teacher: 'Багаева Н.В.',
  },
  /** Фильтр «Формулировка» — тот же, что у прежнего генератора и тренажёра. */
  filtr: {
    title: 'Формулировка',
    options: [
      { id: 'v', title: 'Все', note: 'Сюжетные и стандартные вперемешку.' },
      { id: 's', title: 'Сюжетные', note: 'Задачи с жизненными сюжетами.' },
      { id: 'f', title: 'Стандартные', note: 'Формулировки как в исходных задачах.' },
    ],
  },
};

/**
 * Банк №6: исходные задачи (демоверсия ФИПИ и образцы) — по одной-две
 * на прототип, аналогов — по 50. Не хватило задач нужного источника —
 * берётся другой.
 */
export const GENERATOR6_SOURCES = [
  {
    id: 'mix' as const,
    title: 'Вперемешку',
    short: 'вперемешку',
    note: 'Исходные задачи и аналоги через одну.',
  },
  {
    id: 'bank' as const,
    title: 'Только исходные',
    short: 'исходные',
    note: 'Демоверсия ФИПИ и образцы; кончились — аналоги.',
  },
  {
    id: 'new' as const,
    title: 'Только аналоги',
    short: 'аналоги',
    note: 'Задачи «не из открытого банка».',
  },
];

const VSE = { I: 2, II: 1, III: 6, IV: 2, V: 4 };

/** Пресеты: ключ — группа («III») или прототип («P04»). Шаблоны прежнего генератора — тоже здесь. */
export const GENERATOR6_PRESETS: GenPreset[] = [
  {
    id: 'ves',
    title: 'Весь №6',
    sub: '15 задач · по прототипу',
    variants: 1,
    levels: [],
    sostav: VSE,
  },
  {
    id: 'dz',
    title: 'Домашка',
    sub: '6 задач · все группы',
    variants: 1,
    levels: [],
    sostav: { I: 1, II: 1, III: 2, IV: 1, V: 1 },
    kind: 'dz',
  },
  {
    id: 'sr',
    title: 'Самостоятельная',
    sub: '5 задач · 2 варианта',
    variants: 2,
    levels: [],
    sostav: { I: 1, II: 1, III: 1, IV: 1, V: 1 },
    kind: 'sr',
  },
  {
    id: 'ozhidanie',
    title: 'Ожидание и дисперсия',
    sub: '10 задач · группы III и V',
    variants: 1,
    levels: [],
    sostav: { III: 6, V: 4 },
  },
  {
    id: 'diagrammy',
    title: 'Диаграммы и деревья',
    sub: '3 задачи · группы I и II',
    variants: 1,
    levels: [],
    sostav: { I: 2, II: 1 },
  },
  {
    id: 'syuzhet',
    title: 'Только сюжетные',
    sub: '15 задач · с сюжетами',
    variants: 1,
    levels: [],
    sostav: VSE,
    filtr: 's',
  },
  {
    id: 'one',
    title: 'Один тип',
    sub: 'отработать · 6 задач',
    variants: 1,
    levels: [],
    sostav: { III: 6 },
    pickTopic: 6,
  },
];
