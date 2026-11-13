/**
 * Тренировка №13 на общем тренажёре по банку (lib/trening/bank.ts).
 *
 * Ключ задачи — «A-01|b3»: прототип и seed банка раздела (lib/zadanie13/
 * bank.ts, по десять seed на прототип), тот же, что писал прежний
 * тренажёр в прогресс. Особый режим «Определи тип» — `rezhim: 'tip'`.
 *
 * Прежний тренажёр №13 (общая панель фильтров, components/trenazher)
 * писал в сессию свою запись: { v: 1, rezhim, items: [{ k }], dop }; ещё
 * раньше — { zadachi: [[прототип, seed, …, вид]], rezhim }. Обе
 * открываются на той же задаче (prezhnyayaZapis13).
 */

import { isRecord } from '@/lib/trainerSession/restore';
import type { PayloadBanka, TaskBanka } from '@/lib/trening/bank';

/** Ключи задач №13: «A-01|b3» (банк), «A-01|n123» (прежняя «Похожая задача»). */
export const KLYUCH13 = /^[A-D]-\d{2}\|[a-z]\w*$/;

/** Особый режим «Определи тип»: назвать схему по условию. */
export const REZHIM_TIP = 'tip';

export function prototipKlyucha13(id: string): string {
  return id.split('|')[0] ?? id;
}

function zadachi(keys: string[]): TaskBanka[] | null {
  const tasks = keys
    .filter((k) => KLYUCH13.test(k))
    .map((id) => ({ id, p: prototipKlyucha13(id) }));
  return tasks.length === 0 || tasks.length !== keys.length ? null : tasks;
}

/**
 * Запись прежнего тренажёра №13 → запись общего тренажёра. Режим «Без
 * подсказок» остаётся без подсказок, «На время» — с таймером, «Определить
 * схему» — режим «Определи тип». «С оформлением» в новом тренажёре нет:
 * такая тренировка продолжается с ответом числом.
 */
export function prezhnyayaZapis13(packed: unknown): PayloadBanka | null {
  if (!isRecord(packed)) return null;
  /* Тренажёр с фильтрами: { v: 1, rezhim, seed, items: [{ k, seed? }], dop? }. */
  if (packed['v'] === 1 && Array.isArray(packed['items'])) {
    const keys = (packed['items'] as unknown[]).map((item) =>
      isRecord(item) && typeof item['k'] === 'string' ? item['k'] : '',
    );
    const tasks = zadachi(keys);
    if (tasks === null) return null;
    const dop = isRecord(packed['dop']) ? packed['dop'] : {};
    return {
      tasks,
      control: packed['rezhim'] === 'bez',
      timer: packed['rezhim'] === 'vremya',
      ...(dop['zadanie'] === 'tip' ? { rezhim: REZHIM_TIP } : {}),
    };
  }
  /* Самый первый экран №13: { zadachi: [[прототип, seed, …, вид]], rezhim }. */
  if (Array.isArray(packed['zadachi'])) {
    const spisok = (packed['zadachi'] as unknown[]).filter(
      (z): z is string[] =>
        Array.isArray(z) && typeof z[0] === 'string' && typeof z[1] === 'string',
    );
    const tasks = zadachi(spisok.map((z) => `${z[0]}|${z[1]}`));
    if (tasks === null) return null;
    return {
      tasks,
      control: false,
      timer: true,
      ...(spisok.some((z) => z[3] === 'tip') ? { rezhim: REZHIM_TIP } : {}),
    };
  }
  return null;
}
