/**
 * Адаптер №10 к общему генератору в браузере: банковый лист
 * (lib/generator/obshchiy/bankEngine.ts) со сборкой №10. Конфиг — на
 * сервере (generator10.ts); банк и решатели грузятся при сборке листа.
 */

import type { IllInfo } from '@/components/tasks/zadanie10/Zadacha10';
import { GENERATOR10_TEXTS } from '@/content/generator10';
import { bankEngine, type SobratListHtml } from '@/lib/generator/obshchiy/bankEngine';
import type { GenConfig, GenEngine } from '@/lib/generator/obshchiy/types';
import type { Dannye10 } from './predprosmotr10';
import { parseZapros, parseZaprosKlyuchi } from './sborka';

/** Адаптер в браузере; ill — картинки сюжетов, dannye — банк с диска для проверок. */
export function engine10(
  config: GenConfig,
  base: string,
  ill: Record<string, IllInfo>,
  dannye?: Dannye10,
): GenEngine {
  return bankEngine(config, {
    base,
    ekran: (q) => `${base}/generator/?${q}`,
    avtor: GENERATOR10_TEXTS.sheet.teacher,
    podzagolovok: GENERATOR10_TEXTS.podzagolovok,
    parseKlyuchi: parseZaprosKlyuchi,
    /* Прежний адрес: seed — в «s», вид листа — в «l» (его задаёт страница печати). */
    staryySeed: 's',
    staryyBez: ['l'],
    parseStaryy(q) {
      const z = parseZapros(q);
      if (z === null) return null;
      return {
        tipy: z.tipy,
        istochnik: z.istochnik,
        variantov: z.variantov,
        primery: z.primery,
        seed: z.seed,
        flag: z.kartinki,
      };
    },
    async sobrat(): Promise<SobratListHtml> {
      const { sobratList10 } = await import('./predprosmotr10');
      return sobratList10(ill, dannye);
    },
  });
}
