/**
 * Данные задания №6 для браузера (тренажёр, генератор, листы).
 *
 * Файлы public/data/zadanie6/: indeks.json — список задач (id,
 * прототип, источник, стиль), <прототип>.json — условия и параметры
 * задач прототипа. **Ответов там нет**: только отпечаток `seal`
 * (lib/zadanie6/secret.ts). Рисунок и разбор браузер строит сам —
 * решателем прототипа по параметрам (динамический импорт
 * lib/zadanie6/prototypes).
 *
 * Файлы собирает `pnpm build:bank-6` вместе с аналогами; самотест
 * сверяет их с банком.
 */

import { dataUrl } from '../dataUrl';
import type { Istochnik, Params, Tema } from './types';

export const PAPKA_DANNYH = '/data/zadanie6';

/** Задача без ответа. */
export interface ZadachaLite {
  id: string;
  prototypeId: string;
  source: Istochnik;
  no?: number;
  gde?: string;
  stil: 'fipi' | 'syuzhet';
  tema?: Tema;
  text: string;
  posle?: string;
  params: Params;
  /** Отпечаток ответа. */
  seal: string;
}

/** Строка индекса: только то, что нужно для подбора листа. */
export interface IndeksZadachi {
  id: string;
  p: string;
  /** f — исходная задача (демоверсия ФИПИ или образец), a — аналог. */
  s: 'f' | 'a';
  /** Стиль: s — сюжетная, f — нейтральная формулировка, как в исходнике. */
  st: 'f' | 's';
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
