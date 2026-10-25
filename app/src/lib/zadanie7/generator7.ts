/**
 * Подключение №7 к общему генератору: конфиг из групп и прототипов
 * движка (собирается на сервере — числа банка читаются из индекса) и
 * адаптер банкового листа (engine7.ts — он работает в браузере).
 *
 * Адрес набора — тот же, что у листа печати (ps=2: s, i, v, seed, z,
 * tr, pr, k, d, uch, qr). Прежний адрес генератора
 * (t=P01:2&i=f&v=2&e=1&seed=…) открывается тем же листом.
 */

import { GENERATOR7_PRESETS, GENERATOR7_SOURCES, GENERATOR7_TEXTS } from '@/content/generator7';
import { GEN_UI } from '@/content/generatorUi';
import type { GenConfig } from '@/lib/generator/obshchiy/types';
import { typeset } from '../tex';
import type { ZadachaBanka } from '@/lib/generator/obshchiy/bank';
import type { ProtoInfo7 } from './protoInfo';
import { NA_TIP_MAX, VARIANTOV_MAX } from './sborka';

const VIDY = GEN_UI.vidyRaboty as Record<string, string>;

/** Конфиг на сервере: прототипы, группы и сколько исходных задач у каждого. */
export function config7(
  slot: string,
  prototipy: readonly ProtoInfo7[],
  gruppy: readonly { id: string; title: string }[],
  indeks: readonly ZadachaBanka[],
): GenConfig {
  return {
    id: '7',
    scope: '7',
    slot,
    section: GENERATOR7_TEXTS.section,
    sheet: GENERATOR7_TEXTS.sheet,
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
    sources: GENERATOR7_SOURCES,
    presets: GENERATOR7_PRESETS,
    limits: { maxPerTopic: 2 * NA_TIP_MAX, maxTasks: 30, variantsMax: VARIANTOV_MAX },
    extras: { kinds: Object.entries(VIDY).map(([id, title]) => ({ id, title })) },
  };
}
