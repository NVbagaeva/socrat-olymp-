/**
 * Генераторы №4 и №5 «Вероятность»: слова и пресеты конфига. Методы и
 * сюжеты приходят из банка (lib/veroyatnost) через
 * lib/veroyatnost/generator45.ts — здесь их не переписываем.
 */

import type { GenPreset } from '@/lib/generator/obshchiy/types';

export const GENERATOR45_TEXTS = {
  teacher: 'Багаева Н.В.',
  course: 'Профильная математика',
};

/**
 * Банк №4 и №5: сюжеты задачника автора, у каждого — варианты с
 * другими числами. Источник один.
 */
export const GENERATOR45_SOURCES = [
  {
    id: 'bank' as const,
    title: 'Банк задач',
    short: 'банк',
    note: 'Сюжеты задачника, числа в каждом варианте свои.',
  },
];

/**
 * Пресеты: ключ — метод («klassicheskaya») или сюжет («p4-01»). По
 * задаче на метод — соседние задачи листа разных методов: по соседям
 * метод не угадать, как и на прежнем листе.
 */
export function presets45(metody: readonly { id: string; syuzhetov: number }[]): GenPreset[] {
  const po = (k: number) => Object.fromEntries(metody.map((m) => [m.id, k]));
  const n = metody.length;
  /* «Один метод» по умолчанию — метод с наибольшим числом сюжетов: задачи
     расходятся по сюжетам, и банку каждого хватает на два варианта. */
  const shirokiy = [...metody].sort((a, b) => b.syuzhetov - a.syuzhetov)[0]?.id ?? '';
  return [
    {
      id: 'metody',
      title: 'По задаче на метод',
      sub: `${n} задач · 1 вариант`,
      variants: 1,
      levels: [],
      sostav: po(1),
    },
    {
      id: 'dz',
      title: 'Домашка',
      sub: `${2 * n} задач · по две на метод`,
      variants: 1,
      levels: [],
      sostav: po(2),
      kind: 'dz',
    },
    {
      id: 'sr',
      title: 'Самостоятельная',
      sub: `${n} задач · 2 варианта`,
      variants: 2,
      levels: [],
      sostav: po(1),
      kind: 'sr',
    },
    {
      id: 'one',
      title: 'Один метод',
      sub: 'отработать · 6 задач',
      variants: 1,
      levels: [],
      sostav: { [shirokiy]: 6 },
      pickTopic: 6,
    },
  ];
}
