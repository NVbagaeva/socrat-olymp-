/**
 * Генератор №7 «Простейшие уравнения»: слова и пресеты конфига. Группы
 * и прототипы приходят из движка (lib/zadanie7/protoInfo) через
 * lib/zadanie7/generator7.ts — здесь их не переписываем.
 */

import type { GenPreset } from '@/lib/generator/obshchiy/types';

export const GENERATOR7_TEXTS = {
  section: '№7 · Простейшие уравнения',
  sheet: {
    chip: 'Задание 7',
    title: 'Простейшие уравнения',
    course: 'Профильная математика',
    teacher: 'Багаева Н.В.',
  },
};

/**
 * Банк №7: задачи открытого банка ФИПИ и аналоги (по 20 на прототип).
 * У нескольких прототипов задач ФИПИ нет — там только аналоги.
 */
export const GENERATOR7_SOURCES = [
  {
    id: 'bank' as const,
    title: 'Только ФИПИ',
    short: 'ФИПИ',
    note: 'Открытый банк; кончились — аналоги.',
  },
  {
    id: 'mix' as const,
    title: 'Вперемешку',
    short: 'вперемешку',
    note: 'Задачи ФИПИ и аналоги через одну.',
  },
  {
    id: 'new' as const,
    title: 'Только аналоги',
    short: 'аналоги',
    note: 'Задачи «не из открытого банка».',
  },
];

/** Пресеты: ключ — группа («II») или прототип («P11»). */
export const GENERATOR7_PRESETS: GenPreset[] = [
  {
    id: 'variant',
    title: 'По группе',
    sub: '5 задач · все группы',
    variants: 1,
    levels: [],
    sostav: { I: 1, II: 1, III: 1, IV: 1, V: 1 },
  },
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
    title: 'Один тип',
    sub: 'отработать · 6 задач',
    variants: 1,
    levels: [],
    sostav: { II: 6 },
    pickTopic: 6,
  },
];
