/**
 * Тексты раздела задания №9 «Производная и первообразная».
 *
 * Здесь только то, что читается глазами: заголовок, подпись, вкладки.
 * Тексты «О задании» — в OZADANII_9 ниже, теории — в
 * theoryProizvodnaya.ts, листов — в sheet9.js. Формулы — в $…$, их
 * набирает KaTeX.
 */

import { OPORNYE } from './opornye';
import type { TutorMaterial } from './sections';
import { taskName } from './tasks';
import type { RazdelTab } from './vkladki';

export const PROIZVODNAYA = {
  no: '09',
  slug: '9',
  title: taskName('9'),
  lead: 'Пять групп прототипов: физический смысл, касательная, график функции, график производной и первообразная. Числа и графики в каждой задаче свои.',
  badge: 'Профильный уровень',
  tabs: [
    { id: 'o-zadanii', label: 'О задании', tail: '', icon: 'sheet' },
    { id: 'teoriya', label: 'Теория', tail: 'teoriya/', icon: 'book' },
    { id: 'opornye', label: OPORNYE.title, tail: OPORNYE.tail, icon: 'target' },
    { id: 'trenazher', label: 'Тренажёр', tail: 'trenazher/', icon: 'dumbbell' },
    { id: 'generator', label: 'Генератор', tail: 'generator/', icon: 'settings' },
    { id: 'repetitory', label: 'Для репетиторов', tail: 'dlya-repetitorov/', icon: 'materials' },
  ] as readonly RazdelTab[],
  /* Материалы репетитора — страница-вкладка с методикой и ссылкой на
     лист учителя генератора, поэтому меню материалов в ленте нет. */
  tutors: {
    title: 'Для репетиторов',
    lead: 'Материалы для занятий по теме «Производная и первообразная».',
    items: [] as TutorMaterial[],
  },
} as const;

/** Заголовок окна браузера: «Вкладка · Производная и первообразная — Будет на ЕГЭ». */
export function proizvodnayaTitle(tab: string): string {
  return `${tab} · ${PROIZVODNAYA.title} — Будет на ЕГЭ`;
}
