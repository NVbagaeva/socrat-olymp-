/**
 * Генератор №3 «Стереометрия»: слова листа и пресеты конфига. Разделы
 * I–VIII и прототипы приходят из банка (lib/zadanie3/gen/info.ts) через
 * lib/zadanie3/gen/generator3.ts — здесь их не переписываем.
 */

import { GEN_UI } from '@/content/generatorUi';
import type { GenPreset } from '@/lib/generator/obshchiy/types';
import { head, foot } from './sheet12.js';

export const GENERATOR3_TEXTS = {
  section: '№3 · Стереометрия',
  sheet: {
    chip: 'Задание 3',
    title: 'Стереометрия',
    course: head.course,
    teacher: head.author,
  },
  /* Раздел без задач открытого банка (пирамида). */
  bezBankaNote: 'нет в открытом банке',
  /* Переключатель «Дополнительно»: ракурс чертежей на листе. */
  rakurs: {
    title: 'Чертежи — как в предпросмотре',
    note: 'Повёрнутый в предпросмотре чертёж печатается в том же ракурсе. Выключено — ракурс задачи.',
  },
  nehvatka: (n: number) =>
    `В открытом банке не хватило задач: ${n} заменены задачами того же типа не из банка.`,
};

export const GENERATOR3_SOURCES = [
  {
    id: 'mix' as const,
    title: 'Банк + наши',
    short: 'банк + наши',
    note: 'Задачи открытого банка ФИПИ и наши задачи тех же типов вперемешку.',
  },
  {
    id: 'bank' as const,
    title: 'Только открытый банк',
    short: 'только банк',
    note: 'Задачи ФИПИ, такие будут на экзамене. Если их не хватит, недостающие возьмём того же типа.',
  },
  {
    id: 'new' as const,
    title: 'Только не из банка',
    short: 'не из банка',
    note: 'Задачи тех же типов, что в открытом банке, с другими числами и телами.',
  },
];

/**
 * Пресеты. Ключ состава — раздел (slug: «prizma») или прототип
 * («P03-19»). Сложность у №3 не размечена — уровни у всех одни.
 */
export const GENERATOR3_PRESETS: GenPreset[] = [
  {
    id: 'ege',
    title: 'Как на ЕГЭ',
    sub: '8 задач · 4 варианта',
    variants: 4,
    levels: [1],
    sostav: {
      parallelepiped: 1,
      prizma: 1,
      piramida: 1,
      konus: 1,
      cilindr: 1,
      shar: 1,
      'vpisannyy-cilindr': 1,
      'vpisannaya-sfera': 1,
    },
  },
  {
    id: 'dz',
    title: 'Домашка',
    sub: '6 задач · 1 вариант',
    variants: 1,
    levels: [1],
    sostav: { parallelepiped: 2, prizma: 2, cilindr: 1, konus: 1 },
    kind: 'dz',
  },
  {
    id: 'sr',
    title: 'Самостоятельная',
    sub: '6 задач · 2 варианта',
    variants: 2,
    levels: [1],
    sostav: { prizma: 2, piramida: 2, 'vpisannaya-sfera': 2 },
    kind: 'sr',
  },
  {
    id: 'one',
    title: 'Один раздел',
    sub: 'отработать · 6 задач',
    variants: 1,
    levels: [1],
    sostav: { prizma: 6 },
    pickTopic: 6,
  },
];

/** Слова листа печати. Шапка и подвал — общие со сборниками. */
export const SHEET_GEN_3 = {
  head,
  foot,
  title: { chip: 'Задание 3', text: 'Стереометрия' },
  runner: 'Задание 3 · Стереометрия',
  subtitle: 'Задания для отработки',
  vidy: GEN_UI.vidyRaboty,
  otvety: 'Ответы',
  otvetyNote: 'сквозная нумерация',
  otvet: 'Ответ',
  resheniya: 'Решения',
  variant: (n: number) => `Вариант ${n}`,
};

/** Страницы печати: кнопка и пояснение. */
export const PECHAT_GEN_3 = {
  uchenik: 'Лист ученика',
  uchitel: 'Лист учителя',
  vse: 'Все листы',
  knopka: 'Скачать PDF / Печать',
  lead: 'Листы ученика и учителя по одной ссылке — из одного и того же набора задач.',
  zagruzka: 'Собираем лист…',
  oshibka: 'Не удалось загрузить задачи. Обновите страницу.',
};
