/**
 * Генератор №1 «Планиметрия»: слова и пресеты конфига. Блоки I–X и
 * прототипы приходят из движка (lib/planimetriya/trenazher/dannye.ts)
 * через lib/planimetriya/generator1.ts — здесь их не переписываем.
 */

import type { GenPreset, Level } from '@/lib/generator/obshchiy/types';

export const GENERATOR1_TEXTS = {
  section: '№1 · Планиметрия',
  sheet: {
    chip: 'Задание 1',
    title: 'Планиметрия',
    course: 'Профильная математика',
    teacher: 'Багаева Н.В.',
  },
  /* Блок X — задачи курса, которых нет в открытом банке. */
  bezBankaNote: 'нет в открытом банке',
  nehvatka: (n: number) => `В открытом банке не хватило задач: ${n} заменены новыми того же типа.`,
};

/** Уровень прототипа считает движок (urovenPrototipa): по числу шагов решения. */
export const GENERATOR1_LEVELS: { level: Level; words: string }[] = [
  { level: 1, words: 'одно свойство или формула' },
  { level: 2, words: 'два-три шага решения' },
  { level: 3, words: 'длинное решение' },
];

export const GENERATOR1_SOURCES = [
  {
    id: 'mix' as const,
    title: 'Банк + новые',
    short: 'банк + новые',
    note: 'Половина — задачи открытого банка, половина — новые: другие числа, фигура повёрнута.',
  },
  {
    id: 'bank' as const,
    title: 'Только открытый банк',
    short: 'только банк',
    note: 'Задачи ФИПИ, такие будут на экзамене. Чертёж — как в банке.',
  },
  {
    id: 'new' as const,
    title: 'Только новые',
    short: 'только новые',
    note: 'Задачи тех же типов: другие числа и буквы, фигура повёрнута или отражена.',
  },
];

/**
 * Пресеты. «Вариант ЕГЭ» — прежний состав по умолчанию: по прототипу из
 * блоков I–VIII. Ключ — блок («IV») или прототип («p05»).
 */
export const GENERATOR1_PRESETS: GenPreset[] = [
  {
    id: 'ege',
    title: 'Вариант ЕГЭ',
    sub: '8 задач · 4 варианта',
    variants: 4,
    levels: [1, 2, 3],
    sostav: { p01: 1, p05: 1, p13: 1, p17: 1, p24: 1, p35: 1, p41: 1, p46: 1 },
  },
  {
    id: 'dz',
    title: 'Домашка',
    sub: '6 задач · 1 вариант',
    variants: 1,
    levels: [1, 2],
    sostav: { I: 1, II: 1, III: 1, IV: 1, V: 1, VI: 1 },
    kind: 'dz',
  },
  {
    id: 'sr',
    title: 'Самостоятельная',
    sub: '10 задач · 2 варианта',
    variants: 2,
    levels: [1, 2],
    sostav: { I: 2, III: 2, V: 2, VI: 2, VIII: 2 },
    kind: 'sr',
  },
  {
    id: 'one',
    title: 'Один тип',
    sub: 'отработать · 6 задач',
    variants: 1,
    levels: [1, 2, 3],
    sostav: { VI: 6 },
    pickTopic: 6,
  },
];
