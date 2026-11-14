/**
 * «Заполни таблицу» №13: на каком уровне ученик ошибся в последний раз.
 * Работа над ошибками открывает задачу на этом уровне; верное решение
 * уровня снимает пометку. Хранится в localStorage под постоянным id
 * задачи блока («o13-01-03»); запись под прежним ключом «блок:номер»
 * читается и снимается так же. Без хранилища — просто не запоминается.
 */

import { staryyKlyuchPoId13 } from './progress';

export type Uroven13 = 1 | 2 | 3 | 4;

const KLYUCH = 'budetege:zadanie-13:zapolni-urovni:v1';

function prochitat(): Record<string, Uroven13> {
  try {
    const raw = window.localStorage.getItem(KLYUCH);
    const data: unknown = raw ? JSON.parse(raw) : {};
    return data !== null && typeof data === 'object' ? (data as Record<string, Uroven13>) : {};
  } catch {
    return {};
  }
}

function zapisat(data: Record<string, Uroven13>): void {
  try {
    window.localStorage.setItem(KLYUCH, JSON.stringify(data));
  } catch {
    /* Хранилище недоступно — уровень не запомнится. */
  }
}

/** Уровень последней ошибки; null — ошибок нет или они исправлены. */
export function urovenOshibki(id: string): Uroven13 | null {
  const data = prochitat();
  const staryy = staryyKlyuchPoId13(id);
  const u = data[id] ?? (staryy === null ? undefined : data[staryy]);
  return u === 1 || u === 2 || u === 3 || u === 4 ? u : null;
}

/** Ошибка на уровне u: в следующий раз задача откроется на нём. */
export function zapomnitOshibku(id: string, u: Uroven13): void {
  const data = prochitat();
  if (data[id] === u) return;
  zapisat({ ...data, [id]: u });
}

/** Уровень u решён верно: пометка этого уровня снимается. */
export function snyatOshibku(id: string, u: Uroven13): void {
  const data = prochitat();
  const staryy = staryyKlyuchPoId13(id);
  const kluchi = [id, ...(staryy === null ? [] : [staryy])].filter((k) => data[k] === u);
  if (kluchi.length === 0) return;
  const rest = { ...data };
  for (const k of kluchi) delete rest[k];
  zapisat(rest);
}
