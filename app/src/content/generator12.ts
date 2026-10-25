/**
 * Генератор №12 «Графики функций»: слова и пресеты конфига. Типы
 * функций и наборы прототипов приходят из манифеста движка graph/
 * через lib/ves12/generator12.ts — здесь их не переписываем.
 */

import type { GenPreset } from '@/lib/generator/obshchiy/types';

export const GENERATOR12_TEXTS = {
  /** Раздел в «Моих комплектах» генератора по всем типам. */
  sectionVse: '№12 · Все типы функций',
  sheet: {
    chip: 'Задание 12',
    course: 'Профильная математика',
    teacher: 'Багаева Н.В.',
  },
};

/** Задачи №12 строит движок по прототипам открытого банка: источник один. */
export const GENERATOR12_SOURCES = [
  {
    id: 'new' as const,
    title: 'Задачи движка',
    short: 'движок',
    note: 'Прототипы открытого банка ФИПИ, числа каждый раз новые.',
  },
];

/**
 * Пресеты генератора по всем типам: ключ — тип функции («quadratic»)
 * или набор («12Q.B»). Уровень — на весь лист: ★ — базовый.
 */
export function presetsVse(tipy: readonly string[]): GenPreset[] {
  const po = (n: number) => Object.fromEntries(tipy.map((t) => [t, n]));
  return [
    {
      id: 'ege',
      title: 'По задаче на тип',
      sub: `${tipy.length} задач · 1 вариант`,
      variants: 1,
      levels: [1, 2],
      sostav: po(1),
    },
    {
      id: 'dz',
      title: 'Домашка',
      sub: `${tipy.length * 2} задач · 1 вариант`,
      variants: 1,
      levels: [1],
      sostav: po(2),
      kind: 'dz',
    },
    {
      id: 'sr',
      title: 'Самостоятельная',
      sub: `${tipy.length} задач · 2 варианта`,
      variants: 2,
      levels: [1, 2],
      sostav: po(1),
      kind: 'sr',
    },
    {
      id: 'one',
      title: 'Один тип',
      sub: 'отработать · 6 задач',
      variants: 1,
      levels: [1],
      sostav: { [tipy[0] ?? 'linear']: 6 },
      pickTopic: 6,
    },
  ];
}

/** Пресеты вкладки подтемы: один тип, его наборы. */
export function presetsPodtemy(tip: string, nabory: readonly string[]): GenPreset[] {
  return [
    {
      id: 'dz',
      title: 'Домашка',
      sub: '8 задач · 1 вариант',
      variants: 1,
      levels: [1],
      sostav: { [tip]: 8 },
      kind: 'dz',
    },
    {
      id: 'sr',
      title: 'Самостоятельная',
      sub: '5 задач · 2 варианта',
      variants: 2,
      levels: [1, 2],
      sostav: { [tip]: 5 },
      kind: 'sr',
    },
    {
      id: 'vse',
      title: 'Все наборы',
      sub: `по задаче · ${nabory.length} задач`,
      variants: 1,
      levels: [1, 2],
      sostav: Object.fromEntries(nabory.map((id) => [id, 1])),
    },
  ];
}
