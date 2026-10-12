/**
 * Тренажёр задания №7: выбор тренировки и план задач.
 *
 * Выбор (источник, прототипы, число задач) живёт в sessionStorage — на
 * время вкладки браузера, как у №11; сама тренировка — в общей сессии
 * тренажёров (components/tasks/session): она переживает переход между
 * вкладками раздела и перезагрузку. План — чистая функция, её проверяет
 * самотест.
 */

import { useSyncExternalStore } from 'react';
import type { IndeksZadachi } from './dannye';

export type Istochnik = 'fipi' | 'analog' | 'mix';

export interface Nastroyki7 {
  istochnik: Istochnik;
  tipy: string[];
  skolko: number;
}

export const SKOLKO = [5, 10, 15, 20] as const;

export const PO_UMOLCHANIYU: Nastroyki7 = { istochnik: 'fipi', tipy: [], skolko: 10 };

const KEY = 'budetege:zadanie-7:trenazher-vybor';

const listeners = new Set<() => void>();
let current: Nastroyki7 | undefined;

function razobrat(raw: string | null): Nastroyki7 {
  if (raw === null) {
    return PO_UMOLCHANIYU;
  }
  try {
    const v = JSON.parse(raw) as Partial<Nastroyki7>;
    return {
      istochnik: v.istochnik === 'analog' || v.istochnik === 'mix' ? v.istochnik : 'fipi',
      tipy: Array.isArray(v.tipy) ? v.tipy.filter((x): x is string => typeof x === 'string') : [],
      skolko: (SKOLKO as readonly number[]).includes(v.skolko ?? 0) ? (v.skolko as number) : 10,
    };
  } catch {
    return PO_UMOLCHANIYU;
  }
}

function snapshot(): Nastroyki7 {
  if (current === undefined) {
    try {
      current = razobrat(window.sessionStorage.getItem(KEY));
    } catch {
      current = PO_UMOLCHANIYU;
    }
  }
  return current;
}

export function nastroykiSeychas(): Nastroyki7 {
  return snapshot();
}

export function zapisatNastroyki(n: Nastroyki7): void {
  current = n;
  try {
    window.sessionStorage.setItem(KEY, JSON.stringify(n));
  } catch {
    /* приватный режим — выбор живёт до перезагрузки */
  }
  listeners.forEach((f) => f());
}

export function useNastroyki7(): Nastroyki7 {
  return useSyncExternalStore(
    (f) => {
      listeners.add(f);
      return () => listeners.delete(f);
    },
    snapshot,
    () => PO_UMOLCHANIYU,
  );
}

/** Перемешать копию списка. */
function peremeshat<T>(a: readonly T[], random: () => number): T[] {
  const b = [...a];
  for (let i = b.length - 1; i > 0; i -= 1) {
    const j = Math.floor(random() * (i + 1));
    [b[i], b[j]] = [b[j] as T, b[i] as T];
  }
  return b;
}

/**
 * План тренировки: id задач. Прототипы чередуются по кругу; источник
 * — только ФИПИ, только аналоги или вперемешку. Прототипы, задач ФИПИ
 * которых нет в источниках (П-10, П-30), в режиме «только ФИПИ» берут
 * аналоги. `krome` — задачи, которых в плане быть не должно («похожие»).
 */
export function planTrenirovki(
  indeks: readonly IndeksZadachi[],
  n: Pick<Nastroyki7, 'istochnik' | 'tipy' | 'skolko'>,
  random: () => number = Math.random,
  krome: ReadonlySet<string> = new Set(),
): string[] {
  const po = new Map<string, string[]>();
  for (const p of n.tipy) {
    const svoi = indeks.filter((z) => z.p === p && !krome.has(z.id));
    const f = svoi.filter((z) => z.s === 'f').map((z) => z.id);
    const a = svoi.filter((z) => z.s === 'a').map((z) => z.id);
    const ids =
      n.istochnik === 'fipi' ? (f.length > 0 ? f : a) : n.istochnik === 'analog' ? a : [...f, ...a];
    if (ids.length > 0) {
      po.set(p, peremeshat(ids, random));
    }
  }
  const ochered = peremeshat([...po.entries()], random);
  const plan: string[] = [];
  for (
    let i = 0;
    plan.length < n.skolko && i < n.skolko * ochered.length + ochered.length;
    i += 1
  ) {
    const e = ochered[i % ochered.length];
    const id = e?.[1].shift();
    if (id) {
      plan.push(id);
    }
  }
  return plan;
}
