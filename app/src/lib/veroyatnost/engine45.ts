/**
 * Адаптер №4 и №5 к общему генератору в браузере: банковый лист
 * (lib/generator/obshchiy/bankEngine.ts) с выбором задач листа печати
 * (sheet4.ts). Конфиг — на сервере (generator45.ts); данные и разборы
 * грузятся при первой сборке листа.
 */

import { GENERATOR45_TEXTS } from '@/content/generator45';
import { bankEngine, type SobratListHtml } from '@/lib/generator/obshchiy/bankEngine';
import type { GenConfig, GenEngine } from '@/lib/generator/obshchiy/types';
import { planCounts } from '../sheetPlan';
import type { Zagruzka45 } from './predprosmotr45';
import { parseSheet4Query, parseZapros45 } from './sheet4';

/** Адаптер в браузере; zagruzka — данные с сервера для проверок. */
export function engine45(
  config: GenConfig,
  base: string,
  zadanie: 4 | 5,
  zagruzka?: Zagruzka45,
): GenEngine {
  const vBanke = new Map(config.topics.flatMap((t) => t.subtypes.map((s) => [s.id, s.bank])));
  return bankEngine(config, {
    base,
    ekran: (q) => `${base}/generator/?${q}`,
    avtor: GENERATOR45_TEXTS.teacher,
    /* Без вида работы подзаголовка нет — как на листе печати. */
    podzagolovok: '',
    parseKlyuchi: (q) => parseZapros45(q, zadanie),
    parseStaryy(q) {
      if (q.get('ps') === '2' || !q.has('s')) return null;
      const p = parseSheet4Query(q);
      const est = p.skills.filter((id) => vBanke.has(id));
      if (est.length === 0) return null;
      /* Доли сюжетов — как на прежнем листе: поровну, остаток по кругу. */
      const plan = planCounts(
        est.map((id) => ({ id, capacity: vBanke.get(id) ?? 0 })),
        p.count,
      );
      return {
        tipy: plan.counts.filter((c) => c.count > 0).map((c) => ({ id: c.id, n: c.count })),
        istochnik: 'fipi',
        variantov: p.variants,
        primery: 0,
        seed: p.seed,
      };
    },
    async sobrat(): Promise<SobratListHtml> {
      const { sobratList45 } = await import('./predprosmotr45');
      return sobratList45(zadanie, zagruzka);
    },
  });
}
