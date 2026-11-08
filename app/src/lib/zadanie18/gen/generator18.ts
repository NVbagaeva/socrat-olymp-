/**
 * Подключение №18 к общему генератору (components/generator/): конфиг
 * и адаптер к листу (list18.ts). Устройство — как у №3
 * (lib/zadanie3/gen/generator3.ts).
 *
 * Темы — группы ключевых схем, подтипы — типы задач тренажёра №18,
 * уровни ★–★★★ — как в тренажёре. Источник один: все задачи составлены
 * для сайта. Рамок теории и разобранных примеров у листа нет —
 * «Дополнительно» несёт QR-код, вид работы, дату и учителя.
 */

import {
  GENERATOR18_PRESETS,
  GENERATOR18_SOURCES,
  GENERATOR18_TEXTS,
  SHEET_GEN_18,
} from '@/content/generator18';
import { slotySostava, sostavIzSlotov } from '@/lib/generator/obshchiy/klyuchi';
import { defaultExtras, SVOY_VID } from '@/lib/generator/obshchiy/state';
import type {
  GenConfig,
  GenEngine,
  GenExtras,
  GenSheet,
  GenState,
  GenTopic,
} from '@/lib/generator/obshchiy/types';
import type { Zadacha18 } from '../trenazher/bank';
import {
  DOP_18,
  parseSheetQuery18,
  sheetQuery18,
  subtitleOf18,
  type Dop18,
  type SheetParams18,
  type VidRaboty18,
} from './params18';

/** Тип задачи для конфига: без условий и ответов — только что нужно экрану. */
export interface Tip18Info {
  id: string;
  nazvanie: string;
  uroven: 1 | 2 | 3;
  tema: string;
  /** Номер ключевой схемы — код на экране: «С7». */
  skhemaNo: number;
}

export interface Tema18Info {
  id: string;
  title: string;
}

export function config18(
  temy: readonly Tema18Info[],
  tipy: readonly Tip18Info[],
  slot: string,
): GenConfig {
  const topics: GenTopic[] = temy
    .map((t, i) => ({
      id: t.id,
      title: t.title,
      mark: String(i + 1),
      subtypes: tipy
        .filter((x) => x.tema === t.id)
        .map((x) => ({
          id: x.id,
          code: `С${x.skhemaNo}`,
          title: x.nazvanie,
          level: x.uroven,
          bank: 0,
        })),
    }))
    .filter((t) => t.subtypes.length > 0);
  return {
    id: '18',
    scope: '18',
    slot,
    section: GENERATOR18_TEXTS.section,
    sheet: GENERATOR18_TEXTS.sheet,
    topics,
    levels: [
      { level: 1, words: 'одна схема' },
      { level: 2, words: 'схема и вычисление' },
      { level: 3, words: 'две схемы' },
    ],
    sources: GENERATOR18_SOURCES,
    presets: GENERATOR18_PRESETS,
    limits: { variantsMax: 6 },
    extras: {
      kinds: Object.entries(SHEET_GEN_18.vidy).map(([id, title]) => ({ id, title })),
      theory: false,
      examples: false,
      flag: { title: GENERATOR18_TEXTS.cvetnye.title, note: GENERATOR18_TEXTS.cvetnye.note },
    },
  };
}

/** «Дополнительно» → параметры листа. */
function dopIzExtras(e: GenExtras): Dop18 {
  return {
    qr: e.qr,
    vid: e.kind !== null && e.kind in SHEET_GEN_18.vidy ? (e.kind as VidRaboty18) : null,
    ...(e.kind === SVOY_VID && e.svoy !== undefined ? { svoy: e.svoy } : {}),
    data: e.date,
    uchitel: e.teacher,
    ...(e.flag === true ? { cvetnye: true } : {}),
  };
}

function extrasIzDop(dop: Dop18, config: GenConfig): GenExtras {
  const svoy = dop.vid === null && dop.svoy !== undefined && dop.svoy !== '';
  return {
    ...defaultExtras(config),
    qr: dop.qr,
    kind: svoy ? SVOY_VID : dop.vid,
    date: dop.data,
    teacher: dop.uchitel || DOP_18.uchitel,
    ...(svoy ? { svoy: dop.svoy } : {}),
    ...(dop.cvetnye === true ? { flag: true } : {}),
  };
}

export function paramsIzSostoyaniya18(state: GenState & { seed: string }): SheetParams18 {
  return {
    sostav: sostavIzSlotov(state.plan),
    variants: state.variants,
    seed: state.seed,
    zameny: state.zameny,
    theme: 'color',
    dop: dopIzExtras(state.extras),
  };
}

/** Движок №18: банк приходит готовым со страницы (закрытые ответы). */
export function engine18(config: GenConfig, bank: readonly Zadacha18[], base: string): GenEngine {
  const est = (id: string) => bank.some((z) => z.tip === id);
  return {
    async build(state) {
      const { sobratList18 } = await import('./list18');
      /* Предпросмотр на экране — всегда цветные чертежи. */
      const list = sobratList18(paramsIzSostoyaniya18(state), bank, 'cvet');
      const sheet: GenSheet = {
        variants: list.poVariantam.map((zs) =>
          zs.map((z) => ({
            pos: z.pos,
            no: z.no,
            questionHtml: z.questionHtml,
            answerHtml: z.answer,
            solutionHtml: z.solutionHtml,
            fromBank: false,
            figureSvg: z.figureSvg,
            figureTeacherSvg: z.figureSvg,
          })),
        ),
        note: list.povtor > 0 ? GENERATOR18_TEXTS.povtor(list.povtor) : null,
      };
      return sheet;
    },
    hrefs(state) {
      const q = sheetQuery18(paramsIzSostoyaniya18(state));
      return {
        student: `${base}/pechat/?${q}`,
        teacher: `${base}/pechat/otvety/?${q}`,
        all: `${base}/pechat/vse/?${q}`,
        link: `${base}/generator/?${q}`,
      };
    },
    subtitle(state) {
      return subtitleOf18(paramsIzSostoyaniya18({ ...state, seed: '' }));
    },
    parse(q) {
      if (!q.has('s') || !q.has('seed')) return null;
      const p = parseSheetQuery18(q, est);
      const plan = slotySostava(p.sostav);
      if (plan.length === 0) return null;
      return {
        source: 'new',
        levels: [1, 2, 3],
        variants: p.variants,
        plan,
        seed: p.seed,
        zameny: p.zameny,
        extras: extrasIzDop(p.dop, config),
      };
    },
  };
}
