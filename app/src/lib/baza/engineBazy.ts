/**
 * Адаптер генератора базы к общему генератору в браузере: банковый лист
 * (lib/generator/obshchiy/bankEngine.ts). Конфиг — на сервере
 * (generatorBazy.ts); банк раздела и решатели грузятся при сборке листа.
 * Прежнего генератора у базы не было — старых адресов нет.
 */

import { GENERATOR_BAZY as T } from '@/content/baza/generator';
import { bankEngine, type SobratListHtml } from '@/lib/generator/obshchiy/bankEngine';
import type { GenConfig, GenEngine } from '@/lib/generator/obshchiy/types';
import { parseZaprosBazy } from './generatorBazy';
import type { DannyeBazy } from './predprosmotrBazy';

/**
 * base — адрес раздела («/baza/zadaniya/12»), ekran — адрес вкладки
 * генератора; dannye — банк с диска для проверок.
 */
export function engineBazy(
  config: GenConfig,
  base: string,
  ekran: string,
  dannye?: DannyeBazy,
): GenEngine {
  return bankEngine(config, {
    base,
    ekran: (q) => `${ekran}?${q}`,
    avtor: config.sheet.teacher,
    podzagolovok: T.podzagolovok,
    parseKlyuchi: (q) => parseZaprosBazy(q, config),
    parseStaryy: () => null,
    async sobrat(): Promise<SobratListHtml> {
      const m = await import('./predprosmotrBazy');
      return m.sobratListBazy(config, dannye ?? m.dannyeBrauzera(config.id));
    },
  });
}
