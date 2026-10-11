/**
 * Тексты раздела задания №10 «Задачи с прикладным (физическим)
 * содержанием»: шапка, вкладки, прогресс. Теория — content/teoriya10.ts,
 * уроки для репетитора — content/uroki10.ts.
 */

import { taskName } from './tasks';
import type { RazdelTab } from './vkladki';

export const ZADANIE10 = {
  no: '10',
  slug: '10',
  title: taskName('10'),
  lead: 'Формула из физики или экономики дана в условии: подставить числа, решить уравнение и выбрать ответ по смыслу.',
  badge: 'Профильный уровень',
  tabs: [
    { id: 'teoriya', label: 'Теория', tail: 'teoriya/', icon: 'book' },
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
