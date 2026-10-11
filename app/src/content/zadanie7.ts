/**
 * Тексты раздела задания №7 «Простейшие уравнения»: шапка, вкладки,
 * прогресс. Теория — content/teoriya7.ts.
 */

import { OPORNYE } from './opornye';
import { taskName } from './tasks';
import type { RazdelTab } from './vkladki';

export const ZADANIE7 = {
  no: '07',
  slug: '7',
  title: taskName('7'),
  lead: 'Линейные, дробные, иррациональные, показательные, логарифмические и тригонометрические уравнения: найти корень, проверить ОДЗ и выбрать нужный.',
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

/** Заголовок окна браузера: «Вкладка · Уравнения — Будет на ЕГЭ». */
export function zadanie7Title(tab: string): string {
  return `${tab} · ${ZADANIE7.title} — Будет на ЕГЭ`;
}

export const PROGRESS_7 = {
  /** Ключ прочитанных разделов теории в lib/theoryRead. */
  teoriyaKey: '7',
} as const;
