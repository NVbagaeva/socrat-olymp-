/**
 * Адаптер №12 к общему генератору: состояние → SheetParams листа
 * (lib/generatorSheet.ts) и обратно. Работает в браузере: движок graph/
 * и лист грузятся только при сборке предпросмотра.
 *
 * Адрес набора — тот же, что у листа печати (ps=2: s, l, seed, v, z, k,
 * d, th, pr, uch, qr). Адреса прежнего генератора подтемы и генератора
 * по всем типам (s=12.A,12.B&n=10&pp=…) открываются тем же листом, что
 * был напечатан, — по старой схеме, до первой правки.
 */

import content from '@/content/sheet12.js';
import { nabratFormuly } from '@/lib/generator/nabrat';
import { slotySostava, sostavIzSlotov } from '@/lib/generator/obshchiy/klyuchi';
import { defaultExtras, vidRabotyIz, vidRabotyText } from '@/lib/generator/obshchiy/state';
import type {
  GenConfig,
  GenEngine,
  GenExtras,
  GenSheet,
  GenSlot,
  GenState,
  Level,
} from '@/lib/generator/obshchiy/types';
import { parseSheetQuery, sheetQuery, subtitleOf, type SheetParams } from '@/lib/generatorQuery';

function urovenLista(levels: readonly Level[]): string | null {
  if (levels.length !== 1) return null;
  return levels[0] === 2 ? 'unlucky' : 'lucky';
}

function urovniFiltra(level: string | null): Level[] {
  return level === 'lucky' ? [1] : level === 'unlucky' ? [2] : [1, 2];
}

export function paramsIzSostoyaniya(
  state: GenState & { seed: string },
  config: GenConfig,
): SheetParams {
  /* Прежний адрес — сам по себе, со своим seed. */
  if (state.legacy !== undefined) {
    return { ...parseSheetQuery(new URLSearchParams(state.legacy)), seed: state.seed };
  }
  const e = state.extras;
  const sostav = sostavIzSlotov(state.plan);
  return {
    skills: [...new Set(sostav.map((x) => x.id))],
    count: state.plan.length,
    level: urovenLista(state.levels),
    seed: state.seed,
    theme: 'color',
    layout: 'single',
    kind: vidRabotyText(config, e),
    date: e.date,
    variants: state.variants,
    theory: e.theory,
    examples: e.examples,
    poKlyucham: true,
    sostav,
    zameny: state.zameny,
    ...(e.teacher === config.sheet.teacher ? {} : { uchitel: e.teacher }),
    ...(e.qr ? { qr: true } : {}),
  };
}

function extrasIzParams(p: SheetParams, config: GenConfig): GenExtras {
  return {
    ...defaultExtras(config),
    ...vidRabotyIz(config, p.kind),
    theory: p.theory === true,
    examples: p.examples === 1 ? 1 : p.examples === 2 ? 2 : 0,
    date: p.date,
    teacher: p.uchitel ?? config.sheet.teacher,
    qr: p.qr === true,
  };
}

/** План прежнего адреса: задачи наборов (pp) или поровну, остаток — первым. */
function planPrezhnego(p: SheetParams): GenSlot[] {
  if (p.per !== undefined) {
    return slotySostava(p.skills.map((id) => ({ id, n: p.per?.[id] ?? 0 })));
  }
  const per = Math.floor(p.count / Math.max(1, p.skills.length));
  let rest = p.count - per * p.skills.length;
  return slotySostava(
    p.skills.map((id) => {
      const extra = rest > 0 ? 1 : 0;
      rest -= extra;
      return { id, n: per + extra };
    }),
  );
}

/** Строка «Ответ: …» листа у предпросмотра своя. */
type Variant = { text?: string; html?: string } | string;

function variantyHtml(options: unknown): string {
  if (!Array.isArray(options) || options.length === 0) return '';
  const items = (options as Variant[])
    .map((o) => (typeof o === 'string' ? o : (o.html ?? o.text ?? '')))
    .map((o) => `<li>${nabratFormuly(o)}</li>`)
    .join('');
  return `<ol class="gen-options">${items}</ol>`;
}

/** Условие задачи листа в предпросмотре: формулы набраны, варианты ответа списком. */
export function voprosPredprosmotra(t: { questionHtml: string; options: unknown }): string {
  return nabratFormuly(t.questionHtml) + variantyHtml(t.options);
}

/** Разметка рамки и примеров листа → разметка предпросмотра. */
function kPredprosmotru(html: string): string {
  return nabratFormuly(html)
    .replace(/class="sheet-item sheet-example[^"]*"/g, 'class="gen-example"')
    .replace(/class="sheet-example-label"/g, 'class="gen-example__label"')
    .replace(/class="sheet-example-title"/g, 'class="gen-example__title"')
    .replace(/class="sheet-task-question"/g, 'class="gen-example__q"')
    .replace(/class="sheet-task-solution"/g, 'class="gen-example__sol"')
    .replace(/class="sheet-figure"/g, 'class="gen-example__fig"');
}

function leadHtml(block: {
  recap?: { title: string; items: string[] } | null;
  leadItems?: string[];
}): string {
  const ramka =
    block.recap === null || block.recap === undefined
      ? ''
      : `<div class="gen-recap"><b>${block.recap.title}</b><ol>${block.recap.items
          .map((i) => `<li>${nabratFormuly(i)}</li>`)
          .join('')}</ol></div>`;
  return ramka + (block.leadItems ?? []).map(kPredprosmotru).join('');
}

export function engine12(config: GenConfig, base: string, link: (q: string) => string): GenEngine {
  const query = (state: GenState & { seed: string }) =>
    sheetQuery(paramsIzSostoyaniya(state, config));
  return {
    async build(state) {
      const { sheetSpec } = await import('@/lib/generatorSheet');
      const p = paramsIzSostoyaniya(state, config);
      const spec = sheetSpec(p, true, config.sheet.title);
      const variants = spec.variants ?? [{ blocks: spec.blocks }];
      const sheet: GenSheet = {
        variants: variants.map((v, vi) => {
          let i = 0;
          return v.blocks.flatMap((b) =>
            b.tasks.map((t, ti) => {
              i += 1;
              const lead = ti === 0 ? leadHtml(b) : '';
              return {
                /* У прежнего листа ключей нет — позиция по номеру. */
                pos: t.pos ?? `${vi + 1}.${i}`,
                no: t.no,
                questionHtml: voprosPredprosmotra(t),
                answerHtml: nabratFormuly(t.answerHtml ?? t.answer),
                solutionHtml: '',
                fromBank: false,
                figureSvg: t.figureSvg,
                figureTeacherSvg: t.solutionFigure?.svg ?? t.figureSvg,
                ...(lead === '' ? {} : { lead }),
              };
            }),
          );
        }),
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
        link: link(q),
      };
    },
    subtitle(state) {
      const p = paramsIzSostoyaniya({ ...state, seed: '' }, config);
      return subtitleOf(p) || content.title.subtitle;
    },
    parse(q) {
      if (!q.has('s')) return null;
      const p = parseSheetQuery(q);
      const svoi = new Set(config.topics.flatMap((t) => t.subtypes.map((s) => s.id)));
      if (p.poKlyucham === true) {
        const plan = slotySostava((p.sostav ?? []).filter((x) => svoi.has(x.id)));
        if (plan.length === 0) return null;
        return {
          source: 'new',
          levels: urovniFiltra(p.level),
          variants: p.variants,
          plan,
          seed: p.seed,
          zameny: p.zameny ?? {},
          extras: extrasIzParams(p, config),
        };
      }
      if (!q.has('seed') || p.skills.length === 0 || !p.skills.every((id) => svoi.has(id))) {
        return null;
      }
      const plan = planPrezhnego(p);
      if (plan.length === 0) return null;
      return {
        source: 'new',
        levels: urovniFiltra(p.level),
        variants: p.variants,
        plan,
        seed: p.seed,
        zameny: {},
        extras: extrasIzParams(p, config),
        legacy: q.toString(),
      };
    },
  };
}
