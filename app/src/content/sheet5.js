/* content/sheet5.js — слова печатного сборника «Задание 5.
   Вероятность: сложная».

   Здесь и только здесь лежат тексты листа: подзаголовок, пункты
   «Повторяем», заголовки разделов прототипов, имена файлов. Название
   задания и строка компактной шапки — из LIST_5 в content/veroyatnost.ts,
   как на сайте; шапка и подвал общие с сборником №12 — берутся оттуда.
   Условия, рисунки и ответы задач приходят из банка lib/veroyatnost/
   и здесь не лежат.

   Порядок разделов: шесть блоков опорных задач
   (lib/veroyatnost/podgotovka5.ts), затем прототипы задания по
   методам референса. */

import { head, foot } from './sheet12.js';

export { head, foot };

/** Подзаголовок под названием. Даты на листе нет намеренно. */
export const subtitle = 'Задания для отработки';

/**
 * Рамка «Повторяем:» — шесть методов задания №5. Название берётся из
 * списка методов сайта (lib/veroyatnost/metody5.ts) по `metod`, формула
 * — тоже оттуда, а если у метода её нет, — из `formula` пункта.
 *
 * phrase — рукописная надпись на полях. Без буквы «ё»: в подмножестве
 * рукописного шрифта её нет.
 */
export const recap = {
  title: 'Повторяем:',
  methods: [
    { metod: 'nesovmestnye' },
    { metod: 'protivopolozhnoe' },
    { metod: 'koordinatnaya' },
    { metod: 'sovmestnye' },
    { metod: 'nezavisimye', formula: 'P(A \\cap B) = P(A) \\cdot P(B)' },
    { metod: 'uslovnaya', formula: 'P(A \\mid B) = \\dfrac{P(A \\cap B)}{P(B)}' },
  ],
  phrase: 'Узнать структуру условия и выбрать метод',
};

/**
 * Разделы прототипов по методам — после блоков конспекта. Прототип
 * попадает в раздел по своей методике; метод без прототипов в банке
 * (прямой пересчёт, координатная прямая) раздела не получает.
 * note — приписка справа в полосе заголовка.
 */
export const prototypeSections = [
  {
    method: 'outcome-table',
    title: 'Прототипы: таблица исходов',
    note: 'условная вероятность по таблице',
  },
  {
    method: 'probability-tree',
    title: 'Прототипы: дерево вероятностей',
    note: 'вдоль пути умножаем, пути складываем',
  },
  {
    method: 'convenient-number',
    title: 'Прототипы: удобное число',
    note: 'считаем в штуках из 100 или 10 000',
  },
  {
    method: 'formula',
    title: 'Прототипы: формула',
    note: 'сумма, произведение, противоположное событие',
  },
];

/** Раздел «Ответы» файла для учителя. */
export const otvety = { title: 'Ответы', note: 'по разделам, сквозная нумерация' };

/** Названия файлов сборника. */
export const files = {
  uchenik: 'zadanie-5-veroyatnosti-sobytiy-uchenik',
  uchenikChb: 'zadanie-5-veroyatnosti-sobytiy-uchenik-chb',
  uchitel: 'zadanie-5-veroyatnosti-sobytiy-uchitel',
  uchitelChb: 'zadanie-5-veroyatnosti-sobytiy-uchitel-chb',
};

const content = { head, foot, subtitle, recap, prototypeSections, otvety, files };

export default content;
