/**
 * Тексты раздела задания №1 «Планиметрия»: шапка, вкладки, кольцо
 * прогресса, подписи разбора задачи. Теория — content/teoriya1.ts.
 * Формулы — в $…$, их набирает KaTeX.
 */

import { taskName } from './tasks';
import type { RazdelTab } from './vkladki';

export const ZADANIE1 = {
  no: '01',
  slug: '1',
  title: taskName('1'),
  lead: 'Углы, площади, тригонометрия острого угла и окружности — задачи по готовому чертежу. Справочник по планиметрии: тринадцать разделов, каждая формула — с чертежом и примером из открытого банка.',
  badge: 'Профильный уровень',
  tabs: [{ id: 'teoriya', label: 'Теория', tail: '', icon: 'book' }] as readonly RazdelTab[],
} as const;

/** Заголовок окна браузера: «Вкладка · Планиметрия — Будет на ЕГЭ». */
export function zadanie1Title(tab: string): string {
  return `${tab} · ${ZADANIE1.title} — Будет на ЕГЭ`;
}

export const PROGRESS_1 = {
  teoriyaKey: '1',
  label: 'разделов',
  text: (done: number, total: number) => `Прочитано ${done} из ${total} разделов`,
} as const;

/** Подписи разобранной задачи: «Пример» теории, позже — разборы тренажёра. */
export const RAZBOR_1 = {
  risunok: 'Чертёж с построениями',
  priznaki: 'Как сокращали: признаки делимости',
  sverka: 'Сверка с рисунком',
  neIzBanka: 'не из открытого банка',
  zadacha: (n: number) => `Задача ${n} открытого банка`,
} as const;
