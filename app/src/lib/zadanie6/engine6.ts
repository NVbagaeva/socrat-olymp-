/**
 * Адаптер №6 к общему генератору в браузере: банковый лист
 * (lib/generator/obshchiy/bankEngine.ts) со сборкой №6. Конфиг — на
 * сервере (generator6.ts); банк и решатели грузятся при сборке листа.
 */

import { GENERATOR6_TEXTS } from '@/content/generator6';
import { bankEngine, type SobratListHtml } from '@/lib/generator/obshchiy/bankEngine';
import type { GenConfig, GenEngine } from '@/lib/generator/obshchiy/types';
import type { Dannye6 } from './predprosmotr6';
import { parseZapros, parseZaprosKlyuchi } from './sborka';

/** Адаптер в браузере; dannye — банк с диска для проверок. */
export function engine6(config: GenConfig, base: string, dannye?: Dannye6): GenEngine {
  return bankEngine(config, {
    base,
    ekran: (q) => `${base}/generator/?${q}`,
    avtor: GENERATOR6_TEXTS.sheet.teacher,
    podzagolovok: GENERATOR6_TEXTS.sheet.title,
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
        filtr: z.stil === 'syuzhet' ? 's' : z.stil === 'standart' ? 'f' : 'v',
      };
    },
    async sobrat(): Promise<SobratListHtml> {
      const { sobratList6 } = await import('./predprosmotr6');
      return sobratList6(dannye);
    },
  });
}
