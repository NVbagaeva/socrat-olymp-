import type { GeneratorConfig } from './types';

/**
 * №13 «Финансовая грамотность» (экономическая задача). Раздела ещё
 * нет в коде: типы А–Г заданы заказчиком, подтипы — черновик для
 * движка, банк — 0 до появления разметки задач ФИПИ.
 */
export const GENERATOR_13: GeneratorConfig = {
  id: '13',
  sheet: {
    chip: 'Задание 13',
    title: 'Финансовая математика',
    course: 'Профильная математика',
    teacher: 'Багаева Н.В.',
    workKinds: ['Тренировочный вариант', 'Самостоятельная работа', 'Домашняя работа', 'Контрольная работа', 'Задания для отработки'],
    /* Задача второй части: нужно место под решение. */
    answer: { kind: 'box', lines: 12 },
    perPage: 2,
  },
  topics: [
    { id: 'A', letter: 'А', title: 'Дифференцированный платёж', icon: 'calendar-minus', color: '#1f5fd0',
      note: 'долг уменьшается равномерно',
      subtypes: [
        { id: 'A-01', code: 'А-01', title: 'Найти общую сумму выплат', level: 1, bank: 0 },
        { id: 'A-02', code: 'А-02', title: 'Найти ставку r по сумме выплат', level: 2, bank: 0 },
        { id: 'A-03', code: 'А-03', title: 'Найти срок n по наибольшему платежу', level: 3, bank: 0 },
      ],
      theory: 'Долг каждый месяц уменьшается на $\\dfrac{S}{n}$; платёж — проценты на остаток плюс $\\dfrac{S}{n}$.' },
    { id: 'B', letter: 'Б', title: '«Поломанный» дифференцированный', icon: 'calendar-broken', color: '#7c3aed',
      note: 'долг уменьшается по таблице',
      subtypes: [
        { id: 'B-01', code: 'Б-01', title: 'Долг задан таблицей по месяцам', level: 2, bank: 0 },
        { id: 'B-02', code: 'Б-02', title: 'Первые месяцы долг не меняется', level: 3, bank: 0 },
      ] },
    { id: 'V', letter: 'В', title: 'Аннуитет', icon: 'calendar-equal', color: '#16a34a',
      note: 'равные платежи',
      subtypes: [
        { id: 'V-01', code: 'В-01', title: 'Найти платёж по сумме и сроку', level: 1, bank: 0 },
        { id: 'V-02', code: 'В-02', title: 'Сравнить срок 2 и 3 года', level: 2, bank: 0 },
        { id: 'V-03', code: 'В-03', title: 'Наименьший срок при ограничении платежа', level: 3, bank: 0 },
      ],
      theory: 'После $k$-й выплаты долг $S_k=S_{k-1}\\cdot b-x$, где $b=1+\\dfrac{r}{100}$.' },
    { id: 'G', letter: 'Г', title: 'Вклады', icon: 'piggy-bank', color: '#e07a2f',
      note: 'пополнение и проценты',
      subtypes: [
        { id: 'G-01', code: 'Г-01', title: 'Сумма на вкладе через n лет', level: 1, bank: 0 },
        { id: 'G-02', code: 'Г-02', title: 'Ежегодное пополнение', level: 2, bank: 0 },
        { id: 'G-03', code: 'Г-03', title: 'Выбор вклада: какой выгоднее', level: 3, bank: 0 },
      ] },
  ],
  levels: [
    { level: 1, words: 'подставить в формулу или таблицу' },
    { level: 2, words: 'составить уравнение' },
    { level: 3, words: 'неравенство или наибольшее/наименьшее значение' },
  ],
  /* Банка ФИПИ в разметке пока нет — фильтр «Источник» скрыт. */
  sources: ['new'],
  presets: [
    { id: 'ege', title: 'Вариант ЕГЭ', sub: '1 задача · 4 варианта',
      settings: { variants: 4, levels: [2, 3], sostav: { A: 1 }, workKind: 'Тренировочный вариант' } },
    { id: 'dz', title: 'Домашка', sub: '4 задачи · А–Г',
      settings: { variants: 1, levels: [1, 2], sostav: { A: 1, B: 1, V: 1, G: 1 }, workKind: 'Домашняя работа' } },
    { id: 'sr', title: 'Самостоятельная', sub: '4 задачи · 2 варианта',
      settings: { variants: 2, levels: [1, 2], sostav: { A: 1, B: 1, V: 1, G: 1 }, workKind: 'Самостоятельная работа' } },
    { id: 'one', title: 'Один тип', sub: 'отработать · 4 задачи',
      settings: { variants: 1, levels: [1, 2, 3], sostav: { V: 4 }, workKind: 'Задания для отработки' },
      pickTopic: { count: 4 } },
  ],
  /* Задачи длинные: не больше 3 одного типа и 6 всего. */
  limits: { maxPerTopic: 3, maxTasks: 6, variants: { min: 1, max: 8 } },
  extras: { theory: true, examples: true, qr: true },
  defaults: {
    source: 'new',
    extras: { theory: false, examples: 0, qr: false, workKind: 'Тренировочный вариант', date: '', teacher: 'Багаева Н.В.' },
  },
};
