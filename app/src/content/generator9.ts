/**
 * Генератор №9 «Производная»: слова и пресеты конфига. Группы I–V и
 * прототипы приходят из движка (lib/proizvodnaya/skills, prototypes)
 * через lib/proizvodnaya/generator9.ts — здесь их не переписываем.
 */

import type { GenPreset } from '@/lib/generator/obshchiy/types';

export const GENERATOR9_TEXTS = {
  section: '№9 · Производная и первообразная',
  sheet: {
    chip: 'Задание 9',
    title: 'Производная и первообразная',
    course: 'Профильная математика',
    teacher: 'Багаева Н.В.',
  },
};

/**
 * Источник один: задачи берутся из проверенных вариантов движка (20 на
 * прототип), кончились — генерируются новые. Открытого банка у №9 нет,
 * выбирать нечего.
 */
export const GENERATOR9_SOURCES = [
  {
    id: 'new' as const,
    title: 'Задачи движка',
    short: 'движок',
    note: 'Сначала проверенные варианты, затем новые.',
  },
];

/** Пресеты: ключ — группа («IV») или прототип («9.4.1»). Уровней у №9 нет. */
export const GENERATOR9_PRESETS: GenPreset[] = [
  {
    id: 'dz',
    title: 'Домашка',
    sub: '10 задач · все группы',
    variants: 1,
    levels: [],
    sostav: { I: 2, II: 2, III: 2, IV: 2, V: 2 },
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
    id: 'one',
    title: 'Одна группа',
    sub: 'отработать · 6 задач',
    variants: 1,
    levels: [],
    sostav: { IV: 6 },
    pickTopic: 6,
  },
];
