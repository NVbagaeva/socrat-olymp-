/**
 * Данные задания №10 для браузера (тренажёр, генератор, листы).
 *
 * Файлы public/data/zadanie10/: indeks.json — список задач (id,
 * прототип, источник), <прототип>.json — условия и параметры задач
 * прототипа. **Ответов там нет**: только отпечаток `seal`
 * (lib/zadanie10/secret.ts). Разбор браузер строит сам — решателем
 * прототипа по параметрам (динамический импорт lib/zadanie10/prototypes).
 *
 * Файлы собирает `pnpm build:bank-10` вместе с аналогами; самотест
 * сверяет их с банком.
 */

import { dataUrl } from '../dataUrl';
import type { Params } from './types';

export const PAPKA_DANNYH = '/data/zadanie10';

/** Задача без ответа. */
export interface ZadachaLite {
  id: string;
  prototypeId: string;
  source: 'fipi' | 'analog';
  no?: number;
  text: string;
  params: Params;
  /** Отпечаток ответа. */
  seal: string;
  plot?: string;
  modern?: boolean;
}

/** Строка индекса: только то, что нужно для подбора листа. */
export interface IndeksZadachi {
  id: string;
  p: string;
  /** f — ФИПИ, a — аналог. */
  s: 'f' | 'a';
}

export function urlDannyh(fail: string): string {
  return dataUrl(`${PAPKA_DANNYH}/${fail}.json`);
}

const kesh = new Map<string, Promise<unknown>>();

function zagruzit<T>(fail: string): Promise<T> {
  let p = kesh.get(fail);
  if (p === undefined) {
    p = fetch(urlDannyh(fail)).then((r) => {
      if (!r.ok) {
        throw new Error(`нет данных ${fail}: ${r.status}`);
      }
      return r.json();
    });
    kesh.set(fail, p);
  }
  return p as Promise<T>;
}

export function zagruzitIndeks(): Promise<IndeksZadachi[]> {
  return zagruzit<IndeksZadachi[]>('indeks');
}

/** Задачи нескольких прототипов разом: id → задача. */
export async function zagruzitZadachi(prototipy: string[]): Promise<Map<string, ZadachaLite>> {
  const spiski = await Promise.all([...new Set(prototipy)].map((p) => zagruzit<ZadachaLite[]>(p)));
  return new Map(spiski.flat().map((z) => [z.id, z]));
}
