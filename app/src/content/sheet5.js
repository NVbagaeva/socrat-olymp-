/* content/sheet5.js — слова печатного сборника «Задание 5.
   Вероятности событий».

   Здесь и только здесь лежат тексты листа: подзаголовок, пункты
   «Повторяем», заголовки разделов прототипов, имена файлов. Название
   задания и строка компактной шапки — из LIST_5 в content/veroyatnost.ts,
   как на сайте; шапка и подвал общие с сборником №12 — берутся оттуда.
   Условия, рисунки и ответы задач приходят из банка lib/veroyatnost/
   и здесь не лежат.

   Порядок разделов: шесть блоков конспекта автора (их заголовки —
   из самого конспекта, lib/veroyatnost/podgotovka5.ts), затем
   прототипы задания по методам референса. */

import { head, foot } from './sheet12.js';

export { head, foot };

/** Подзаголовок под названием. Даты на листе нет намеренно. */
export const subtitle = 'Задания для отработки';

/**
 * Рамка «Повторяем:» — шесть методов одной строкой. Названия — как
 * в каталоге методов lib/veroyatnost/model.ts, формула — оттуда же,
 * по идентификатору.
 *
 * phrase — рукописная надпись на полях. Без буквы «ё»: в подмножестве
 * рукописного шрифта её нет.
 */
export const recap = {
  title: 'Повторяем:',
  methods: [
    { id: 'direct-count', name: 'Прямой пересчёт исходов' },
    { id: 'outcome-table', name: 'Таблица исходов' },
    { id: 'coordinate-line', name: 'Координатная прямая' },
    { id: 'probability-tree', name: 'Дерево: умножаем, складываем' },
    { id: 'convenient-number', name: 'Условная вероятность' },
    { id: 'formula', name: 'Формула' },
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
  { method: 'outcome-table', title: 'Прототипы: таблица исходов', note: 'условная вероятность по таблице' },
  { method: 'probability-tree', title: 'Прототипы: дерево вероятностей', note: 'вдоль пути умножаем, пути складываем' },
  { method: 'convenient-number', title: 'Прототипы: условная вероятность', note: 'доля в штуках через удобное число' },
  { method: 'formula', title: 'Прототипы: формула', note: 'сумма, произведение, противоположное событие' },
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
