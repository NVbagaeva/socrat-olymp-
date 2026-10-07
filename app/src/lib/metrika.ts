/**
 * Цели Яндекс Метрики. Счётчик подключает components/layout/Metrika.tsx,
 * номер — content/site.ts. Пока номера нет, вызовы ничего не делают.
 *
 * В параметрах целей не бывает персональных данных: ни имени, ни почты,
 * ни текста полей — только коды вроде «rate» или номер вопроса.
 */

import { site } from '@/content/site';

type Ym = (
  id: number,
  method: 'reachGoal',
  target: string,
  params?: Record<string, string | number>,
) => void;

export function cel(name: string, params?: Record<string, string | number>): void {
  const id = Number(site.metrika.id);
  if (!id || typeof window === 'undefined') {
    return;
  }
  const ym = (window as unknown as { ym?: Ym }).ym;
  if (typeof ym === 'function') {
    ym(id, 'reachGoal', name, params);
  }
}
