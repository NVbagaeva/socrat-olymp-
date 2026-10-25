/**
 * Конфиг общего генератора для №12 — собирается на сервере: манифест
 * движка graph/ тянет данные всех прототипов, в браузер уходят только
 * названия, уровни и пресеты (как раньше — карточки навыков).
 *
 * Темы — типы функций, подтипы — наборы прототипов (12.A, 12Q.B …).
 * Уровень у №12 — на весь лист: «удачные» числа ★, «неудачные» ★★,
 * оба — вперемешку; «Другого уровня» у задачи нет. Вкладка подтемы —
 * тот же конфиг с одним типом.
 */

import { GEN_UI } from '@/content/generatorUi';
import {
  GENERATOR12_SOURCES,
  GENERATOR12_TEXTS,
  presetsPodtemy,
  presetsVse,
} from '@/content/generator12';
import { generatorAllText } from '@/content/ves12';
import { skillLevels, skillLevelsFor, skillTitle } from '@/content/skills12';
import { functionTypes } from '@/data/functionTypes';
import { manifest } from '@/lib/generator/manifest';
import type { GenConfig, GenTopic, Level } from '@/lib/generator/obshchiy/types';
import { typeset } from '@/lib/tex';

const VIDY = GEN_UI.vidyRaboty as Record<string, string>;
const ZVEZDY: Record<string, Level> = { lucky: 1, unlucky: 2 };

function tema(typeId: string): GenTopic | null {
  const type = functionTypes.find((t) => t.id === typeId);
  const family = manifest.families.find((f) => f.id === typeId);
  if (type === undefined || family === undefined || type.status !== 'active') return null;
  const subtypes = family.skills
    .filter((s) => s.kind === 'prototype')
    .map((s) => {
      const levels = ['lucky', 'unlucky']
        .filter((l) => s.levels.includes(l))
        .map((l) => ZVEZDY[l] as Level);
      const title = skillTitle[s.id] ?? s.id;
      return {
        id: s.id,
        code: s.id,
        title: title.replace(/\$/g, ''),
        titleHtml: typeset(title),
        level: levels[0] ?? 1,
        ...(levels.length > 1 ? { levels } : {}),
        bank: 0,
      };
    });
  return subtypes.length === 0
    ? null
    : { id: type.id, title: type.title, note: type.graphName, subtypes };
}

/**
 * Конфиг генератора №12. tip — вкладка подтемы (один тип, подписи
 * уровней — её); без него — генератор по всем типам.
 */
export function config12(slot: string, podtema?: { tip: string; title: string }): GenConfig {
  const topics = (podtema === undefined ? functionTypes.map((t) => t.id) : [podtema.tip])
    .map(tema)
    .filter((t): t is GenTopic => t !== null);
  const urovni = podtema === undefined ? skillLevels : skillLevelsFor(podtema.tip);
  return {
    id: '12',
    scope: '12',
    slot,
    section: podtema === undefined ? GENERATOR12_TEXTS.sectionVse : `№12 · ${podtema.title}`,
    sheet: {
      ...GENERATOR12_TEXTS.sheet,
      title: podtema === undefined ? generatorAllText.sheetTitle : podtema.title,
    },
    topics,
    levels: urovni.map((l) => ({
      level: ZVEZDY[l.id] as Level,
      words: `${l.title.toLowerCase()}: ${l.lead.replace(/\$/g, '')}`,
    })),
    taskLevel: false,
    sources: GENERATOR12_SOURCES,
    presets:
      podtema === undefined
        ? presetsVse(topics.map((t) => t.id))
        : presetsPodtemy(
            podtema.tip,
            (topics[0]?.subtypes ?? []).map((s) => s.id),
          ),
    limits:
      podtema === undefined
        ? { maxPerTopic: 6, maxTasks: 24, variantsMax: 4 }
        : { maxPerTopic: 20, maxTasks: 20, variantsMax: 4 },
    extras: { kinds: Object.entries(VIDY).map(([id, title]) => ({ id, title })) },
  };
}
