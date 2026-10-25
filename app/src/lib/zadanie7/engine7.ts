/**
 * Адаптер №7 к общему генератору в браузере: банковый лист
 * (lib/generator/obshchiy/bankEngine.ts) со сборкой №7. Конфиг — на
 * сервере (generator7.ts); банк и решатели грузятся при сборке листа.
 */

import { GENERATOR7_TEXTS } from '@/content/generator7';
import { bankEngine, type SobratListHtml } from '@/lib/generator/obshchiy/bankEngine';
import type { GenConfig, GenEngine } from '@/lib/generator/obshchiy/types';
import type { Dannye7 } from './predprosmotr7';
import { parseZapros, parseZaprosKlyuchi } from './sborka';

/** Адаптер в браузере; dannye — банк с диска для проверок. */
export function engine7(config: GenConfig, base: string, dannye?: Dannye7): GenEngine {
  return bankEngine(config, {
    base,
    ekran: (q) => `${base}/generator/?${q}`,
    avtor: GENERATOR7_TEXTS.sheet.teacher,
    podzagolovok: GENERATOR7_TEXTS.sheet.title,
    parseKlyuchi: parseZaprosKlyuchi,
    parseStaryy(q) {
      const z = parseZapros(q);
      if (z === null) return null;
      return {
        tipy: z.tipy,
        istochnik: z.istochnik,
        variantov: z.variantov,
        primery: z.primery,
        seed: z.seed,
      };
    },
    async sobrat(): Promise<SobratListHtml> {
      const { sobratList7 } = await import('./predprosmotr7');
      return sobratList7(dannye);
    },
  });
}
