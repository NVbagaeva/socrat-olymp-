'use client';

/**
 * Подход тренажёра: какие задания взяты из пула и в каком порядке.
 *
 * Порядок решает браузер, и только после монтирования: перемешай мы
 * его на сборке — «случайный» порядок был бы у всех один и тот же,
 * а Math.random() при отрисовке разошёлся бы с разметкой сервера.
 *
 * Хранится в памяти вкладки: подход живёт, пока ученик его решает.
 * Переход между заданиями порядок не меняет, «Начать заново» —
 * меняет.
 */

import { useCallback, useSyncExternalStore } from 'react';

/* Пустой снимок — одна и та же ссылка: useSyncExternalStore сверяет
   снимки по ссылке и зациклится, если каждый раз отдавать новый. */
const EMPTY: number[] = [];

const rounds = new Map<string, number[]>();
const listeners = new Set<() => void>();

function subscribe(listener: () => void): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

/**
 * Подход для этого режима. Пока он не собран — пустой список:
 * при отрисовке на сервере и при гидратации так и остаётся, а сразу
 * после монтирования браузер отдаёт разложенный подход.
 */
export function useRound(key: string, build: () => number[]): number[] {
  const read = useCallback(() => {
    const found = rounds.get(key);
    if (found !== undefined) {
      return found;
    }
    const made = build();
    rounds.set(key, made);
    return made;
  }, [key, build]);

  return useSyncExternalStore(subscribe, read, () => EMPTY);
}

/** Собрать подход заново: другие задания и другой порядок. */
export function restartRound(key: string): void {
  rounds.delete(key);
  listeners.forEach((fn) => fn());
}

/* ── Раскладка подхода ───────────────────────────────────────────── */

/** Случайная перестановка. Исходный список не трогаем. */
function shuffled<T>(list: T[]): T[] {
  const out = list.slice();
  for (let i = out.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    const a = out[i];
    const b = out[j];
    if (a !== undefined && b !== undefined) {
      out[i] = b;
      out[j] = a;
    }
  }
  return out;
}

/** Сколько заданий брать из каждого типа. Остаток — большим пулам. */
function quotas(sizes: number[], size: number): number[] {
  const count = sizes.length;
  if (count === 0) {
    return [];
  }
  const out = sizes.map(() => Math.floor(size / count));
  let rest = size - out.reduce((sum, item) => sum + item, 0);

  /* Лишние места достаются типам, у которых задач больше: там выбор
     шире, и повторов на длинной дистанции меньше. */
  const order = sizes
    .map((value, index) => ({ value, index }))
    .sort((a, b) => b.value - a.value);

  let at = 0;
  while (rest > 0 && order.length > 0) {
    const pick = order[at % order.length];
    if (pick !== undefined) {
      out[pick.index] = (out[pick.index] ?? 0) + 1;
      rest -= 1;
    }
    at += 1;
  }
  return out.map((take, index) => Math.min(take, sizes[index] ?? 0));
}

/** Сколько раз в раскладке два соседних задания одного типа. */
function pairs(kinds: string[]): number {
  let count = 0;
  for (let i = 1; i < kinds.length; i += 1) {
    if (kinds[i] === kinds[i - 1]) {
      count += 1;
    }
  }
  return count;
}

/**
 * Подход из пула: какие задания взять и в каком порядке.
 *
 * Типы идут вперемешку, и два задания одного типа встают рядом
 * не больше двух раз за подход. Когда тип в пуле один, соседи по
 * определению одинаковые — тогда правило не применяется.
 */
export function pickRound(kinds: string[], size: number): number[] {
  const names: string[] = [];
  const groups: number[][] = [];

  kinds.forEach((kind, index) => {
    const at = names.indexOf(kind);
    if (at === -1) {
      names.push(kind);
      groups.push([index]);
    } else {
      groups[at]?.push(index);
    }
  });

  const take = quotas(
    groups.map((group) => group.length),
    size,
  );
  const chosen = groups.flatMap((group, at) => shuffled(group).slice(0, take[at] ?? 0));

  if (names.length < 2) {
    return shuffled(chosen);
  }

  /* Перекладываем, пока соседей одного типа не станет мало. Попытки
     конечны: не вышло — берём лучшую из них, а не крутим вечно. */
  const LIMIT = 2;
  let best = shuffled(chosen);
  let bestPairs = pairs(best.map((index) => kinds[index] ?? ''));

  for (let attempt = 0; attempt < 50 && bestPairs > LIMIT; attempt += 1) {
    const next = shuffled(chosen);
    const count = pairs(next.map((index) => kinds[index] ?? ''));
    if (count < bestPairs) {
      best = next;
      bestPairs = count;
    }
  }
  return best;
}
