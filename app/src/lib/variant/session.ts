/**
 * Сборка партии в браузере: настройки по умолчанию, проверка
 * сохранённых настроек, загрузка разделов и сборка с кодом.
 * Общая для экрана /variant/ и страницы печати.
 */

import { INSTRUCTION_BLANK, INSTRUCTION_LEGACY, INSTRUCTION_PLAIN } from '@/content/variant';
import { generatorVersion } from '@/lib/komplekt';
import { buildVariantSet } from './build';
import { decodeCode, encodeCode } from './code';
import { loadAdapters } from './load';
import { SUBTYPE_IDS } from './sections';
import {
  EGE_NUMBERS,
  MAX_VARIANTS,
  type EgeNo,
  type Stars,
  type VariantConfig,
  type VariantMeta,
  type VariantSet,
} from './types';

export function defaultConfig(): VariantConfig {
  return {
    tasks: [...EGE_NUMBERS],
    subtypes: {},
    source: 'mix',
    stars: [],
    count: 1,
    parallel: true,
  };
}

export function defaultMeta(): VariantMeta {
  return {
    kind: 'ege',
    customTitle: '',
    topic: '',
    group: '',
    date: '',
    duration: '',
    teacher: '',
    variantLabels: 'numbered',
    numbering: 'ege',
    figures: 'large',
    instruction: true,
    /* Пусто — стандартная для типа работы (lib/variant/sheets.ts). */
    instructionText: '',
  };
}

/** Сохранённые настройки — только то, что проходит проверку. */
export function sanitizeConfig(raw: Partial<VariantConfig> | null): VariantConfig {
  const d = defaultConfig();
  if (raw === null) return d;
  const tasks = Array.isArray(raw.tasks)
    ? EGE_NUMBERS.filter((n) => (raw.tasks as unknown[]).includes(n))
    : d.tasks;
  const subtypes: VariantConfig['subtypes'] = {};
  if (raw.subtypes !== undefined && typeof raw.subtypes === 'object' && raw.subtypes !== null) {
    for (const n of EGE_NUMBERS) {
      const v = (raw.subtypes as Record<string, unknown>)[String(n)];
      if (Array.isArray(v)) {
        const ok = SUBTYPE_IDS[n].filter((id) => v.includes(id));
        if (ok.length > 0 && ok.length < SUBTYPE_IDS[n].length) subtypes[n] = ok;
      }
    }
  }
  const count = Number(raw.count);
  return {
    tasks: tasks.length > 0 ? tasks : d.tasks,
    subtypes,
    source: raw.source === 'fipi' || raw.source === 'own' ? raw.source : 'mix',
    stars: Array.isArray(raw.stars)
      ? ([1, 2, 3] as Stars[]).filter((s) => (raw.stars as unknown[]).includes(s))
      : [],
    count: Number.isInteger(count) && count >= 1 && count <= MAX_VARIANTS ? count : 1,
    parallel: raw.parallel !== false,
  };
}

export function sanitizeMeta(raw: Partial<VariantMeta> | null): VariantMeta {
  const d = defaultMeta();
  if (raw === null) return d;
  const str = (v: unknown, fallback: string) =>
    typeof v === 'string' ? v.slice(0, 600) : fallback;
  return {
    kind: str(raw.kind, d.kind),
    customTitle: str(raw.customTitle, ''),
    topic: str(raw.topic, ''),
    group: str(raw.group, ''),
    date: /^\d{4}-\d{2}-\d{2}$/.test(str(raw.date, '')) ? str(raw.date, '') : '',
    duration: str(raw.duration, ''),
    teacher: str(raw.teacher, ''),
    variantLabels: raw.variantLabels === 'blank' ? 'blank' : 'numbered',
    numbering: raw.numbering === 'seq' ? 'seq' : 'ege',
    figures: raw.figures === 'normal' ? 'normal' : 'large',
    instruction: raw.instruction !== false,
    instructionText: ownInstruction(str(raw.instructionText, '')),
  };
}

/** Своя инструкция; стандартная (любого года) хранится пустой строкой. */
function ownInstruction(text: string): string {
  const t = text.trim();
  return [INSTRUCTION_BLANK, INSTRUCTION_PLAIN, INSTRUCTION_LEGACY].includes(t) ? '' : t;
}

export function currentVersion(): string {
  return generatorVersion('variant');
}

export interface Built {
  set: VariantSet;
  /** Задания, раздел которых не загрузился. */
  failed: EgeNo[];
}

/** Партия по настройкам, seed и заменам — с кодом и версией. */
export async function buildSet(
  config: VariantConfig,
  seed: string,
  zameny: Record<string, number>,
): Promise<Built> {
  const version = currentVersion();
  const { adapters, failed } = await loadAdapters(config.tasks);
  const code = encodeCode({ seed, config, zameny, version }, SUBTYPE_IDS);
  const set = buildVariantSet({ config, seed, zameny, version, code }, adapters);
  return { set, failed };
}

/** Код → настройки, seed и замены. null — код не читается. */
export function readCode(code: string) {
  return decodeCode(code, SUBTYPE_IDS);
}
