/**
 * Тексты раздела задания №10 «Задачи с прикладным (физическим)
 * содержанием»: шапка, вкладки, прогресс. «О задании», тренажёр и опорные
 * в «Стеклянной сцене» — content/prikladnye10.ts. Теория — content/teoriya10.ts,
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
