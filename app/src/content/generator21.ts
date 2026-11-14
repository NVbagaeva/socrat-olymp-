/**
 * Генератор раздела «Наибольшее и наименьшее значение функции»: слова и
 * пресеты конфига. Группы (виды функций) и прототипы приходят из движка
 * (lib/zadanie21) через lib/zadanie21/generator21.ts.
 */

import type { GenPreset } from '@/lib/generator/obshchiy/types';
import { nomerRazdela } from './struktura';

const NO = nomerRazdela('naibolshee-naimenshee');

export const GENERATOR21_TEXTS = {
  section: `№${NO} · Наибольшее и наименьшее`,
  sheet: {
    chip: `Задание ${NO}`,
    title: 'Наибольшее и наименьшее значение функции',
    course: 'Профильная математика',
    teacher: 'Багаева Н.В.',
  },
};

/** Задачи только генерируются: источник один, выбора нет. */
export const GENERATOR21_SOURCES = [
  {
    id: 'new' as const,
    title: 'Новые задачи',
    short: 'новые',
    note: 'Числа каждый раз новые, ответ — целое число или конечная десятичная дробь.',
  },
];

/** Пресеты: ключ — группа («G4») или прототип («P06»). Уровней нет. */
export const GENERATOR21_PRESETS: GenPreset[] = [
  {
    id: 'ege',
    title: 'Как на ЕГЭ',
    sub: '3 задачи · 4 варианта',
    variants: 4,
    levels: [],
    /* Три примера демоверсии: логарифм, произведение с e, многочлен. */
    sostav: { P11: 1, P06: 1, P01: 1 },
  },
  {
    id: 'dz',
    title: 'Домашка',
    sub: '8 задач · 1 вариант',
    variants: 1,
    levels: [],
    sostav: { G1: 2, G3: 1, G4: 1, G5: 2, G6: 1, G7: 1 },
    kind: 'dz',
  },
  {
    id: 'sr',
    title: 'Самостоятельная',
    sub: '10 задач · 2 варианта',
    variants: 2,
    levels: [],
    sostav: { G1: 2, G2: 1, G3: 1, G4: 2, G5: 2, G6: 1, G7: 1 },
    kind: 'sr',
  },
  {
    id: 'one',
    title: 'Один тип',
    sub: 'отработать · 6 задач',
    variants: 1,
    levels: [],
    sostav: { G4: 6 },
    pickTopic: 6,
  },
];
