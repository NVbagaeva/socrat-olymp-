'use client';

/**
 * Раздел базы в браузере: загрузка банка и прототипов, хранилища
 * прогресса. Всё — по номеру задания, ключи хранилища — с префиксом
 * базы («budetege:baza:zadanie-5:…»): прогресс базы не пересекается с
 * профилем.
 */

import { dataUrl } from '../dataUrl';
import { createLogStore, type LogStore } from '../progressLog';
import { createProgressStore, type ProgressStore } from '../progressStore';
import type { SyncedStore } from '../syncedStore';
import { createVyborBanka } from '../trening/vybor';
import type { VyborBanka } from '../trening/vybor';
import { createZagruzka, type Zagruzka } from '../trening/zagruzka';
import type { Prototip, Resheno, ZadachaLite } from './types';

/* Прототипы раздела — отдельным куском сборки: строками, чтобы сборщик
   знал адреса кусков. Новый раздел базы добавляет сюда строку. */
const PROTOTIPY: Readonly<Record<string, () => Promise<{ prototipy: readonly Prototip[] }>>> = {
  '5': () => import('./z05/prototipy').then((m) => ({ prototipy: m.PROTOTIPY_05 })),
};

export interface BrauzerRazdela {
  zagruzka: Zagruzka<ZadachaLite, Resheno, Prototip>;
  log: LogStore;
  vybor: SyncedStore<VyborBanka>;
  opornye: ProgressStore;
}

const razdely = new Map<string, BrauzerRazdela>();

export function brauzerRazdela(slug: string): BrauzerRazdela {
  let r = razdely.get(slug);
  if (r === undefined) {
    const zagruzit = PROTOTIPY[slug];
    if (zagruzit === undefined) throw new Error(`У задания базы №${slug} нет банка`);
    const key = `budetege:baza:zadanie-${slug}`;
    r = {
      zagruzka: createZagruzka<ZadachaLite, Resheno, Prototip>({
        url: (prototip) => dataUrl(`/data/baza/${slug}/${prototip}.json`),
        reshatel: () =>
          zagruzit().then(({ prototipy }) => (id: string) => {
            const p = prototipy.find((x) => x.id === id);
            if (p === undefined) throw new Error(`нет прототипа ${id}`);
            return p;
          }),
      }),
      log: createLogStore(`${key}:log:v1`),
      vybor: createVyborBanka(`${key}:vybor:v1`),
      opornye: createProgressStore(`${key}:opornye:v1`),
    };
    razdely.set(slug, r);
  }
  return r;
}
