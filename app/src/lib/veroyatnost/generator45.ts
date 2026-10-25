/**
 * Подключение №4 и №5 к общему генератору: конфиг из методов и сюжетов
 * банка (собирается на сервере) и адаптер банкового листа
 * (engine45.ts — он работает в браузере).
 *
 * Темы — методы автора, подтипы — сюжеты (прототипы банка), «в банке
 * N» — вариантов сюжета. Адрес набора — тот же, что у листа печати
 * (ps=2: s, v, seed, z, k, d, uch, qr). Прежний адрес генератора
 * (s=p4-01,p4-07&n=10&seed=…&t=color&c=1) открывается тем же листом.
 */

import type { Navyk } from '@/components/tasks/veroyatnost/metody';
import type { Syuzhet } from '@/components/tasks/veroyatnost/navyki';
import { GENERATOR45_SOURCES, GENERATOR45_TEXTS, presets45 } from '@/content/generator45';
import { GEN_UI } from '@/content/generatorUi';
import { listSlova, veroyatnostBySlug, type Zadanie } from '@/content/veroyatnost';
import type { GenConfig } from '@/lib/generator/obshchiy/types';

const VIDY = GEN_UI.vidyRaboty as Record<string, string>;

/** Вариантов на листе — как у прежнего генератора. */
export const VARIANTOV_45 = 4;

/** Конфиг на сервере: методы задания и сюжеты банка. */
export function config45(
  zadanie: Zadanie,
  slot: string,
  metody: readonly Navyk[],
  syuzhety: readonly Syuzhet[],
): GenConfig {
  const list = listSlova(zadanie);
  const topics = metody
    .map((m) => ({
      id: m.id,
      title: m.nazvanie,
      subtypes: syuzhety
        .filter((s) => s.metod === m.id)
        .map((s) => ({ id: s.id, code: s.id, title: s.title, level: 1 as const, bank: s.count })),
    }))
    .filter((t) => t.subtypes.length > 0);
  return {
    id: String(zadanie),
    scope: zadanie === 5 ? '5' : '4',
    slot,
    section: `№${zadanie} · ${veroyatnostBySlug(String(zadanie))?.title ?? list.title.text}`,
    sheet: {
      chip: list.title.chip,
      title: list.title.text,
      course: GENERATOR45_TEXTS.course,
      teacher: GENERATOR45_TEXTS.teacher,
    },
    topics,
    levels: [],
    sources: GENERATOR45_SOURCES,
    presets: presets45(topics.map((t) => ({ id: t.id, syuzhetov: t.subtypes.length }))),
    limits: { maxPerTopic: 12, maxTasks: 30, variantsMax: VARIANTOV_45 },
    /* Рамок теории и разобранных примеров у листа №4 и №5 нет. */
    extras: {
      kinds: Object.entries(VIDY).map(([id, title]) => ({ id, title })),
      theory: false,
      examples: false,
    },
  };
}
