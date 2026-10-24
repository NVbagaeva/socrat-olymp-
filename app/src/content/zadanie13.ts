/**
 * Тексты раздела задания №13 «Экономические задачи»: шапка, вкладки,
 * заглушки ещё не готовых вкладок. Теория — content/teoriya13.ts.
 * Раздел собирается по плану docs/13-economics/02-design.md.
 */

import { OPORNYE } from './opornye';
import { taskName } from './tasks';
import type { RazdelTab } from './vkladki';

export const ZADANIE13 = {
  no: '13',
  slug: '13',
  title: taskName('13'),
  lead: 'Кредиты и вклады: дифференцированный платёж, аннуитет, вклады. Часть 1, краткий ответ, 1 балл.',
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

/** Заголовок окна браузера: «Вкладка · Экономические задачи — Будет на ЕГЭ». */
export function zadanie13Title(tab: string): string {
  return `${tab} · ${ZADANIE13.title} — Будет на ЕГЭ`;
}

/** Вкладка ещё не готова: что в ней будет. */
export const ZAGLUSHKI_13: Record<string, { title: string; text: string }> = {
  'o-zadanii': {
    title: 'Раздел готовится',
    text: 'Скоро здесь появятся карточки четырёх схем — дифференцированный платёж, «поломанный» дифференцированный, аннуитет и вклады — с разобранными примерами. Теория уже готова.',
  },
  opornye: {
    title: 'Опорные задачи готовятся',
    text: '17 блоков по 10 задач: от «таблицы руками» до задач на целый вклад. С пошаговыми подсказками.',
  },
  trenazher: {
    title: 'Тренажёр готовится',
    text: 'Два режима проверки: «Ответ», как на ЕГЭ, и «С оформлением» — таблица по строкам и выбор уравнения.',
  },
  generator: {
    title: 'Генератор готовится',
    text: 'Домашка, самостоятельная, зачёт: лист ученика и лист учителя из одного набора, с QR-кодом.',
  },
  repetitory: {
    title: 'Материалы для репетиторов готовятся',
    text: 'Шесть уроков с листами, карточки «Определи тип», заметки «как объяснять» и «типичные ошибки».',
  },
};
