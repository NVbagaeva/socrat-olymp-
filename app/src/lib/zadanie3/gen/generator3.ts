/**
 * Подключение №3 к общему генератору (components/generator/): конфиг
 * из разделов банка и адаптер к листу (list3.ts): состояние генератора
 * → SheetParams3 и обратно. Устройство — как у №1
 * (lib/planimetriya/generator1.ts), без прежних адресов.
 *
 * Темы — разделы I–VIII, подтипы — прототипы. Сложность у №3 не
 * размечена: фильтра уровней нет. Рамки теории и разобранных примеров
 * у листа нет — «Дополнительно» несёт QR-код, вид работы, дату и учителя.
 */

import {
  GENERATOR3_PRESETS,
  GENERATOR3_SOURCES,
  GENERATOR3_TEXTS,
  SHEET_GEN_3,
} from '@/content/generator3';
import { slotySostava, sostavIzSlotov } from '@/lib/generator/obshchiy/klyuchi';
import { defaultExtras, SVOY_VID } from '@/lib/generator/obshchiy/state';
import type {
  GenConfig,
  GenEngine,
  GenExtras,
  GenSheet,
  GenState,
} from '@/lib/generator/obshchiy/types';
import type { Dannye03 } from '@/lib/variant/data/z03';
import type { Razdel3 } from './info';
import {
  DOP_3,
  parseSheetQuery3,
  sheetQuery3,
  subtitleOf,
  type Dop3,
  type SheetParams3,
  type VidRaboty3,
} from './params3';

export function config3(razdely: readonly Razdel3[], slot: string): GenConfig {
  return {
    id: '3',
    scope: '3',
    slot,
    section: GENERATOR3_TEXTS.section,
    sheet: GENERATOR3_TEXTS.sheet,
    topics: razdely.map((r) => {
      const bezBanka = r.prototipy.every((p) => p.bank.length === 0);
      return {
        id: r.id,
        title: `${r.nomer}. ${r.nazvanie}`,
        mark: r.nomer,
        /* Раздел без задач банка — только в «банк + наши» и «не из банка». */
        ...(bezBanka
          ? {
              note: GENERATOR3_TEXTS.bezBankaNote,
              sources: ['mix' as const, 'new' as const],
            }
          : {}),
        subtypes: r.prototipy.map((p) => ({
          id: p.id,
          code: p.id.replace(/^P03-/, ''),
          title: p.title,
          ...(p.titleHtml === undefined ? {} : { titleHtml: p.titleHtml }),
          level: 1 as const,
          bank: p.bank.length,
        })),
      };
    }),
    levels: [],
    sources: GENERATOR3_SOURCES,
    presets: GENERATOR3_PRESETS,
    limits: { maxPerTopic: 8, maxTasks: 20, variantsMax: 8 },
    extras: {
      kinds: Object.entries(SHEET_GEN_3.vidy).map(([id, title]) => ({ id, title })),
      theory: false,
      examples: false,
      flag: { title: GENERATOR3_TEXTS.rakurs.title, note: GENERATOR3_TEXTS.rakurs.note },
    },
  };
}

/** «Дополнительно» → параметры листа. */
function dopIzExtras(e: GenExtras): Dop3 {
  return {
    qr: e.qr,
    vid: e.kind !== null && e.kind in SHEET_GEN_3.vidy ? (e.kind as VidRaboty3) : null,
    ...(e.kind === SVOY_VID && e.svoy !== undefined ? { svoy: e.svoy } : {}),
    data: e.date,
    uchitel: e.teacher,
    ...(e.flag === true ? { kakVPrevyu: true } : {}),
  };
}

function extrasIzDop(dop: Dop3, config: GenConfig): GenExtras {
  const svoy = dop.vid === null && dop.svoy !== undefined && dop.svoy !== '';
  return {
    ...defaultExtras(config),
    qr: dop.qr,
    kind: svoy ? SVOY_VID : dop.vid,
    date: dop.data,
    teacher: dop.uchitel || DOP_3.uchitel,
    ...(svoy ? { svoy: dop.svoy } : {}),
    ...(dop.kakVPrevyu === true ? { flag: true } : {}),
  };
}

export function paramsIzSostoyaniya3(state: GenState & { seed: string }): SheetParams3 {
  return {
    istochnik: state.source,
    sostav: sostavIzSlotov(state.plan),
    variants: state.variants,
    seed: state.seed,
    zameny: state.zameny,
    poKlyucham: true,
    theme: 'color',
    dop: dopIzExtras(state.extras),
    ...(state.extras.flag === true && state.rakursy !== undefined
      ? { rakursy: state.rakursy }
      : {}),
  };
}

/**
 * Движок №3. dannye — задачи банка: в браузере файл «Собрать вариант»
 * (zagruzitDannye3), в автотесте — те же данные, собранные на месте.
 */
export function engine3(
  config: GenConfig,
  razdely: readonly Razdel3[],
  base: string,
  dannye: () => Promise<Dannye03>,
): GenEngine {
  const est = (id: string) => razdely.some((r) => r.prototipy.some((p) => p.id === id));
  return {
    async build(state) {
      const [{ sobratList3 }, d] = await Promise.all([import('./list3'), dannye()]);
      const p = paramsIzSostoyaniya3(state);
      const list = sobratList3(p, razdely, d);
      const sheet: GenSheet = {
        variants: list.poVariantam.map((zs) =>
          zs.map((z) => ({
            pos: z.pos,
            no: z.no,
            questionHtml: z.questionHtml,
            answerHtml: z.answer,
            solutionHtml: z.solutionHtml,
            fromBank: z.fromBank,
            figureSvg: z.figureSvg,
            figureTeacherSvg: z.figureUchitelSvg,
            ...(z.zhivoy === undefined ? {} : { figureZhivoy: z.zhivoy }),
            ...(z.zhivoyUchitel === undefined ? {} : { figureTeacherZhivoy: z.zhivoyUchitel }),
          })),
        ),
        note: list.nehvatka > 0 ? GENERATOR3_TEXTS.nehvatka(list.nehvatka) : null,
      };
      return sheet;
    },
    hrefs(state) {
      const q = sheetQuery3(paramsIzSostoyaniya3(state));
      return {
        student: `${base}/pechat/?${q}`,
        teacher: `${base}/pechat/otvety/?${q}`,
        all: `${base}/pechat/vse/?${q}`,
        link: `${base}/generator/?${q}`,
      };
    },
    subtitle(state) {
      return subtitleOf(paramsIzSostoyaniya3({ ...state, seed: '' }));
    },
    parse(q) {
      if (!q.has('s') || !q.has('seed')) return null;
      const p = parseSheetQuery3(q, est);
      const plan = slotySostava(p.sostav);
      if (plan.length === 0) return null;
      return {
        source: p.istochnik,
        levels: [1],
        variants: p.variants,
        plan,
        seed: p.seed,
        zameny: p.zameny,
        extras: extrasIzDop(p.dop, config),
        ...(p.rakursy === undefined ? {} : { rakursy: p.rakursy }),
      };
    },
  };
}
