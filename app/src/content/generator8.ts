/**
 * Генератор №8 «Вычисления»: слова и пресеты конфига. Навыки S1–S11,
 * прототипы и уровни приходят из движка (lib/vychisleniya/skills,
 * prototypes) через lib/vychisleniya/generator8.ts — здесь их не
 * переписываем.
 */

import type { GenPreset } from '@/lib/generator/obshchiy/types';

export const GENERATOR8_TEXTS = {
  section: '№8 · Вычисления и преобразования',
  sheet: {
    chip: 'Задание 8',
    title: 'Вычисления и преобразования',
    course: 'Профильная математика',
    teacher: 'Багаева Н.В.',
  },
};

/** Задачи №8 только генерируются: источник один, выбора нет. */
export const GENERATOR8_SOURCES = [
  {
    id: 'new' as const,
    title: 'Новые задачи',
    short: 'новые',
    note: 'Числа каждый раз новые.',
  },
];

/**
 * Пресеты: ключ — навык («S1») или прототип («8.A»). Уровень у №8 — на
 * весь лист: ★ — базовые задачи, ★★ — повышенные, оба — вперемешку.
 */
export const GENERATOR8_PRESETS: GenPreset[] = [
  {
    id: 'dz',
    title: 'Домашка',
    sub: '11 задач · 1 вариант',
    variants: 1,
    levels: [1],
    sostav: { S1: 1, S2: 1, S3: 1, S4: 1, S5: 1, S6: 1, S7: 1, S8: 1, S9: 1, S10: 1, S11: 1 },
    kind: 'dz',
  },
  {
    id: 'sr',
    title: 'Самостоятельная',
    sub: '6 задач · 2 варианта',
    variants: 2,
    levels: [1, 2],
    sostav: { S1: 1, S2: 1, S3: 1, S4: 1, S8: 1, S9: 1 },
    kind: 'sr',
  },
  {
    id: 'one',
    title: 'Один навык',
    sub: 'отработать · 8 задач',
    variants: 1,
    levels: [1],
    sostav: { S1: 8 },
    pickTopic: 8,
  },
];
