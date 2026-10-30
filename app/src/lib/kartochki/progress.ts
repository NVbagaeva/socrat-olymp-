'use client';

/**
 * Прогресс карточек по теории: коробки Лейтнера по номеру задания.
 *
 * Общее хранилище кабинета (lib/storage.ts: localStorage под
 * префиксом budetege:, всё в try/catch) — ключ «kartochki:<номер>:v1»,
 * своё на номер: сброс одного номера не трогает другие. Чтение —
 * через useSyncExternalStore, на сборке снимок пустой, расхождения
 * при гидратации нет.
 */

import { useSyncExternalStore } from 'react';
import { persistent, type PersistentStore } from '../storage';
import { KOROBOK, type ProgressKolody } from './leitner';

const PUSTO: ProgressKolody = {};

const stores = new Map<number, PersistentStore<ProgressKolody>>();

function store(task: number): PersistentStore<ProgressKolody> {
  let s = stores.get(task);
  if (s === undefined) {
    s = persistent<ProgressKolody>(`kartochki:${task}:v1`, PUSTO);
    stores.set(task, s);
  }
  return s;
}

/** Мусор и чужой формат из хранилища — пустота, а не падение. */
function chistyy(raw: unknown): ProgressKolody {
  if (typeof raw !== 'object' || raw === null || Array.isArray(raw)) return PUSTO;
  const out: Record<string, { b: number; n: number }> = {};
  for (const [id, z] of Object.entries(raw as Record<string, unknown>)) {
    if (typeof z !== 'object' || z === null) continue;
    const { b, n } = z as { b?: unknown; n?: unknown };
    if (typeof b === 'number' && Number.isInteger(b) && b >= 1 && b <= KOROBOK) {
      out[id] = { b, n: typeof n === 'number' && n > 0 ? n : 1 };
    }
  }
  return out;
}

const chistye = new WeakMap<object, ProgressKolody>();

function prochitat(task: number): ProgressKolody {
  const raw = store(task).read();
  const known = chistye.get(raw);
  if (known !== undefined) return known;
  const v = chistyy(raw);
  chistye.set(raw, v);
  return v;
}

export function useProgressKolody(task: number): ProgressKolody {
  const s = store(task);
  return useSyncExternalStore(
    s.subscribe,
    () => prochitat(task),
    () => PUSTO,
  );
}

export function zapisatProgress(task: number, p: ProgressKolody): void {
  store(task).write(p);
}

export function sbrositProgress(task: number): void {
  store(task).write(PUSTO);
}
