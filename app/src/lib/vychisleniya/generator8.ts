/**
 * Подключение №8 к общему генератору: конфиг из навыков и прототипов
 * движка и адаптер к листу (sheet8.ts): состояние генератора →
 * SheetParams8 и обратно. Устройство — как у №2.
 *
 * Темы — навыки S1–S11, подтипы — прототипы 8.A–8.Z. Уровень у №8 —
 * параметр генерации на весь лист: почти каждый прототип даёт и
 * базовую задачу, и повышенную. Фильтр ★ / ★★ задаёт его (оба — любой),
 * «Другого уровня» у отдельной задачи нет.
 *
 * Адрес набора — тот же, что у листа печати (ps=2: s, v, l, seed, z, k,
 * d, uch, qr). Адрес прежнего генератора (s=S1,S5&n=10&l=base) открывается
 * тем же листом, что был напечатан, — по старой схеме, до первой правки.
 */

import { GENERATOR8_PRESETS, GENERATOR8_SOURCES, GENERATOR8_TEXTS } from '@/content/generator8';
import { GEN_UI } from '@/content/generatorUi';
import contentSheet8 from '@/content/sheet8.js';
import { slotySostava, sostavIzSlotov } from '@/lib/generator/obshchiy/klyuchi';
import { defaultExtras } from '@/lib/generator/obshchiy/state';
import type {
  GenConfig,
  GenEngine,
  GenExtras,
  GenSheet,
  GenSlot,
  GenState,
  Level as GenLevel,
} from '@/lib/generator/obshchiy/types';
import { typeset } from '../tex';
import { hasLevel } from './generate';
import { prototypeById } from './prototypes';
import { LEVELS, SKILLS } from './skills';
import { parseSheetQuery8, sheetQuery8, subtitleOf8, type SheetParams8 } from './sheet8';
import type { Level } from './types';

const VIDY = GEN_UI.vidyRaboty as Record<string, string>;

/** Уровни движка — звёзды генератора: базовый ★, повышенный ★★. */
const ZVEZDY: Record<Level, GenLevel> = { base: 1, advanced: 2 };

/** Уровень листа по фильтру: один уровень — он, оба — любой. */
function urovenLista(levels: readonly GenLevel[]): Level | null {
  if (levels.length !== 1) return null;
  return levels[0] === 2 ? 'advanced' : 'base';
}

function urovniFiltra(level: Level | null): GenLevel[] {
  return level === null ? [1, 2] : [ZVEZDY[level]];
}

export function config8(slot: string): GenConfig {
  return {
    id: '8',
    scope: '8',
    slot,
    section: GENERATOR8_TEXTS.section,
    sheet: GENERATOR8_TEXTS.sheet,
    topics: SKILLS.map((skill) => ({
      id: skill.id,
      title: skill.nazvanie,
      subtypes: skill.prototypes.flatMap((id) => {
        const p = prototypeById(id);
        if (p === undefined) return [];
        const levels = LEVELS.filter((l) => hasLevel(p, l.id)).map((l) => ZVEZDY[l.id]);
        return [
          {
            id,
            code: id,
            title: p.nazvanie,
            ...(p.nazvanie.includes('$') ? { titleHtml: typeset(p.nazvanie) } : {}),
            level: levels[0] ?? 1,
            ...(levels.length > 1 ? { levels } : {}),
            bank: 0,
          },
        ];
      }),
    })),
    levels: LEVELS.map((l) => ({ level: ZVEZDY[l.id], words: l.lead.toLowerCase() })),
    taskLevel: false,
    sources: GENERATOR8_SOURCES,
    presets: GENERATOR8_PRESETS,
    limits: { maxPerTopic: 8, maxTasks: 20, variantsMax: 4 },
    /* Рамок теории и разобранных примеров у листа №8 нет. */
    extras: {
      kinds: Object.entries(VIDY).map(([id, title]) => ({ id, title })),
      theory: false,
      examples: false,
    },
  };
}

export function paramsIzSostoyaniya(
  state: GenState & { seed: string },
  config: GenConfig,
): SheetParams8 {
  /* Прежний адрес — сам по себе, со своим seed. */
  if (state.legacy !== undefined) {
    return { ...parseSheetQuery8(new URLSearchParams(state.legacy)), seed: state.seed };
  }
  const e = state.extras;
  const sostav = sostavIzSlotov(state.plan);
  return {
    skills: [
      ...new Set(
        state.plan.map(
          (s) => config.topics.find((t) => t.subtypes.some((x) => x.id === s.id))?.id ?? '',
        ),
      ),
    ],
    count: state.plan.length,
    level: urovenLista(state.levels),
    seed: state.seed,
    theme: 'color',
    layout: 'single',
    kind: e.kind === null ? '' : (VIDY[e.kind] ?? ''),
    date: e.date,
    poKlyucham: true,
    variants: state.variants,
    sostav,
    zameny: state.zameny,
    ...(e.teacher === config.sheet.teacher ? {} : { uchitel: e.teacher }),
    ...(e.qr ? { qr: true } : {}),
  };
}

/** «Дополнительно» из листа: вид работы — по названию из списка. */
function extrasIzParams(p: SheetParams8, config: GenConfig): GenExtras {
  const kind = Object.entries(VIDY).find(([, title]) => title === p.kind)?.[0] ?? null;
  return {
    ...defaultExtras(config),
    kind,
    date: p.date,
    teacher: p.uchitel ?? config.sheet.teacher,
    qr: p.qr === true,
  };
}

/**
 * План прежнего адреса: задачи поровну по навыкам, остаток — первым;
 * внутри навыка — по кругу по прототипам нужного уровня, как их брал
 * прежний лист.
 */
function planPrezhnego(p: SheetParams8, config: GenConfig): GenSlot[] {
  const per = Math.floor(p.count / Math.max(1, p.skills.length));
  let rest = p.count - per * p.skills.length;
  const ids: { id: string; n: number }[] = [];
  for (const skillId of p.skills) {
    const extra = rest > 0 ? 1 : 0;
    rest -= extra;
    const topic = config.topics.find((t) => t.id === skillId);
    if (topic === undefined) continue;
    const want = urovniFiltra(p.level);
    const fit = topic.subtypes.filter((s) => (s.levels ?? [s.level]).some((l) => want.includes(l)));
    const pool = fit.length > 0 ? fit : topic.subtypes;
    for (let i = 0; i < per + extra; i += 1) {
      const s = pool[i % pool.length];
      if (s !== undefined) ids.push({ id: s.id, n: 1 });
    }
  }
  return slotySostava(ids);
}

/** Строка «Ответ: …» в конце разбора листа. */
const BEZ_OTVETA = /<p class="sheet-task-answer">.*?<\/p>$/;

export function engine8(config: GenConfig, base: string): GenEngine {
  const query = (state: GenState & { seed: string }) =>
    sheetQuery8(paramsIzSostoyaniya(state, config));
  return {
    async build(state) {
      const { sheetVariants8 } = await import('./sheet8');
      const p = paramsIzSostoyaniya(state, config);
      const variants = sheetVariants8(p, true);
      const sheet: GenSheet = {
        variants: variants.map((blocks, vi) =>
          blocks
            .flatMap((b) => b.tasks)
            .map((t, i) => ({
              /* У прежнего листа ключей нет — позиция по номеру. */
              pos: t.pos ?? `${vi + 1}.${i + 1}`,
              no: t.no,
              questionHtml: t.questionHtml,
              answerHtml: t.answer,
              /* Строка ответа — у предпросмотра своя, из листа её не берём. */
              solutionHtml: (t.solutionHtml ?? '').replace(BEZ_OTVETA, ''),
              fromBank: false,
            })),
        ),
        note: null,
      };
      return sheet;
    },
    hrefs(state) {
      const q = query(state);
      return {
        student: `${base}/pechat/?${q}`,
        teacher: `${base}/pechat/otvety/?${q}`,
        all: `${base}/pechat/vse/?${q}`,
        link: `${base}/generator/?${q}`,
      };
    },
    subtitle(state) {
      const p = paramsIzSostoyaniya({ ...state, seed: '' }, config);
      return subtitleOf8(p) || contentSheet8.title.subtitle;
    },
    parse(q) {
      if (!q.has('s')) return null;
      const p = parseSheetQuery8(q);
      if (p.poKlyucham === true) {
        const plan = slotySostava(p.sostav ?? []);
        if (plan.length === 0) return null;
        return {
          source: 'new',
          levels: urovniFiltra(p.level),
          variants: p.variants ?? 1,
          plan,
          seed: p.seed,
          zameny: p.zameny ?? {},
          extras: extrasIzParams(p, config),
        };
      }
      const plan = planPrezhnego(p, config);
      if (plan.length === 0 || !q.has('seed')) return null;
      return {
        source: 'new',
        levels: urovniFiltra(p.level),
        variants: 1,
        plan,
        seed: p.seed,
        zameny: {},
        extras: extrasIzParams(p, config),
        legacy: q.toString(),
      };
    },
  };
}
