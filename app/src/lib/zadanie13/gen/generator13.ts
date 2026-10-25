/**
 * Подключение №13 к общему генератору (components/generator/): конфиг
 * и адаптер к листу (gen/sheet.ts, gen/list.ts). Движок задач — тот же.
 *
 * Темы — типы задач (A, B, C, D, «Определи тип», «Таблица руками»),
 * подтипы — прототипы с уровнем (базовый, повышенный); у «Определи тип»
 * подтип один: прототип берётся из всех схем по уровню листа. Адрес
 * набора — тот же, что у листа печати и онлайн-набора (ps=2: s, l, i, h,
 * f, a, v, zc, tt, d, tc, qr, seed, z). Прежний адрес генератора
 * (s=A:2,C:1&l=base&…) открывается тем же листом, что был напечатан.
 *
 * Прежние настройки экрана — в общем генераторе: уровень — фильтр
 * уровней, «Откуда задачи» — источник, рамка «Повторяем» — памятка,
 * «С полями для оформления» — переключатель раздела, «Лист учителя» —
 * выбор раздела, заголовок — вид работы (из списка или свой), «Зачёт» —
 * вид работы «Зачёт».
 */

import { GEN_UI } from '@/content/generatorUi';
import {
  GENERATOR_13,
  PRESETY_13,
  RAMKA_13,
  SHEET_13,
  VIDY_13,
  type Vid13,
} from '@/content/generator13';
import { slotySostava, sostavIzSlotov } from '@/lib/generator/obshchiy/klyuchi';
import { defaultExtras, vidRabotyIz, vidRabotyText } from '@/lib/generator/obshchiy/state';
import type {
  GenConfig,
  GenEngine,
  GenExtras,
  GenPreset,
  GenSlot,
  GenState,
  Level,
} from '@/lib/generator/obshchiy/types';
import { typeset } from '../../tex';
import { BANK_13 } from '../bank';
import { PROTOTYPES } from '../proto';
import { planLista13 } from './list';
import {
  BASE_13,
  genQuery13,
  listHref13,
  onlaynHref13,
  parseGenQuery13,
  sostavIzKlyuchey13,
  type GenParams13,
} from './params';

const VIDY = GEN_UI.vidyRaboty as Record<string, string>;

/** Лист учителя по умолчанию — краткие решения, как у прежнего генератора. */
const LIST_UCHITELYA_13 = 'kratko';

/** Подтип «Определи тип»: прототип выбирается из всех схем. */
export const PODTIP_TIP_13 = 'T';

/** Прототипы типа задач: «Таблица руками» — P-…, остальные — по схеме. */
export function prototipyVida13(vid: Vid13): typeof PROTOTYPES {
  if (vid === 'T') return [];
  return PROTOTYPES.filter((p) =>
    vid === 'P' ? p.id.startsWith('P-') : !p.id.startsWith('P-') && p.type === vid,
  );
}

/** Уровни листа ↔ уровень №13: только ★ — базовый, только ★★ — повышенный, оба — все. */
export function urovenIzUrovney(levels: readonly Level[]): 'base' | 'all' | 'hard' {
  const base = levels.includes(1);
  const hard = levels.includes(2);
  return base && !hard ? 'base' : hard && !base ? 'hard' : 'all';
}

export function urovniIzUrovnya(u: 'base' | 'all' | 'hard'): Level[] {
  return u === 'base' ? [1] : u === 'hard' ? [2] : [1, 2];
}

/** Вид работы пресета: заголовок из списка — id, другой — свой заголовок. */
function vidPreseta(title: string): Pick<GenPreset, 'kind' | 'svoy'> {
  const id = Object.entries(VIDY).find(([, t]) => t === title)?.[0];
  return id !== undefined ? { kind: id } : title === '' ? {} : { svoy: title };
}

export function config13(): GenConfig {
  return {
    id: '13',
    scope: '13',
    slot: `${BASE_13}/generator/`,
    section: `№13 · ${SHEET_13.text}`,
    sheet: {
      chip: SHEET_13.chip,
      title: SHEET_13.text,
      course: SHEET_13.head.course,
      teacher: SHEET_13.uchitel,
    },
    topics: VIDY_13.map((v) => ({
      id: v.id,
      title: v.label,
      note: v.note,
      subtypes:
        v.id === 'T'
          ? [
              {
                id: PODTIP_TIP_13,
                code: 'T',
                title: v.label,
                level: 1 as const,
                levels: [1, 2] as Level[],
                bank: 0,
              },
            ]
          : prototipyVida13(v.id).map((p) => ({
              id: p.id,
              code: p.id,
              title: p.title,
              ...(p.title.includes('$') ? { titleHtml: typeset(p.title) } : {}),
              level: p.difficulty === 'hard' ? (2 as const) : (1 as const),
              bank: BANK_13.filter(([id]) => id === p.id).length,
            })),
    })),
    levels: [
      { level: 1, words: GENERATOR_13.urovni[0].label },
      { level: 2, words: GENERATOR_13.urovni[2].label },
    ],
    sources: GENERATOR_13.istochniki.map((i) => ({
      id: i.id,
      title: i.label,
      short: i.label.toLowerCase(),
      note: GENERATOR_13.otkudaNote,
    })),
    presets: PRESETY_13.map((p): GenPreset => ({
      id: p.id,
      title: p.label,
      sub: p.note,
      variants: p.variants,
      levels: urovniIzUrovnya(p.uroven),
      sostav: { ...p.sostav } as Record<string, number>,
      ...vidPreseta(p.title),
      ...(p.vid === 'full' ? { flag: true } : {}),
      /* «Один тип»: учитель выбирает тип, в нём столько задач. */
      ...(p.id === 'odin-tip' ? { pickTopic: Object.values(p.sostav)[0] ?? 1 } : {}),
    })),
    limits: { maxPerTopic: 10, maxTasks: 40, variantsMax: 4 },
    extras: {
      kinds: Object.entries(VIDY).map(([id, title]) => ({ id, title })),
      examples: false,
      teoriyaNote: GENERATOR_13.teoriyaNote,
      flag: { title: GENERATOR_13.vidy[1].label, note: GENERATOR_13.vidNote },
      vybor: {
        title: GENERATOR_13.listUchitelya,
        options: GENERATOR_13.uchitelVidy.map((o) => ({ id: o.id, title: o.label })),
        poUmolchaniyu: LIST_UCHITELYA_13,
      },
    },
  };
}

/** Состояние генератора → параметры листа. Прежний адрес — сам по себе, со своим seed. */
export function paramsIzSostoyaniya13(
  state: GenState & { seed: string },
  config: GenConfig,
): GenParams13 {
  if (state.legacy !== undefined) {
    return {
      ...parseGenQuery13(new URLSearchParams(state.legacy)),
      seed: state.seed,
      zameny: state.zameny,
    };
  }
  const e = state.extras;
  const klyuchi = sostavIzSlotov(state.plan);
  return {
    sostav: sostavIzKlyuchey13(klyuchi),
    klyuchi,
    uroven: urovenIzUrovney(state.levels),
    istochnik: state.source as GenParams13['istochnik'],
    pomoshch: e.theory ? 'ramka' : 'net',
    vid: e.flag === true ? 'full' : 'compact',
    variants: state.variants,
    zachet: e.kind === 'zc',
    title: vidRabotyText(config, e),
    date: e.date,
    teacher: e.teacher,
    uchitel: (e.vybor ?? LIST_UCHITELYA_13) as GenParams13['uchitel'],
    theme: 'color',
    seed: state.seed,
    zameny: state.zameny,
    urok: 0,
    qr: e.qr,
  };
}

/** «Дополнительно» из листа. В прежних адресах QR есть всегда. */
function extrasIzParams(p: GenParams13, config: GenConfig): GenExtras {
  return {
    ...defaultExtras(config),
    ...vidRabotyIz(config, p.title),
    theory: p.pomoshch === 'ramka',
    date: /^\d{4}-\d{2}-\d{2}$/.test(p.date) ? p.date : '',
    teacher: p.teacher || config.sheet.teacher,
    qr: p.klyuchi === undefined || p.qr === true,
    ...(p.vid === 'full' ? { flag: true } : {}),
    ...(p.uchitel === LIST_UCHITELYA_13 ? {} : { vybor: p.uchitel }),
  };
}

/** Подтип задачи: «Определи тип» — один подтип на все схемы. */
function podtip(vid: Vid13, prototypeId: string): string {
  return vid === 'T' ? PODTIP_TIP_13 : prototypeId;
}

/**
 * Рамка «Повторяем» в предпросмотре: правила всех четырёх схем (по ним
 * схему не угадать), «Определи тип» и «Таблица руками» — если они есть.
 * На листе — те же правила с разобранными примерами.
 */
function povtorHtml(v: readonly { vid: Vid13 }[]): string {
  const vidy: Vid13[] = [
    'A',
    'B',
    'C',
    'D',
    ...(['T', 'P'] as const).filter((x) => v.some((z) => z.vid === x)),
  ];
  return `<div class="gen-recap"><b>${SHEET_13.ramka}</b><ol>${vidy
    .map((x) => `<li>${typeset(RAMKA_13[x].pravilo)}</li>`)
    .join('')}</ol></div>`;
}

function escapeHtml(text: string): string {
  return text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

export function engine13(config: GenConfig): GenEngine {
  return {
    async build(state) {
      const { sobratZadachu13, tablitsaUsloviya13 } = await import('./list');
      const p = paramsIzSostoyaniya13(state, config);
      return {
        variants: planLista13(p).map((v) =>
          v.map((poz, i) => {
            const z = sobratZadachu13(poz);
            return {
              ...(i === 0 && p.pomoshch === 'ramka' ? { lead: povtorHtml(v) } : {}),
              pos: z.pos,
              no: z.no,
              questionHtml: `<p>${z.questionHtml}</p>${tablitsaUsloviya13(z)}`,
              answerHtml: escapeHtml(z.answer),
              solutionHtml:
                p.uchitel === 'otvety' ? '' : p.uchitel === 'polno' ? z.polnoHtml : z.kratkoHtml,
              fromBank: false,
            };
          }),
        ),
        note: null,
      };
    },
    hrefs(state) {
      const p = paramsIzSostoyaniya13(state, config);
      return {
        student: listHref13(p, 'uchenik'),
        teacher: listHref13(p, 'uchitel'),
        all: listHref13(p, 'vse'),
        link: `${BASE_13}/generator/?${genQuery13(p)}`,
        online: onlaynHref13(p),
      };
    },
    subtitle(state) {
      return vidRabotyText(config, state.extras);
    },
    legacyZameny: true,
    parse(q) {
      if (!q.has('s') || !q.has('seed')) return null;
      const p = parseGenQuery13(q);
      /* Лист урока «Для репетиторов» — не набор генератора. */
      if (p.seed === '' || p.urok > 0) return null;
      if (p.klyuchi !== undefined) {
        const plan = slotySostava(p.klyuchi);
        if (plan.length === 0) return null;
        return {
          source: p.istochnik,
          levels: urovniIzUrovnya(p.uroven),
          variants: p.variants,
          plan,
          seed: p.seed,
          zameny: p.zameny,
          extras: extrasIzParams(p, config),
        };
      }
      /* Прежний адрес: план — задачи первого варианта в порядке листа. */
      const plan: GenSlot[] = slotySostava(
        (planLista13(p)[0] ?? []).map((poz) => ({ id: podtip(poz.vid, poz.prototypeId), n: 1 })),
      );
      if (plan.length === 0) return null;
      return {
        source: p.istochnik,
        levels: urovniIzUrovnya(p.uroven),
        variants: p.variants,
        plan,
        seed: p.seed,
        zameny: p.zameny,
        extras: extrasIzParams(p, config),
        legacy: q.toString(),
      };
    },
  };
}
