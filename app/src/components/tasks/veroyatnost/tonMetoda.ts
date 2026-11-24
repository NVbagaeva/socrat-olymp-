import { GRUPPY4_TON } from '@/content/veroyatnost4';
import type { Zadanie45 } from '@/lib/veroyatnost/trening/links';
import type { Ton } from '../steklo';

/* Отдельный маленький модуль: его берут и тренажёр, и «О задании» №4/№5.
   Вкладка «О задании» не должна тянуть за собой весь тренажёр (а с ним —
   стили картинок к задачам) ради одной функции цвета. */

const TONY: Ton[] = ['blue', 'navy', 'orange', 'terra', 'green'];

/** Тон группы (метода): у №4 — из текстов раздела, у №5 — по кругу. */
export function tonMetoda(zadanie: Zadanie45, metod: string, i: number): Ton {
  return (zadanie === 4 ? GRUPPY4_TON[metod] : undefined) ?? TONY[i % TONY.length] ?? 'blue';
}
