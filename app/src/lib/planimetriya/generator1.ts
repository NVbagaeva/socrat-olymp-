/**
 * Подключение №1 к общему генератору: конфиг из блоков движка и адаптер
 * к листу (sheet1.ts): состояние генератора → SheetParams1 и обратно.
 * Устройство — как у №11 (lib/zadanie11/generator11.ts).
 *
 * Адрес набора — тот же, что у листа печати (m, i, s, v, seed, z, ps),
 * плюс уровни lv. Набор привязывает задачи к ключам позиций (ps=2).
 * Адрес прежнего генератора (без ps) открывается тем же листом, что был
 * напечатан, — по старой схеме, до первой правки состава.
 */

import {
  GENERATOR1_LEVELS,
  GENERATOR1_PRESETS,
  GENERATOR1_SOURCES,
  GENERATOR1_TEXTS,
} from '@/content/generator1';
import { SHEET_1 } from '@/content/repetitory1';
import { sostavIzSlotov, slotySostava } from '@/lib/generator/obshchiy/klyuchi';
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
import {
  parseSheetQuery1,
  sheetQuery1,
  subtitleOf,
  type Dop1,
  type Ramka,
  type SheetParams1,
  type VidRaboty1,
} from './sheet1';
import type { RazdelInfo, UslovieBanka } from './trenazher/sessiya';

export function config1(razdely: readonly RazdelInfo[], slot: string): GenConfig {
  return {
    id: '1',
    scope: '1',
    slot,
    section: GENERATOR1_TEXTS.section,
    sheet: GENERATOR1_TEXTS.sheet,
    topics: razdely.map((r) => {
      const bezBanka = r.podtipy.every((p) => p.vBanke === 0);
      return {
        id: r.id,
        title: r.nazvanie,
        /* Блок без задач банка — только в «банк + новые» и «только новые». */
        ...(bezBanka
          ? {
              note: GENERATOR1_TEXTS.bezBankaNote,
              sources: ['mix' as const, 'new' as const],
            }
          : {}),
        subtypes: r.podtipy.map((p) => ({
          id: p.id,
          code: p.kod,
          title: p.title,
          level: p.level,
          bank: p.vBanke,
        })),
      };
    }),
    levels: GENERATOR1_LEVELS,
    sources: GENERATOR1_SOURCES,
    presets: GENERATOR1_PRESETS,
    limits: { maxPerTopic: 6, maxTasks: 20, variantsMax: 8 },
    extras: {
      kinds: Object.entries(SHEET_1.vidy).map(([id, title]) => ({ id, title })),
    },
  };
}

/** План прежней схемы → состав: подряд идущие одинаковые прототипы склеиваются. */
function sostavPoNomeram(plan: readonly GenSlot[]): { id: string; n: number }[] {
  const out: { id: string; n: number }[] = [];
  for (const { id } of plan) {
    const last = out[out.length - 1];
    if (last !== undefined && last.id === id) last.n += 1;
    else out.push({ id, n: 1 });
  }
  return out;
}

/** «Дополнительно» → параметры листа; всё по умолчанию — без них. */
function dopIzExtras(e: GenExtras, config: GenConfig): Dop1 | undefined {
  if (JSON.stringify(e) === JSON.stringify(defaultExtras(config))) return undefined;
  return {
    teoriya: e.theory,
    primery: e.examples,
    qr: e.qr,
    vid: e.kind !== null && e.kind in SHEET_1.vidy ? (e.kind as VidRaboty1) : null,
    data: e.date,
    uchitel: e.teacher,
  };
}

/** «Дополнительно» из листа. У прежнего адреса — рамка f: −1 нет, 0–2 — рамка и примеры. */
function extrasIzParams(p: SheetParams1, config: GenConfig): GenExtras {
  const d = defaultExtras(config);
  if (p.dop !== undefined) {
    return {
      theory: p.dop.teoriya,
      examples: p.dop.primery,
      qr: p.dop.qr,
      kind: p.dop.vid,
      date: p.dop.data,
      teacher: p.dop.uchitel,
    };
  }
  if (p.ramka < 0) return d;
  return { ...d, theory: true, examples: p.ramka === 1 || p.ramka === 2 ? p.ramka : 0 };
}

export function paramsIzSostoyaniya(
  state: GenState & { seed: string },
  config: GenConfig,
): SheetParams1 {
  /* Один блок — «Задания для отработки»: заголовки блоков и рамка к
     каждому. Несколько блоков — лист в формате варианта ЕГЭ. */
  const topics = new Set(
    state.plan.map(({ id }) => config.topics.find((t) => t.subtypes.some((s) => s.id === id))?.id),
  );
  const legacy = state.legacy !== undefined;
  const dop = legacy ? undefined : dopIzExtras(state.extras, config);
  const e = state.extras;
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
    urok: 1,
    kod: '',
    nastroyki: { vykl: [], n: {} },
    theme: 'color',
    /* Прежняя схема знает только «рамка и k примеров». */
    ramka: legacy && (e.theory || e.examples > 0) ? e.examples : -1,
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

/** Рамка и примеры перед задачей — в предпросмотре, своей разметкой. */
function leadHtml(r: Ramka): string {
  const ramka =
    r.items.length === 0
      ? ''
      : `<div class="gen-recap"><b>${SHEET_1.povtoryaem}${r.title === '' ? '' : ` ${r.title}`}</b><ol>${r.items
          .map((i) => `<li>${i}</li>`)
          .join('')}</ol></div>`;
  const primery = r.primery
    .map(
      (y) =>
        `<div class="gen-example"><span class="gen-example__label">${SHEET_1.primer}</span><p class="gen-example__title">${y.title}</p>${y.figureSvg === '' ? '' : `<figure class="gen-task__fig">${y.figureSvg}</figure>`}<div class="gen-example__q">${y.conditionHtml}</div><div class="gen-example__sol">${y.solutionHtml}</div></div>`,
    )
    .join('');
  return ramka + primery;
}

export function engine1(
  config: GenConfig,
  razdely: readonly RazdelInfo[],
  bank: readonly UslovieBanka[],
  base: string,
): GenEngine {
  const query = (state: GenState & { seed: string }) =>
    sheetQuery1(paramsIzSostoyaniya(state, config));
  return {
    /* Прежний лист этого раздела умеет замены по номеру позиции. */
    legacyZameny: true,
    async build(state) {
      const { sobratList, ramkiLista, peredZadachami1 } = await import('./sheet1');
      const p = paramsIzSostoyaniya(state, config);
      const list = sobratList(p, bank);
      const ramki = ramkiLista(p, list);
      const sheet: GenSheet = {
        variants: list.poVariantam.map((zs) => {
          const pered = peredZadachami1(p, ramki, zs);
          return zs.map((z, i) => {
            const r = pered.get(i);
            return {
              pos: z.pos,
              no: z.no,
              questionHtml: z.questionHtml,
              answerHtml: z.answerHtml,
              solutionHtml: z.solutionHtml,
              fromBank: z.poz.vid === 'bank',
              figureSvg: z.figureSvg,
              figureTeacherSvg: z.figureUchitelSvg,
              ...(r === undefined ? {} : { lead: leadHtml(r) }),
            };
          });
        }),
        note: list.nehvatka > 0 ? GENERATOR1_TEXTS.nehvatka(list.nehvatka) : null,
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
      if (!q.has('s') || q.get('m') === 'u') return null;
      const p = parseSheetQuery1(q);
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
        extras: extrasIzParams(p, config),
        ...(p.poKlyucham === true ? {} : { legacy: q.get('m') === 'o' ? 'o' : 'v' }),
      };
    },
  };
}
