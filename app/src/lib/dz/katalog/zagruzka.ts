'use client';

/**
 * Каталог раздела в браузере: файл /kabinet/dz-vydat/dannye/zNN.json
 * (app/kabinet/dz-vydat/dannye/[file]/route.ts), один раз за визит.
 */

import type { KatalogRazdela } from './types';

/** Разделы, из которых уже можно собирать ДЗ (как RAZDELY_DZ на сервере). */
export const RAZDELY_DZ_KLIENT = [1, 2, 6, 7, 8, 9, 10, 11] as const;

const kesh = new Map<number, Promise<KatalogRazdela>>();

export function katalogUrl(no: number): string {
  return `/kabinet/dz-vydat/dannye/z${String(no).padStart(2, '0')}.json`;
}

export function zagruzitKatalog(no: number): Promise<KatalogRazdela> {
  let p = kesh.get(no);
  if (p === undefined) {
    /* Файл без версии в адресе: сверяемся с сервером (ETag), чтобы после
       выкладки не выдать ДЗ по старому каталогу. */
    p = fetch(katalogUrl(no), { cache: 'no-cache' }).then((r) => {
      if (!r.ok) throw new Error(`каталог №${no}: ${r.status}`);
      return r.json() as Promise<KatalogRazdela>;
    });
    p.catch(() => kesh.delete(no));
    kesh.set(no, p);
  }
  return p;
}

export async function zagruzitKatalogi(
  nomera: readonly number[],
): Promise<Map<number, KatalogRazdela>> {
  const uniq = [...new Set(nomera)];
  const list = await Promise.all(uniq.map(zagruzitKatalog));
  return new Map(list.map((k) => [k.no, k]));
}
