/**
 * Подключение №11 к общему генератору: конфиг из разделов движка и
 * адаптер к листу (sheet11.ts). Движок не меняется: адаптер переводит
 * состояние генератора в SheetParams11 и обратно.
 *
 * Адрес набора — тот же, что у листа печати (m, i, s, v, seed, z),
 * плюс уровни lv. Поэтому ссылки и комплекты, собранные прежним
 * генератором, открываются в новом.
 */

import {
  GENERATOR11_LEVELS,
  GENERATOR11_PRESETS,
  GENERATOR11_SOURCES,
  GENERATOR11_TEXTS,
} from '@/content/generator11';
import type {
  GenConfig,
  GenEngine,
  GenSheet,
  GenState,
  Level,
} from '@/lib/generator/obshchiy/types';
import { SHEET_11 } from '@/content/repetitory11';
import { parseSheetQuery11, sheetQuery11, type SheetParams11 } from './sheet11';
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
  };
}

/** План → состав движка: подряд идущие одинаковые подтипы склеиваются. */
export function sostavIzPlana(plan: readonly string[]): { id: string; n: number }[] {
  const out: { id: string; n: number }[] = [];
  for (const id of plan) {
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
    state.plan.map((id) => config.topics.find((t) => t.subtypes.some((s) => s.id === id))?.id),
  );
  return {
    rezhim: topics.size === 1 ? 'otrabotka' : 'komplekt',
    istochnik: state.source,
    sostav: sostavIzPlana(state.plan),
    variants: state.variants,
    seed: state.seed,
    zameny: state.zameny,
    marshrut: 1,
    theme: 'color',
  };
}

function levelsOfPlan(plan: readonly string[], razdely: readonly RazdelInfo[]): Level[] {
  const set = new Set<Level>();
  for (const r of razdely) for (const p of r.podtipy) if (plan.includes(p.id)) set.add(p.level);
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
      const { sobratList } = await import('./sheet11');
      const list = sobratList(paramsIzSostoyaniya(state, config), bank);
      const sheet: GenSheet = {
        variants: list.poVariantam.map((zs) =>
          zs.map((z) => ({
            pos: z.pos,
            no: z.no,
            questionHtml: z.questionHtml,
            answerHtml: z.answerHtml,
            solutionHtml: z.solutionHtml,
            fromBank: z.poz.vid === 'bank',
          })),
        ),
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
      return SHEET_11.subtitle[
        paramsIzSostoyaniya({ ...state, seed: '' }, config).rezhim === 'otrabotka'
          ? 'otrabotka'
          : 'komplekt'
      ];
    },
    parse(q) {
      if (!q.has('s') || q.get('m') === 'r') return null;
      const p = parseSheetQuery11(q);
      const plan = p.sostav.flatMap((x) => Array.from({ length: x.n }, () => x.id));
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
      };
    },
  };
}
