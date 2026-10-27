/**
 * Подключение №9 к общему генератору: конфиг из групп и прототипов
 * движка и адаптер к листу (sheet9.ts): состояние генератора →
 * SheetParams9 и обратно. Устройство — как у №2 и №8.
 *
 * Адрес набора — тот же, что у листа печати (ps=2: s, v, seed, z, k, d,
 * tr, r, u, uch, qr). Задачи — проверенные варианты движка, затем новые;
 * урок серии — в «Дополнительно». Адрес прежнего генератора
 * (g=I,II&n=10&r=2) открывается тем же листом, что был напечатан, — по
 * старой схеме, до первой правки.
 *
 * Формулы листа №9 — заглушки, их набирает страница печати; для
 * предпросмотра адаптер набирает их KaTeX сам (nabrat).
 */

import { GENERATOR9_PRESETS, GENERATOR9_SOURCES, GENERATOR9_TEXTS } from '@/content/generator9';
import { GEN_UI } from '@/content/generatorUi';
import contentSheet9 from '@/content/sheet9.js';
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
} from '@/lib/generator/obshchiy/types';
import { answerHtml } from '@/lib/sheet/answers9.js';
import { typeset } from '../tex';
import { PROTOTYPES, prototypeById } from './prototypes';
import {
  parseSheetQuery9,
  ramkiGruppy9,
  sheetQuery9,
  subtitleOf9,
  type Ramki9,
  type SheetParams9,
} from './sheet9';
import { GRUPPY } from './skills';
import type { Gruppa } from './types';

const VIDY = GEN_UI.vidyRaboty as Record<string, string>;

/** Уроков в серии — как у прежнего экрана. */
const UROKOV = 8;

export function config9(slot: string): GenConfig {
  return {
    id: '9',
    scope: '9',
    slot,
    section: GENERATOR9_TEXTS.section,
    sheet: GENERATOR9_TEXTS.sheet,
    topics: GRUPPY.map((g) => ({
      id: g.id,
      title: g.nazvanie,
      subtypes: PROTOTYPES.filter((p) => p.gruppa === g.id).map((p) => ({
        id: p.id,
        code: p.id,
        title: p.nazvanie,
        ...(p.nazvanie.includes('$') ? { titleHtml: typeset(p.nazvanie) } : {}),
        level: 1 as const,
        bank: 0,
      })),
    })).filter((t) => t.subtypes.length > 0),
    levels: [],
    sources: GENERATOR9_SOURCES,
    presets: GENERATOR9_PRESETS,
    limits: { maxPerTopic: 6, maxTasks: 20, variantsMax: 4 },
    extras: {
      kinds: Object.entries(VIDY).map(([id, title]) => ({ id, title })),
      seriya: UROKOV,
    },
  };
}

function gruppyPrototipov(ids: readonly string[]): Gruppa[] {
  return GRUPPY.filter((g) => ids.some((id) => prototypeById(id)?.gruppa === g.id)).map(
    (g) => g.id,
  );
}

export function paramsIzSostoyaniya(
  state: GenState & { seed: string },
  config: GenConfig,
): SheetParams9 {
  /* Прежний адрес — сам по себе, со своим seed. */
  if (state.legacy !== undefined) {
    return { ...parseSheetQuery9(new URLSearchParams(state.legacy)), seed: state.seed };
  }
  const e = state.extras;
  const sostav = sostavIzSlotov(state.plan);
  const prototypes = [...new Set(sostav.map((x) => x.id))];
  return {
    groups: gruppyPrototipov(prototypes),
    prototypes,
    count: state.plan.length,
    seed: state.seed,
    theme: 'color',
    layout: 'single',
    kind: vidRabotyText(config, e),
    date: e.date,
    ramki: e.examples,
    urok: e.urok,
    poKlyucham: true,
    sostav,
    variants: state.variants,
    zameny: state.zameny,
    ...(e.theory ? { zapomni: true } : {}),
    ...(e.teacher === config.sheet.teacher ? {} : { uchitel: e.teacher }),
    ...(e.qr ? { qr: true } : {}),
  };
}

/** «Дополнительно» из листа. У прежнего адреса «Запомни» шла вместе с примерами (r). */
function extrasIzParams(p: SheetParams9, config: GenConfig): GenExtras {
  return {
    ...defaultExtras(config),
    ...vidRabotyIz(config, p.kind),
    theory: p.poKlyucham === true ? p.zapomni === true : p.ramki > 0,
    examples: p.ramki,
    date: p.date,
    teacher: p.uchitel ?? config.sheet.teacher,
    qr: p.qr === true,
    urok: Math.min(p.urok, UROKOV - 1),
  };
}

/**
 * План прежнего адреса: задачи поровну по группам, остаток — первым;
 * внутри группы — по кругу по выбранным прототипам, как их брал лист.
 */
function planPrezhnego(p: SheetParams9): GenSlot[] {
  const per = Math.floor(p.count / Math.max(1, p.groups.length));
  let rest = p.count - per * p.groups.length;
  const ids: { id: string; n: number }[] = [];
  for (const g of p.groups) {
    const extra = rest > 0 ? 1 : 0;
    rest -= extra;
    const all = PROTOTYPES.filter((x) => x.gruppa === g).map((x) => x.id);
    const chosen = all.filter((id) => p.prototypes.includes(id));
    const pool = chosen.length > 0 ? chosen : all;
    for (let i = 0; i < per + extra; i += 1) {
      const id = pool[(p.urok * (per + extra) + i) % pool.length];
      if (id !== undefined) ids.push({ id, n: 1 });
    }
  }
  return slotySostava(ids);
}

/** Заглушки формул листа (typography.mathText) → KaTeX для предпросмотра. */
export const nabrat = nabratFormuly;

/** Строка «Ответ: …» в конце разбора листа: у предпросмотра своя. */
const BEZ_OTVETA = /<p class="sheet-task-answer">.*?<\/p>$/;

/** Рамка «Запомни» и примеры перед задачами группы — в предпросмотре, своей разметкой. */
function leadHtml(r: Ramki9): string {
  const ramka =
    r.zapomni.length === 0
      ? ''
      : `<div class="gen-recap"><b>${contentSheet9.labels.zapomni}</b><ol>${r.zapomni
          .map((line) => `<li>${typeset(line)}</li>`)
          .join('')}</ol></div>`;
  const primery = r.primery
    .map((x) => {
      const fig = x.figureSvg === null ? '' : `<div class="gen-example__fig">${x.figureSvg}</div>`;
      const etapy = x.etapy
        .map(
          (s) =>
            `<li><b>${typeset(s.zagolovok)}.</b> ${s.stroki.map((l) => typeset(l.replace(/\*\*/g, ''))).join('<br>')}</li>`,
        )
        .join('');
      return (
        `<div class="gen-example"><span class="gen-example__label">${contentSheet9.labels.example}</span>` +
        `<p class="gen-example__title">${typeset(x.title)}</p>` +
        `<div class="gen-example__q">${typeset(x.uslovie)}</div>${fig}` +
        `<div class="gen-example__sol"><ol>${etapy}</ol><p>${contentSheet9.labels.answer}: <b>${nabrat(answerHtml(x.answer))}</b></p></div></div>`
      );
    })
    .join('');
  return ramka + primery;
}

export function engine9(config: GenConfig, base: string): GenEngine {
  const query = (state: GenState & { seed: string }) =>
    sheetQuery9(paramsIzSostoyaniya(state, config));
  return {
    async build(state) {
      const { sheetVariants9 } = await import('./sheet9');
      const p = paramsIzSostoyaniya(state, config);
      const variants = sheetVariants9(p, true);
      const sheet: GenSheet = {
        variants: variants.map((blocks, vi) => {
          let i = 0;
          return blocks.flatMap((b) =>
            b.tasks.map((t, ti) => {
              i += 1;
              return {
                /* У прежнего листа ключей нет — позиция по номеру. */
                pos: t.pos ?? `${vi + 1}.${i}`,
                no: t.no,
                questionHtml: nabrat(t.questionHtml),
                answerHtml: nabrat(answerHtml(t.answer)),
                /* Класс z9-razbor листа на сайте занят карточкой разбора тренажёра. */
                solutionHtml: nabrat(
                  (t.solutionHtml ?? '').replace(BEZ_OTVETA, '').replace(/ z9-razbor/g, ''),
                ),
                fromBank: false,
                figureSvg: t.figureCondition,
                figureTeacherSvg: t.figureSvg,
                ...(ti === 0 && b.theory.length > 0
                  ? { lead: leadHtml(ramkiGruppy9(b.id as Gruppa, p)) }
                  : {}),
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
        link: `${base}/generator/?${q}`,
      };
    },
    subtitle(state) {
      const p = paramsIzSostoyaniya({ ...state, seed: '' }, config);
      return subtitleOf9(p) || contentSheet9.title.subtitle;
    },
    parse(q) {
      const p = parseSheetQuery9(q);
      if (p.poKlyucham === true) {
        const plan = slotySostava(p.sostav ?? []);
        if (plan.length === 0) return null;
        return {
          source: 'new',
          levels: [],
          variants: p.variants ?? 1,
          plan,
          seed: p.seed,
          zameny: p.zameny ?? {},
          extras: extrasIzParams(p, config),
        };
      }
      /* Прежний адрес генератора: группы и seed в нём есть всегда. */
      if (!q.has('g') || !q.has('seed')) return null;
      const plan = planPrezhnego(p);
      if (plan.length === 0) return null;
      return {
        source: 'new',
        levels: [],
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
