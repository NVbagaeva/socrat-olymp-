/**
 * Тренажёр задания №6: выбор тренировки и план задач.
 *
 * Выбор (источник, стиль, прототипы, число задач) живёт в sessionStorage
 * — на время вкладки браузера, как у №7 и №11; сама тренировка — в общей
 * сессии тренажёров (components/tasks/session): она переживает переход
 * между вкладками раздела и перезагрузку. План — чистая функция, её
 * проверяет самотест.
 */

import { useSyncExternalStore } from 'react';
import type { IndeksZadachi } from './dannye';
import { podStil, type Stil } from './shablony';

export type IstochnikVybora = 'fipi' | 'analog' | 'mix';

export interface Nastroyki6 {
  istochnik: IstochnikVybora;
  stil: Stil;
  tipy: string[];
  skolko: number;
}

export const SKOLKO = [5, 10, 15, 20] as const;

export const PO_UMOLCHANIYU: Nastroyki6 = { istochnik: 'mix', stil: 'vse', tipy: [], skolko: 10 };

const KEY = 'budetege:zadanie-6:trenazher-vybor';

const listeners = new Set<() => void>();
let current: Nastroyki6 | undefined;

function razobrat(raw: string | null): Nastroyki6 {
  if (raw === null) {
    return PO_UMOLCHANIYU;
  }
  try {
    const v = JSON.parse(raw) as Partial<Nastroyki6>;
    return {
      istochnik: v.istochnik === 'fipi' || v.istochnik === 'analog' ? v.istochnik : 'mix',
      stil: v.stil === 'syuzhet' || v.stil === 'standart' ? v.stil : 'vse',
      tipy: Array.isArray(v.tipy) ? v.tipy.filter((x): x is string => typeof x === 'string') : [],
      skolko: (SKOLKO as readonly number[]).includes(v.skolko ?? 0) ? (v.skolko as number) : 10,
    };
  } catch {
    return PO_UMOLCHANIYU;
  }
}

function snapshot(): Nastroyki6 {
  if (current === undefined) {
    try {
      current = razobrat(window.sessionStorage.getItem(KEY));
    } catch {
      current = PO_UMOLCHANIYU;
    }
  }
  return current;
}

export function nastroykiSeychas(): Nastroyki6 {
  return snapshot();
}

export function zapisatNastroyki(n: Nastroyki6): void {
  current = n;
  try {
    window.sessionStorage.setItem(KEY, JSON.stringify(n));
  } catch {
    /* приватный режим — выбор живёт до перезагрузки */
  }
  listeners.forEach((f) => f());
}

export function useNastroyki6(): Nastroyki6 {
  return useSyncExternalStore(
    (f) => {
      listeners.add(f);
      return () => listeners.delete(f);
    },
    snapshot,
    () => PO_UMOLCHANIYU,
  );
}

function peremeshat<T>(a: readonly T[], random: () => number): T[] {
  const b = [...a];
  for (let i = b.length - 1; i > 0; i -= 1) {
    const j = Math.floor(random() * (i + 1));
    [b[i], b[j]] = [b[j] as T, b[i] as T];
  }
  return b;
}

/**
 * План тренировки: id задач. Прототипы чередуются по кругу; источник —
 * только исходные задачи, только аналоги или вперемешку; стиль —
 * сюжетные, стандартные или все. Если исходных задач нужного стиля у
 * прототипа нет (исходные — все стандартные), берутся аналоги.
 * `krome` — задачи, которых в плане быть не должно («похожие»).
 */
export function planTrenirovki(
  indeks: readonly IndeksZadachi[],
  n: Pick<Nastroyki6, 'istochnik' | 'stil' | 'tipy' | 'skolko'>,
  random: () => number = Math.random,
  krome: ReadonlySet<string> = new Set(),
): string[] {
  const po = new Map<string, string[]>();
  for (const p of n.tipy) {
    const svoi = indeks.filter((z) => z.p === p && !krome.has(z.id) && podStil(z.st, n.stil));
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
