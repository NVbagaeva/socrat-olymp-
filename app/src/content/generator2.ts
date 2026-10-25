/**
 * Генератор №2 «Векторы»: слова и пресеты конфига. Группы A–C и
 * прототипы приходят из движка (lib/vektory/prototypes) через
 * lib/vektory/generator2.ts — здесь их не переписываем.
 */

import type { GenPreset } from '@/lib/generator/obshchiy/types';

export const GENERATOR2_TEXTS = {
  section: '№2 · Векторы',
  sheet: {
    chip: 'Задание 2',
    title: 'Векторы',
    course: 'Профильная математика',
    teacher: 'Багаева Н.В.',
  },
};

/** Задачи №2 только генерируются: источник один, выбора нет. */
export const GENERATOR2_SOURCES = [
  {
    id: 'new' as const,
    title: 'Новые задачи',
    short: 'новые',
    note: 'Числа и рисунки каждый раз новые.',
  },
];

/** Пресеты: ключ — группа («B») или прототип («A6»). Уровней у №2 нет. */
export const GENERATOR2_PRESETS: GenPreset[] = [
  {
    id: 'ege',
    title: 'Вариант ЕГЭ',
    sub: '3 задачи · 4 варианта',
    variants: 4,
    levels: [],
    /* По рисунку на клетчатой сетке — как в экзаменационном варианте. */
    sostav: { A6: 1, B5: 1, C2: 1 },
  },
  {
    id: 'dz',
    title: 'Домашка',
    sub: '6 задач · 1 вариант',
    variants: 1,
    levels: [],
    sostav: { A: 2, B: 3, C: 1 },
    kind: 'dz',
  },
  {
    id: 'sr',
    title: 'Самостоятельная',
    sub: '10 задач · 2 варианта',
    variants: 2,
    levels: [],
    sostav: { A: 4, B: 4, C: 2 },
    kind: 'sr',
  },
  {
    id: 'one',
    title: 'Один тип',
    sub: 'отработать · 6 задач',
    variants: 1,
    levels: [],
    sostav: { B: 6 },
    pickTopic: 6,
  },
];
