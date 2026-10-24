import type { SectionInfo } from '../../types';

/** Задание №13 «Экономические задачи»: подтипы — четыре схемы. */
export const info: SectionInfo = {
  egeNumber: 13,
  title: 'Экономические задачи',
  subtypes: [
    { id: 'A', label: 'Дифференцированный платёж' },
    { id: 'B', label: '«Поломанный» дифференцированный' },
    { id: 'C', label: 'Аннуитет' },
    { id: 'D', label: 'Вклады' },
  ],
  capabilities: {
    difficulty: true,
    fipi: true,
    own: true,
    studentSolution: 'hints',
    figure: 'none',
    notes: [
      'Источник размечен по прототипу (fipi / own), номера прототипа ФИПИ нет — только пометка «по задаче ЕГЭ-…».',
      'Сложность: база → ★, сложная → ★★★.',
      'Разбор для ученика: подсказки-вопросы + полное решение раздела.',
    ],
  },
};
