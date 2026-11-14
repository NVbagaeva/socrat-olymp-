/**
 * Раздел «Наибольшее и наименьшее значение функции, точки экстремума»
 * (номер хранения 21; номер ЕГЭ — из content/struktura.js: в ЕГЭ-2027 —
 * задание 12). Шапка, вкладки, заголовки страниц.
 */

import { OPORNYE } from './opornye';
import { nomerDvumya } from './struktura';
import { taskName } from './tasks';
import type { RazdelTab } from './vkladki';

export const ZADANIE21 = {
  no: nomerDvumya('naibolshee-naimenshee'),
  slug: '21',
  title: taskName('21'),
  lead: 'Точки максимума и минимума, наибольшее и наименьшее значение на отрезке и без него. Семь видов функций — от многочлена до логарифма трёхчлена. Числа в каждой задаче свои.',
  badge: 'Профильный уровень',
  tabs: [
    { id: 'o-zadanii', label: 'О задании', tail: '', icon: 'sheet' },
    { id: 'teoriya', label: 'Теория', tail: 'teoriya/', icon: 'book' },
    { id: 'opornye', label: OPORNYE.title, tail: OPORNYE.tail, icon: 'target' },
    { id: 'trenazher', label: 'Тренажёр', tail: 'trenazher/', icon: 'dumbbell' },
  ] as readonly RazdelTab[],
} as const;

export function zadanie21Title(tab: string): string {
  return `${tab} · ${ZADANIE21.title} — Будет на ЕГЭ`;
}
