/**
 * Подключение №2 к общему генератору: конфиг из групп и прототипов
 * движка и адаптер к листу (sheet2.ts): состояние генератора →
 * SheetParams2 и обратно. Устройство — как у №11 и №1.
 *
 * Адрес набора — тот же, что у листа печати (ps=2: s, v, seed, z, k,
 * d, uch, qr). Задачи №2 только генерируются: источник один, уровней
 * нет. Адрес прежнего генератора (s=A1,B3&n=10) открывается тем же
 * листом, что был напечатан, — по старой схеме, до первой правки.
 */

import { GENERATOR2_PRESETS, GENERATOR2_SOURCES, GENERATOR2_TEXTS } from '@/content/generator2';
import { GEN_UI } from '@/content/generatorUi';
import { SHEET_2 } from '@/content/sheet2';
import { O_ZADANII } from '@/content/vektory';
import { slotySostava, sostavIzSlotov } from '@/lib/generator/obshchiy/klyuchi';
import { defaultExtras, vidRabotyIz, vidRabotyText } from '@/lib/generator/obshchiy/state';
import type {
  GenConfig,
  GenEngine,
  GenExtras,
  GenSheet,
  GenSlot,
  GenState,
} from '@/lib/generator/obshchiy/types';
import { typeset } from '../tex';
import { PROTOTYPES } from './prototypes';
import { parseSheetQuery2, sheetQuery2, subtitleOf2, type SheetParams2 } from './sheet2';

const VIDY = GEN_UI.vidyRaboty as Record<string, string>;

export function config2(slot: string): GenConfig {
  return {
    id: '2',
    scope: '2',
    slot,
    section: GENERATOR2_TEXTS.section,
    sheet: GENERATOR2_TEXTS.sheet,
    topics: O_ZADANII.gruppy.map((g) => ({
      id: g.id,
      title: g.title,
      subtypes: PROTOTYPES.filter((p) => p.id.startsWith(g.id)).map((p) => ({
        id: p.id,
        code: p.id,
        title: p.nazvanie,
        ...(p.nazvanie.includes('$') ? { titleHtml: typeset(p.nazvanie) } : {}),
        level: 1 as const,
        bank: 0,
      })),
    })),
    levels: [],
    sources: GENERATOR2_SOURCES,
    presets: GENERATOR2_PRESETS,
    limits: { maxPerTopic: 6, maxTasks: 20, variantsMax: 4 },
    /* Рамок теории и разобранных примеров у листа №2 нет. */
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
): SheetParams2 {
  /* Прежний адрес — сам по себе, со своим seed. */
  if (state.legacy !== undefined) {
    return { ...parseSheetQuery2(new URLSearchParams(state.legacy)), seed: state.seed };
  }
  const e = state.extras;
  const sostav = sostavIzSlotov(state.plan);
  return {
    prototypes: [...new Set(sostav.map((x) => x.id))],
    count: state.plan.length,
    variants: state.variants,
    seed: state.seed,
    theme: 'color',
    layout: 'single',
    kind: vidRabotyText(config, e),
    date: e.date,
    bank: false,
    poKlyucham: true,
    sostav,
    zameny: state.zameny,
    ...(e.teacher === config.sheet.teacher ? {} : { uchitel: e.teacher }),
    ...(e.qr ? { qr: true } : {}),
  };
}

/** «Дополнительно» из листа: вид работы — по названию из списка. */
function extrasIzParams(p: SheetParams2, config: GenConfig): GenExtras {
  return {
    ...defaultExtras(config),
    ...vidRabotyIz(config, p.kind),
    date: p.date,
    teacher: p.uchitel ?? config.sheet.teacher,
    qr: p.qr === true,
  };
}

/** План прежнего адреса: общее число задач поровну по прототипам, остаток — первым. */
function planPrezhnego(p: SheetParams2): GenSlot[] {
  const per = Math.floor(p.count / Math.max(1, p.prototypes.length));
  let rest = p.count - per * p.prototypes.length;
  return slotySostava(
    p.prototypes.map((id) => {
      const extra = rest > 0 ? 1 : 0;
      rest -= extra;
      return { id, n: per + extra };
    }),
  );
}

/** Строка «Ответ: …» в конце разбора листа. */
const BEZ_OTVETA = /<p class="sheet-task-answer">.*?<\/p>$/;

export function engine2(config: GenConfig, base: string): GenEngine {
  const query = (state: GenState & { seed: string }) =>
    sheetQuery2(paramsIzSostoyaniya(state, config));
  return {
    async build(state) {
      const { sheetVariants2 } = await import('./sheet2');
      const p = paramsIzSostoyaniya(state, config);
      const variants = sheetVariants2(p, true);
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
              figureSvg: t.figureSvg,
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
      return subtitleOf2(p) || SHEET_2.title.subtitle;
    },
    parse(q) {
      if (!q.has('s') || q.get('bank') === '1') return null;
      const p = parseSheetQuery2(q);
      if (p.poKlyucham === true) {
        const plan = slotySostava(p.sostav ?? []);
        if (plan.length === 0) return null;
        return {
          source: 'new',
          levels: [],
          variants: p.variants,
          plan,
          seed: p.seed,
          zameny: p.zameny ?? {},
          extras: extrasIzParams(p, config),
        };
      }
      if (p.prototypes.length === 0 || !q.has('seed')) return null;
      return {
        source: 'new',
        levels: [],
        variants: p.variants,
        plan: planPrezhnego(p),
        seed: p.seed,
        zameny: {},
        extras: extrasIzParams(p, config),
        legacy: q.toString(),
      };
    },
  };
}
