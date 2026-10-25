import type { GeneratorConfig } from './types';

/**
 * №11 «Текстовые задачи». Темы и числа — из lib/zadanie11/taxonomy.ts
 * и data/zadanie11/bank.json; подтипы здесь сокращены до примеров,
 * в коде они берутся из SUBTYPES движка, а не переписываются руками.
 */
export const GENERATOR_11: GeneratorConfig = {
  id: '11',
  sheet: {
    chip: 'Задание 11',
    title: 'Текстовые задачи',
    course: 'Профильная математика',
    teacher: 'Багаева Н.В.',
    workKinds: ['Тренировочный вариант', 'Самостоятельная работа', 'Домашняя работа', 'Проверочная работа', 'Контрольная работа', 'Задания для отработки'],
    answer: { kind: 'line' },
    perPage: 7,
  },
  topics: [
    { id: 'RZ', title: 'Разминка', icon: 'bolt', color: '#d97d0b', note: 'не входит в ЕГЭ', outsideExam: true,
      subtypes: [{ id: 'RZ-01', code: 'РЗ-01', title: 'Процент от числа', level: 1, bank: 0 }],
      theory: '$p\\%$ от числа — умножить на $\\dfrac{p}{100}$.' },
    { id: 'PR', title: 'Проценты', icon: 'percent', color: '#1f5fd0',
      subtypes: [
        { id: 'PR-01', code: 'ПР-01', title: 'Число по его проценту: налог, зарплата', level: 1, bank: 4 },
        { id: 'PR-02', code: 'ПР-02', title: 'Подорожало, потом подешевело', level: 1, bank: 5 },
        { id: 'PR-04', code: 'ПР-04', title: 'Рубашки и куртка: дешевле на p%, дороже на ?', level: 2, bank: 3 },
      ],
      theory: 'Увеличить на $p\\%$ — умножить на $1+\\dfrac{p}{100}$.' },
    { id: 'SM', title: 'Смеси и сплавы', icon: 'flask', color: '#0f9488',
      subtypes: [{ id: 'SM-04', code: 'СМ-04', title: 'Два сплава → третий', level: 2, bank: 9 }] },
    { id: 'DP', title: 'Движение по прямой', icon: 'car', color: '#e07a2f',
      subtypes: [{ id: 'DP-07', code: 'ДП-07', title: 'Туда и обратно с остановкой', level: 2, bank: 11 }] },
    { id: 'PT', title: 'Протяжённые тела', icon: 'train', color: '#a8500f',
      subtypes: [{ id: 'PT-02', code: 'ПТ-02', title: 'Поезд мимо поезда', level: 2, bank: 4 }] },
    { id: 'VD', title: 'Движение по воде', icon: 'boat', color: '#1a4fb0',
      subtypes: [{ id: 'VD-05', code: 'ВД-05', title: 'Скорость течения', level: 2, bank: 8 }] },
    { id: 'OK', title: 'Движение по окружности', icon: 'cycle', color: '#7c3aed',
      subtypes: [{ id: 'OK-01', code: 'ОК-01', title: 'Обгон на круг', level: 2, bank: 3 }] },
    { id: 'RB', title: 'Работа', icon: 'gear', color: '#16a34a',
      subtypes: [{ id: 'RB-01', code: 'РБ-01', title: 'Двое рабочих', level: 2, bank: 7 }] },
    { id: 'PG', title: 'Прогрессии', icon: 'stairs', color: '#db2777',
      subtypes: [{ id: 'PG-01', code: 'ПГ-01', title: 'Улитка: арифметическая прогрессия', level: 2, bank: 2 }] },
  ],
  levels: [
    { level: 1, words: 'одно уравнение первой степени' },
    { level: 2, words: 'квадратное или дробное уравнение' },
    { level: 3, words: 'система или нестандартный ход' },
  ],
  sources: ['mix', 'bank', 'new'],
  presets: [
    { id: 'ege', title: 'Вариант ЕГЭ', sub: '8 задач · 4 варианта',
      settings: { variants: 4, levels: [1, 2, 3], sostav: { PR: 1, SM: 1, DP: 1, PT: 1, VD: 1, OK: 1, RB: 1, PG: 1 }, workKind: 'Тренировочный вариант' } },
    { id: 'dz', title: 'Домашка', sub: '6 задач · 1 вариант',
      settings: { variants: 1, levels: [1, 2], sostav: { PR: 1, SM: 1, DP: 1, VD: 1, RB: 1, PG: 1 }, workKind: 'Домашняя работа' } },
    { id: 'sr', title: 'Самостоятельная', sub: '10 задач · 2 варианта',
      settings: { variants: 2, levels: [1, 2], sostav: { PR: 2, SM: 2, DP: 2, VD: 2, RB: 2 }, workKind: 'Самостоятельная работа' } },
    { id: 'one', title: 'Один тип', sub: 'отработать · 6 задач',
      settings: { variants: 1, levels: [1, 2, 3], sostav: { VD: 6 }, workKind: 'Задания для отработки' },
      pickTopic: { count: 6 } },
  ],
  limits: { maxPerTopic: 6, maxTasks: 20, variants: { min: 1, max: 8 } },
  extras: { theory: true, examples: true, qr: true },
  defaults: {
    source: 'mix',
    extras: { theory: false, examples: 0, qr: false, workKind: 'Тренировочный вариант', date: '', teacher: 'Багаева Н.В.' },
  },
};
