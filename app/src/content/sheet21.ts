/**
 * Слова печатного листа раздела «Наибольшее и наименьшее значение
 * функции»: шапка, название, бегунок, подвал. Шаблон листа (lib/sheet/)
 * своих слов не содержит. Шапка и подвал — те же, что у №2, №8, №12.
 * Номер задания — только через nomerRazdela (content/struktura.js).
 */

import { nomerRazdela } from './struktura';

const NO = nomerRazdela('naibolshee-naimenshee');

export const SHEET_21 = {
  head: {
    course: 'Профильная математика',
    author: 'Багаева Н.В.',
    motto: 'Больше, чем подготовка',
  },
  title: {
    chip: `Задание ${NO}`,
    text: 'Наибольшее и наименьшее значение функции',
    subtitle: 'Задания для отработки',
  },
  runner: `Задание ${NO} · Наибольшее и наименьшее значение`,
  /* Лист учителя в «Всё одним файлом» генератора: к подзаголовку. */
  resheniya: 'Решения',
  vse: 'Листы ученика и учителя',
  pechat: 'Скачать PDF / Печать',
  pechatLead: 'В окне печати выберите «Сохранить как PDF», чтобы получить файл.',
  foot: {
    course: 'Профильная математика',
    social: [
      { icon: 'telegram', label: 't.me/budet_na_ege_math', href: 'https://t.me/budet_na_ege_math' },
      {
        icon: 'youtube',
        label: 'youtube.com/@math_princess',
        href: 'https://youtube.com/@math_princess',
      },
    ],
    rights:
      'Материалы платформы "Будет на ЕГЭ". Авторские материалы Багаевой Н.В. ' +
      'Распространение без разрешения автора запрещено.',
  },
} as const;
