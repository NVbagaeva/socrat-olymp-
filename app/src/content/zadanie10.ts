/**
 * Тексты раздела задания №10 «Задачи с прикладным (физическим)
 * содержанием»: шапка, вкладки, прогресс. Теория — content/teoriya10.ts,
 * уроки для репетитора — content/uroki10.ts.
 */

import { OPORNYE } from './opornye';
import { taskName } from './tasks';
import type { RazdelTab } from './vkladki';

export const ZADANIE10 = {
  no: '10',
  slug: '10',
  title: taskName('10'),
  lead: 'Формула из физики или экономики дана в условии: подставить числа, решить уравнение и выбрать ответ по смыслу.',
  badge: 'Профильный уровень',
  tabs: [
    { id: 'o-zadanii', label: 'О задании', tail: '', icon: 'sheet' },
    { id: 'teoriya', label: 'Теория', tail: 'teoriya/', icon: 'book' },
    { id: 'opornye', label: OPORNYE.title, tail: OPORNYE.tail, icon: 'target' },
    { id: 'trenazher', label: 'Тренажёр', tail: 'trenazher/', icon: 'dumbbell' },
    { id: 'generator', label: 'Генератор', tail: 'generator/', icon: 'settings' },
    { id: 'repetitory', label: 'Для репетиторов', tail: 'dlya-repetitorov/', icon: 'materials' },
  ] as readonly RazdelTab[],
} as const;

/** Заголовок окна браузера: «Вкладка · Задачи с физическим смыслом — Будет на ЕГЭ». */
export function zadanie10Title(tab: string): string {
  return `${tab} · ${ZADANIE10.title} — Будет на ЕГЭ`;
}

export const PROGRESS_10 = {
  /** Ключ прочитанных разделов теории в lib/theoryRead. */
  teoriyaKey: '10',
} as const;

/* ── «О задании» ─────────────────────────────────────────────────── */

export const O_ZADANII_10 = {
  title: 'Задание 10. Задачи с прикладным содержанием',
  lead: 'Ответ — целое число или конечная десятичная дробь.',
  about:
    'В задании дана формула из физики или экономики: путь при торможении, закон Ома, распад изотопа, высота мяча. Нужно подставить числа, решить получившееся уравнение или неравенство и выбрать ответ, который имеет смысл. Знать физику не нужно — все буквы объяснены в условии.',
  gruppy: 'Пять групп задач',
  gruppyLead:
    'По виду уравнения, которое получается после подстановки. Нажмите на сюжет — откроется разобранный пример.',
  shagi: [
    {
      title: 'Прочитай теорию',
      text: 'Алгоритм из шести шагов, единицы, выбор корня — и «физика в двух словах» для каждого сюжета.',
    },
    {
      title: 'Отработай навыки',
      text: 'Опорные задачи: подстановка, единицы, корни, неравенства, степени, логарифмы, углы.',
    },
    {
      title: 'Реши задачи ФИПИ',
      text: 'Тренажёр: задачи открытого банка или новые аналоги, подсказки-вопросы и разбор.',
    },
  ],
} as const;

export const TRENAZHER_10 = {
  istochniki: [
    { id: 'fipi', label: 'Только ФИПИ' },
    { id: 'analog', label: 'Сгенерированные' },
    { id: 'mix', label: 'Вперемешку' },
  ],
  teoriya: 'Повторить теорию',
  kartinka: 'Картинка к задаче',
} as const;
