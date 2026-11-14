/**
 * Генератор №11 «Текстовые задачи»: слова и пресеты конфига. Темы и
 * подтипы приходят из движка (lib/zadanie11/taxonomy.ts) через
 * lib/zadanie11/generator11.ts — здесь их не переписываем.
 */

import type { GenPreset, Level } from '@/lib/generator/obshchiy/types';
import { plural } from '@/lib/plural';
import { nomerRazdela } from '@/content/struktura';

const skolkoZadach = (n: number) => `${n} ${plural(n, 'задача', 'задачи', 'задач')}`;

export const GENERATOR11_TEXTS = {
  section: `№${nomerRazdela('tekstovye-zadachi')} · Текстовые задачи`,
  sheet: {
    chip: `Задание ${nomerRazdela('tekstovye-zadachi')}`,
    title: 'Текстовые задачи',
    course: 'Профильная математика',
    teacher: 'Багаева Н.В.',
  },
  razminkaNote: 'не входит в ЕГЭ',
  /* «Только открытый банк»: задач банка меньше, чем выбрано. Лист не
     добирает их новыми — учитель видит, сколько есть. */
  nehvatka: (x: { vBanke: number; vybrano: number; popalo: number; variants: number }) =>
    `В банке по выбранным типам ${skolkoZadach(x.vBanke)}, на ${x.variants > 1 ? 'листы' : 'лист'} попало ${x.popalo}` +
    ` из ${x.vybrano} выбранных${x.variants > 1 ? ` (${x.variants} ${plural(x.variants, 'вариант', 'варианта', 'вариантов')})` : ''}.` +
    ' Задачи ФИПИ на листе не повторяются; чтобы добрать до нужного числа, выберите «Банк + новые».',
};

export const GENERATOR11_LEVELS: { level: Level; words: string }[] = [
  { level: 1, words: 'одно уравнение первой степени' },
  { level: 2, words: 'квадратное или дробное уравнение' },
  { level: 3, words: 'система или нестандартный ход' },
];

export const GENERATOR11_SOURCES = [
  {
    id: 'mix' as const,
    title: 'Банк + новые',
    short: 'банк + новые',
    note: 'Половина — задачи открытого банка ФИПИ, половина — такие же с другими числами.',
  },
  {
    id: 'bank' as const,
    title: 'Только открытый банк',
    short: 'только банк',
    note: 'Задачи ФИПИ, такие будут на экзамене.',
  },
  {
    id: 'new' as const,
    title: 'Только новые',
    short: 'только новые',
    note: 'Задачи тех же типов с другими числами.',
  },
];

/**
 * Пресеты. «Вариант ЕГЭ» — прежний состав по умолчанию: по подтипу из
 * каждого раздела. «Один тип» заменяет бывший режим «Задания для
 * отработки» (docs/generator/02-design.md, раздел 1).
 */
export const GENERATOR11_PRESETS: GenPreset[] = [
  {
    id: 'ege',
    title: 'Вариант ЕГЭ',
    sub: '8 задач · 4 варианта',
    variants: 4,
    levels: [1, 2, 3],
    sostav: {
      'PR-04': 1,
      'SM-04': 1,
      'DP-07': 1,
      'PT-02': 1,
      'VD-05': 1,
      'OK-01': 1,
      'RB-01': 1,
      'PG-01': 1,
    },
  },
  {
    id: 'dz',
    title: 'Домашка',
    sub: '6 задач · 1 вариант',
    variants: 1,
    levels: [1, 2],
    sostav: { PR: 1, SM: 1, DP: 1, VD: 1, RB: 1, PG: 1 },
    kind: 'dz',
  },
  {
    id: 'sr',
    title: 'Самостоятельная',
    sub: '10 задач · 2 варианта',
    variants: 2,
    levels: [1, 2],
    sostav: { PR: 2, SM: 2, DP: 2, VD: 2, RB: 2 },
    kind: 'sr',
  },
  {
    id: 'one',
    title: 'Один тип',
    sub: 'отработать · 6 задач',
    variants: 1,
    levels: [1, 2, 3],
    sostav: { VD: 6 },
    pickTopic: 6,
  },
];
