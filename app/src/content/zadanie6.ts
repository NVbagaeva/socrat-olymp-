/**
 * Тексты раздела задания №6 «Случайные величины и распределения»:
 * шапка, вкладки, прогресс. Теория — content/teoriya6.ts.
 *
 * Вкладки «Для репетиторов» у раздела пока нет (не показывается): уроки
 * добавятся списком content/uroki6.ts и вкладкой здесь, без переделки.
 */

import type { ShapkaArt } from '@/components/tasks/IllyustratsiyaShapki';
import { OPORNYE } from './opornye';
import { taskName } from './tasks';
import type { RazdelTab } from './vkladki';

export const ZADANIE6 = {
  no: '06',
  slug: '6',
  title: taskName('6'),
  lead: 'Диаграммы Эйлера и деревья, условная вероятность, математическое ожидание, дисперсия, неравенство Чебышёва: прочитать распределение и посчитать одно число.',
  badge: 'Профильный уровень · структура 2027',
  /**
   * Иллюстрация шапки (стеклянная, как у №4, №10, №1). Пока картинки нет
   * — null, и слот в шапке не выводится, без заглушек. Когда появится:
   * исходник — assets/zadanie-06/shapka-sluchainye.png, строка в SHAPKI
   * (scripts/build-shapka.mjs), здесь — { src, width, height, shiriny }.
   */
  art: null as ShapkaArt | null,
  tabs: [
    { id: 'o-zadanii', label: 'О задании', tail: '', icon: 'sheet' },
    { id: 'teoriya', label: 'Теория', tail: 'teoriya/', icon: 'book' },
    { id: 'opornye', label: OPORNYE.title, tail: OPORNYE.tail, icon: 'target' },
    { id: 'trenazher', label: 'Тренажёр', tail: 'trenazher/', icon: 'dumbbell' },
    { id: 'generator', label: 'Генератор', tail: 'generator/', icon: 'settings' },
  ] as readonly RazdelTab[],
} as const;

/** Заголовок окна браузера: «Вкладка · Случайные величины — Будет на ЕГЭ». */
export function zadanie6Title(tab: string): string {
  return `${tab} · ${ZADANIE6.title} — Будет на ЕГЭ`;
}

export const PROGRESS_6 = {
  /** Ключ прочитанных разделов теории в lib/theoryRead. */
  teoriyaKey: '6',
} as const;
