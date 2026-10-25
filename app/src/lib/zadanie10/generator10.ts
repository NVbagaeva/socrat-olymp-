/**
 * Подключение №10 к общему генератору: конфиг из групп и прототипов
 * движка (собирается на сервере — числа банка читаются из индекса) и
 * адаптер банкового листа (engine10.ts — он работает в браузере).
 *
 * Адрес набора — тот же, что у листа печати (ps=2: s, i, v, seed, z,
 * tr, pr, k, d, uch, qr, fl). Прежний адрес генератора
 * (m=g&l=uchenik&t=P01:2&i=m&v=2&e=1&k=0&s=…) открывается тем же листом.
 */

import { GENERATOR10_PRESETS, GENERATOR10_SOURCES, GENERATOR10_TEXTS } from '@/content/generator10';
import { GEN_UI } from '@/content/generatorUi';
import type { ZadachaBanka } from '@/lib/generator/obshchiy/bank';
import type { GenConfig } from '@/lib/generator/obshchiy/types';
import type { ProtoInfo10 } from '../../components/tasks/zadanie10/Trenazher10';
import { typeset } from '../tex';
import { NA_TIP_MAX, VARIANTOV_MAX } from './sborka';

const VIDY = GEN_UI.vidyRaboty as Record<string, string>;

/** Конфиг на сервере: прототипы, группы и сколько задач ФИПИ у каждого. */
export function config10(
  slot: string,
  prototipy: readonly ProtoInfo10[],
  gruppy: readonly { id: string; title: string }[],
  indeks: readonly ZadachaBanka[],
): GenConfig {
  return {
    id: '10',
    scope: '10',
    slot,
    section: GENERATOR10_TEXTS.section,
    sheet: GENERATOR10_TEXTS.sheet,
    topics: gruppy
      .map((g) => ({
        id: g.id,
        title: g.title,
        ...(g.title.includes('$') ? { titleHtml: typeset(g.title) } : {}),
        subtypes: prototipy
          .filter((p) => p.group === g.id)
          .map((p) => ({
            id: p.id,
            code: p.kod,
            title: p.title,
            ...(p.title.includes('$') ? { titleHtml: typeset(p.title) } : {}),
            level: 1 as const,
            bank: indeks.filter((x) => x.p === p.id && x.s === 'f').length,
          })),
      }))
      .filter((t) => t.subtypes.length > 0),
    levels: [],
    sources: GENERATOR10_SOURCES,
    presets: GENERATOR10_PRESETS,
    limits: { maxPerTopic: 2 * NA_TIP_MAX, maxTasks: 30, variantsMax: VARIANTOV_MAX },
    extras: {
      kinds: Object.entries(VIDY).map(([id, title]) => ({ id, title })),
      flag: GENERATOR10_TEXTS.flag,
    },
  };
}
