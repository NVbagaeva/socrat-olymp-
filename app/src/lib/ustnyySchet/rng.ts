/**
 * Повторяемый случайный поток для генераторов устного счёта.
 *
 * mulberry32: 32-битное состояние, одинаковый результат в любом
 * браузере и в Node. Зерно — строка или число.
 */

export interface Rng {
  /** [0, 1) */
  next(): number;
  /** Целое от a до b включительно. */
  int(a: number, b: number): number;
  pick<T>(list: readonly T[]): T;
  chance(p: number): boolean;
  shuffle<T>(list: readonly T[]): T[];
}

function hash(seed: string): number {
  let h = 2166136261 >>> 0;
  for (let i = 0; i < seed.length; i += 1) {
    h ^= seed.charCodeAt(i);
    h = Math.imul(h, 16777619) >>> 0;
  }
  return h;
}

export function createRng(seed: string | number): Rng {
  let s = (typeof seed === 'number' ? seed >>> 0 : hash(seed)) || 0x9e3779b9;
  const next = (): number => {
    s = (s + 0x6d2b79f5) >>> 0;
    let t = s;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
  const int = (a: number, b: number): number => a + Math.floor(next() * (b - a + 1));
  return {
    next,
    int,
    pick: <T>(list: readonly T[]): T => {
      if (list.length === 0) throw new Error('pick: пустой список');
      return list[int(0, list.length - 1)] as T;
    },
    chance: (p: number) => next() < p,
    shuffle: <T>(list: readonly T[]): T[] => {
      const out = [...list];
      for (let i = out.length - 1; i > 0; i -= 1) {
        const j = int(0, i);
        [out[i], out[j]] = [out[j] as T, out[i] as T];
      }
      return out;
    },
  };
}
