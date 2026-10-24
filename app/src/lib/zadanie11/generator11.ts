/**
 * Подключение №11 к общему генератору: конфиг из разделов движка и
 * адаптер к листу (sheet11.ts): состояние генератора → SheetParams11 и
 * обратно.
 *
 * Адрес набора — тот же, что у листа печати (m, i, s, v, seed, z, ps),
 * плюс уровни lv. Набор привязывает задачи к ключам позиций (ps=2):
 * правка состава не меняет остальные задачи. Адрес прежнего генератора
 * (без ps) открывается тем же листом, что был напечатан, — по старой
 * схеме, до первой правки состава.
 */

import {
  GENERATOR11_LEVELS,
  GENERATOR11_PRESETS,
  GENERATOR11_SOURCES,
  GENERATOR11_TEXTS,
} from '@/content/generator11';
import { defaultExtras } from '@/lib/generator/obshchiy/state';
import type {
  GenConfig,
  GenEngine,
  GenExtras,
  GenSheet,
  GenSlot,
  GenState,
  Level,
} from '@/lib/generator/obshchiy/types';
import { SHEET_11 } from '@/content/repetitory11';
import {
  parseSheetQuery11,
  sheetQuery11,
  slotySostava,
  sostavIzSlotov,
  subtitleOf,
  type Dop11,
  type Primer11,
  type Ramka11,
  type SheetParams11,
  type VidRaboty11,
} from './sheet11';
import type { RazdelInfo, UslovieBanka } from './trenazher/sessiya';

export function config11(razdely: readonly RazdelInfo[], slot: string): GenConfig {
  return {
    id: '11',
    scope: '11',
    slot,
    section: GENERATOR11_TEXTS.section,
    sheet: GENERATOR11_TEXTS.sheet,
    topics: razdely.map((r) => ({
      id: r.id,
      title: r.nazvanie,
      /* Разминка — свои задачи, не открытый банк. */
      ...(r.id === 'RZ'
        ? { note: GENERATOR11_TEXTS.razminkaNote, sources: ['mix' as const, 'new' as const] }
        : {}),
      subtypes: r.podtipy.map((p) => ({
        id: p.id,
        code: p.kod,
        title: p.title,
        level: p.level,
        bank: r.id === 'RZ' ? 0 : p.vBanke,
      })),
    })),
    levels: GENERATOR11_LEVELS,
    sources: GENERATOR11_SOURCES,
    presets: GENERATOR11_PRESETS,
    limits: { maxPerTopic: 6, maxTasks: 20, variantsMax: 8 },
    extras: {
      kinds: Object.entries(SHEET_11.vidy).map(([id, title]) => ({ id, title })),
    },
  };
}

/** «Дополнительно» → параметры листа; всё по умолчанию — без них. */
function dopIzExtras(e: GenExtras, config: GenConfig): Dop11 | undefined {
  const d = defaultExtras(config);
  if (JSON.stringify(e) === JSON.stringify(d)) return undefined;
  return {
    teoriya: e.theory,
    primery: e.examples,
    qr: e.qr,
    vid: e.kind !== null && e.kind in SHEET_11.vidy ? (e.kind as VidRaboty11) : null,
    data: e.date,
    uchitel: e.teacher,
  };
}

function extrasIzDop(dop: Dop11 | undefined, config: GenConfig): GenExtras {
  if (dop === undefined) return defaultExtras(config);
  return {
    theory: dop.teoriya,
    examples: dop.primery,
    qr: dop.qr,
    kind: dop.vid,
    date: dop.data,
    teacher: dop.uchitel,
  };
}

/** Рамка и примеры перед задачей — в предпросмотре, своей разметкой. */
function leadHtml(x: { ramka: Ramka11 | null; primery: Primer11[] }): string {
  const ramka =
    x.ramka === null
      ? ''
      : `<div class="gen-recap"><b>${x.ramka.title}</b><ol>${x.ramka.items
          .map((i) => `<li>${i}</li>`)
          .join('')}</ol></div>`;
  const primery = x.primery
    .map(
      (y) =>
        `<div class="gen-example"><span class="gen-example__label">${SHEET_11.primer}</span><p class="gen-example__title">${y.title}</p><div class="gen-example__q">${y.questionHtml}</div><div class="gen-example__sol">${y.solutionHtml}<p>${SHEET_11.otvet}: <b>${y.answerHtml}</b></p></div></div>`,
    )
    .join('');
  return ramka + primery;
}

/** План прежней схемы → состав: подряд идущие одинаковые подтипы склеиваются. */
function sostavPoNomeram(plan: readonly GenSlot[]): { id: string; n: number }[] {
  const out: { id: string; n: number }[] = [];
  for (const { id } of plan) {
    const last = out[out.length - 1];
    if (last !== undefined && last.id === id) last.n += 1;
    else out.push({ id, n: 1 });
  }
  return out;
}

export function paramsIzSostoyaniya(
  state: GenState & { seed: string },
  config: GenConfig,
): SheetParams11 {
  /* Одна тема — «Задания для отработки»: блоки по подтипам с заголовками.
     Несколько тем — лист в формате варианта ЕГЭ. */
  const topics = new Set(
    state.plan.map(({ id }) => config.topics.find((t) => t.subtypes.some((s) => s.id === id))?.id),
  );
  const legacy = state.legacy !== undefined;
  const dop = dopIzExtras(state.extras, config);
  return {
    /* У прежнего адреса — его режим, чтобы лист совпал с напечатанным. */
    rezhim: legacy
      ? state.legacy === 'o'
        ? 'otrabotka'
        : 'komplekt'
      : topics.size === 1
        ? 'otrabotka'
        : 'komplekt',
    istochnik: state.source,
    sostav: legacy ? sostavPoNomeram(state.plan) : sostavIzSlotov(state.plan),
    variants: state.variants,
    seed: state.seed,
    zameny: state.zameny,
    marshrut: 1,
    theme: 'color',
    ...(legacy ? {} : { poKlyucham: true }),
    ...(dop === undefined ? {} : { dop }),
  };
}

function levelsOfPlan(plan: readonly GenSlot[], razdely: readonly RazdelInfo[]): Level[] {
  const ids = new Set(plan.map((s) => s.id));
  const set = new Set<Level>();
  for (const r of razdely) for (const p of r.podtipy) if (ids.has(p.id)) set.add(p.level);
  return set.size === 0 ? [1, 2, 3] : [...set].sort();
}

export function engine11(
  config: GenConfig,
  razdely: readonly RazdelInfo[],
  bank: readonly UslovieBanka[],
  base: string,
): GenEngine {
  const query = (state: GenState & { seed: string }) =>
    sheetQuery11(paramsIzSostoyaniya(state, config));
  return {
    async build(state) {
      const { sobratList, peredZadachami } = await import('./sheet11');
      const p = paramsIzSostoyaniya(state, config);
      const list = sobratList(p, bank);
      const sheet: GenSheet = {
        variants: list.poVariantam.map((zs) => {
          const pered = peredZadachami(p, list, zs);
          return zs.map((z, i) => {
            const x = pered.get(i);
            return {
              pos: z.pos,
              no: z.no,
              questionHtml: z.questionHtml,
              answerHtml: z.answerHtml,
              solutionHtml: z.solutionHtml,
              fromBank: z.poz.vid === 'bank',
              ...(x === undefined ? {} : { lead: leadHtml(x) }),
            };
          });
        }),
        note: list.nehvatka > 0 ? GENERATOR11_TEXTS.nehvatka(list.nehvatka) : null,
      };
      return sheet;
    },
    hrefs(state) {
      const q = query(state);
      return {
        student: `${base}/pechat/?${q}`,
        teacher: `${base}/pechat/otvety/?${q}`,
        all: `${base}/pechat/vse/?${q}`,
        link: `${base}/generator/?${q}&lv=${[...state.levels].sort().join('')}`,
      };
    },
    subtitle(state) {
      return subtitleOf(paramsIzSostoyaniya({ ...state, seed: '' }, config));
    },
    parse(q) {
      if (!q.has('s') || q.get('m') === 'r') return null;
      const p = parseSheetQuery11(q);
      const plan = slotySostava(p.sostav);
      if (plan.length === 0) return null;
      const lv = (q.get('lv') ?? '')
        .split('')
        .map(Number)
        .filter((n): n is Level => n === 1 || n === 2 || n === 3);
      return {
        source: p.istochnik,
        levels: lv.length > 0 ? [...new Set(lv)].sort() : levelsOfPlan(plan, razdely),
        variants: p.variants,
        plan,
        seed: p.seed,
        zameny: p.zameny,
        extras: extrasIzDop(p.dop, config),
        ...(p.poKlyucham === true ? {} : { legacy: q.get('m') === 'o' ? 'o' : 'v' }),
      };
    },
  };
}
