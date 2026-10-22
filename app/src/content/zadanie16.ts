/**
 * Тексты раздела задания №16 «Неравенства»: шапка, вкладки,
 * «О задании». Главы теории — content/teoriya16.ts.
 *
 * Задания раздела составляются заново: по образцу сторонних
 * задачников, но с изменёнными числами. Сами задачники в
 * репозиторий не кладутся (scripts/check-repo-files.mjs).
 */

import { OPORNYE } from './opornye';
import { taskName } from './tasks';
import type { RazdelTab } from './vkladki';

export const ZADANIE16 = {
  no: '16',
  slug: '16',
  title: taskName('16'),
  lead: 'Решение различных видов неравенств и их систем. Использование метода интервалов.',
  badge: 'Профильный уровень',
  tabs: [
    { id: 'o-zadanii', label: 'О задании', tail: '', icon: 'sheet' },
    { id: 'teoriya', label: 'Теория', tail: 'teoriya/', icon: 'book' },
    { id: 'opornye', label: OPORNYE.title, tail: OPORNYE.tail, icon: 'target' },
    { id: 'trenazher', label: 'Тренажёр', tail: 'trenazher/', icon: 'dumbbell' },
    { id: 'generator', label: 'Генератор', tail: 'generator/', icon: 'settings' },
  ] as readonly RazdelTab[],
} as const;

/** Заголовок окна браузера: «Вкладка · Неравенство — Будет на ЕГЭ». */
export function zadanie16Title(tab: string): string {
  return `${tab} · ${ZADANIE16.title} — Будет на ЕГЭ`;
}

export const PROGRESS_16 = {
  /** Ключ прочитанных глав теории в lib/theoryRead. */
  teoriyaKey: '16',
} as const;

/* ── Вкладка «О задании» ────────────────────────────────────────── */

export const O_ZADANII_16 = {
  title: 'Задание 16. Неравенства',
  lead: 'Развёрнутый ответ: решение записывается полностью, ответ — промежутками.',
  about:
    'В задании нужно решить неравенство и записать ответ множеством на числовой прямой. Главные инструменты — равносильные переходы и метод интервалов: им посвящены первые главы теории. Каждая глава устроена одинаково — теория, разбор опорных задач и тренировочная работа из десяти заданий с проверкой ответа.',
  plan: 'Главы теории',
  kTeorii: 'Открыть теорию',
} as const;

/** Вкладки, которые ещё не собраны: честное пустое состояние. */
export const ZAGLUSHKA_16 = {
  title: 'Вкладка готовится',
  text: 'Сначала наполняем теорию: опорные задачи, тренажёр и генератор появятся вслед за ней.',
  kTeorii: 'Перейти к теории',
} as const;
