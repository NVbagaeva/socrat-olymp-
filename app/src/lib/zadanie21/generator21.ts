/**
 * Подключение раздела «Наибольшее и наименьшее значение функции» к
 * общему генератору: конфиг из групп и прототипов движка и адаптер к
 * листу (sheet21.ts). Устройство — как у №2: задачи только генерируются,
 * источник один, уровней нет. Адрес набора — тот же, что у листа
 * печати (ps=2).
 */

import { GENERATOR21_PRESETS, GENERATOR21_SOURCES, GENERATOR21_TEXTS } from '@/content/generator21';
import { GEN_UI } from '@/content/generatorUi';
import { SHEET_21 } from '@/content/sheet21';
import { slotySostava, sostavIzSlotov } from '@/lib/generator/obshchiy/klyuchi';
import { defaultExtras, vidRabotyIz, vidRabotyText } from '@/lib/generator/obshchiy/state';
import type {
  GenConfig,
  GenEngine,
  GenExtras,
  GenSheet,
  GenState,
} from '@/lib/generator/obshchiy/types';
import { texPlain, typeset } from '../tex';
import { GRUPPY21, prototypesOfGruppa } from './gruppy';
import { parseSheetQuery21, sheetQuery21, subtitleOf21, type SheetParams21 } from './sheet21';

const VIDY = GEN_UI.vidyRaboty as Record<string, string>;

export function config21(slot: string): GenConfig {
  return {
    id: '21',
    scope: '21',
    slot,
    section: GENERATOR21_TEXTS.section,
    sheet: GENERATOR21_TEXTS.sheet,
    topics: GRUPPY21.map((g) => ({
      id: `G${g.id}`,
      title: texPlain(g.title),
      ...(g.title.includes('$') ? { titleHtml: typeset(g.title) } : {}),
      subtypes: prototypesOfGruppa(g.id).map((p) => ({
        id: p.id,
        code: p.id,
        title: texPlain(p.title),
        ...(p.title.includes('$') ? { titleHtml: typeset(p.title) } : {}),
        level: 1 as const,
        bank: 0,
      })),
    })),
    levels: [],
    sources: GENERATOR21_SOURCES,
    presets: GENERATOR21_PRESETS,
    limits: { variantsMax: 4 },
    /* Рамок теории и разобранных примеров у листа нет. */
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
): SheetParams21 {
  const e = state.extras;
  return {
    sostav: sostavIzSlotov(state.plan),
    variants: state.variants,
    seed: state.seed,
    theme: 'color',
    layout: 'single',
    kind: vidRabotyText(config, e),
    date: e.date,
    zameny: state.zameny,
    ...(e.teacher === config.sheet.teacher ? {} : { uchitel: e.teacher }),
    ...(e.qr ? { qr: true } : {}),
  };
}

function extrasIzParams(p: SheetParams21, config: GenConfig): GenExtras {
  return {
    ...defaultExtras(config),
    ...vidRabotyIz(config, p.kind),
    date: p.date,
    teacher: p.uchitel ?? config.sheet.teacher,
    qr: p.qr === true,
  };
}

/** Строка «Ответ: …» в конце разбора листа: у предпросмотра своя. */
const BEZ_OTVETA = /<p class="sheet-task-answer">.*?<\/p>$/;

export function engine21(config: GenConfig, base: string): GenEngine {
  const query = (state: GenState & { seed: string }) =>
    sheetQuery21(paramsIzSostoyaniya(state, config));
  return {
    async build(state) {
      const { sheetVariants21 } = await import('./sheet21');
      const variants = sheetVariants21(paramsIzSostoyaniya(state, config), true);
      const sheet: GenSheet = {
        variants: variants.map((blocks) =>
          blocks
            .flatMap((b) => b.tasks)
            .map((t) => ({
              pos: t.pos,
              no: t.no,
              questionHtml: t.questionHtml,
              answerHtml: t.answer,
              solutionHtml: (t.solutionHtml ?? '').replace(BEZ_OTVETA, ''),
              fromBank: false,
              figureSvg: null,
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
      return (
        subtitleOf21(paramsIzSostoyaniya({ ...state, seed: '' }, config)) || SHEET_21.title.subtitle
      );
    },
    parse(q) {
      if (q.get('ps') !== '2' || !q.has('s')) return null;
      const p = parseSheetQuery21(q);
      const plan = slotySostava(p.sostav);
      if (plan.length === 0) return null;
      return {
        source: 'new',
        levels: [],
        variants: p.variants,
        plan,
        seed: p.seed,
        zameny: p.zameny,
        extras: extrasIzParams(p, config),
      };
    },
  };
}
