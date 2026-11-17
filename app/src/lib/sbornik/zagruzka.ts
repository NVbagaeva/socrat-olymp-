'use client';

/**
 * Задачи типа в браузере: файл /sbornik/glava-N/dannye/tip-….json
 * грузится один раз на страницу и держится в памяти.
 */

import { glavaSlug, href, SBORNIK, SBORNIK_TAIL, tipSlug } from '@/lib/paths';
import type { ZadachaKlient } from './types';

const cache = new Map<string, Promise<readonly ZadachaKlient[]>>();

export function zagruzitTip(tip: string): Promise<readonly ZadachaKlient[]> {
  const got = cache.get(tip);
  if (got !== undefined) return got;
  const glava = Number(tip.split('.')[0]);
  const url = href(SBORNIK, glavaSlug(glava), SBORNIK_TAIL.dannye, `${tipSlug(tip)}.json`);
  const p = fetch(url)
    .then((r) => {
      if (!r.ok) throw new Error(`${url}: ${r.status}`);
      return r.json() as Promise<ZadachaKlient[]>;
    })
    .catch((e: unknown) => {
      cache.delete(tip);
      throw e;
    });
  cache.set(tip, p);
  return p;
}

export async function zagruzitZadachu(id: string): Promise<ZadachaKlient | undefined> {
  const [g, t] = id.split('.');
  const list = await zagruzitTip(`${g}.${t}`);
  return list.find((z) => z.id === id);
}
