/**
 * Адаптер общего генератора для разделов с банком готовых задач (№6,
 * №7; №10 — по тому же образцу): состояние генератора ↔ адрес листа
 * (lib/generator/obshchiy/bank.ts) и предпросмотр из модели листа.
 *
 * Лист печати раздела — React-компоненты (List6, List7); предпросмотр
 * собирает модуль раздела (predprosmotr6.tsx …) теми же компонентами,
 * в строку HTML. Он грузится при первой сборке листа вместе с банком.
 *
 * Адрес прежнего генератора (t=P01:2&i=m&v=2&e=1&seed=…) открывается
 * тем же листом, что был напечатан, — по старой схеме до первой правки.
 */

import { slotySostava, sostavIzSlotov } from './klyuchi';
import { defaultExtras } from './state';
import type { BlokBanka, IstochnikBanka, ZaprosBanka } from './bank';
import { zaprosBankaQuery } from './bank';
import type {
  GenConfig,
  GenEngine,
  GenExtras,
  GenSheet,
  GenState,
  GenTask,
  SourceId,
} from './types';

/** Источник общего генератора ↔ источник банка: bank — исходные, new — аналоги. */
export function istochnikBanka(s: SourceId): IstochnikBanka {
  return s === 'bank' ? 'fipi' : s === 'new' ? 'analog' : 'mix';
}

export function istochnikGeneratora(i: IstochnikBanka): SourceId {
  return i === 'fipi' ? 'bank' : i === 'analog' ? 'new' : 'mix';
}

/** Задача листа для предпросмотра — уже в HTML. */
export interface ZadachaHtml {
  question: string;
  answer: string;
  solution: string;
  /** Аналог — «не из открытого банка». */
  analog: boolean;
}

/** Собранный лист: блоки модели и HTML задач, памятки и примеров. */
export interface ListHtml {
  bloki: BlokBanka[];
  zadacha: (id: string) => ZadachaHtml | null;
  /** Рамка «Повторяем теорию» по прототипам — HTML. */
  pamyatka: (protos: string[]) => string;
  /** Разобранный пример — HTML. */
  primer: (id: string) => string;
}

/** Модуль раздела: лист по адресу или null — адрес не его. */
export type SobratListHtml = (q: URLSearchParams) => Promise<ListHtml | null>;

/** Прежний адрес генератора раздела, разобранный. */
export interface StaryyZapros {
  tipy: { id: string; n: number }[];
  istochnik: IstochnikBanka;
  variantov: number;
  primery: 0 | 1 | 2;
  seed: string;
  filtr?: string;
}

export interface BankSection {
  /** Адрес раздела: «/zadaniya/6». */
  base: string;
  /** Адрес экрана генератора до строки параметров. */
  ekran: (q: string) => string;
  /** Учитель по умолчанию. */
  avtor: string;
  parseKlyuchi: (q: URLSearchParams) => ZaprosBanka | null;
  parseStaryy: (q: URLSearchParams) => StaryyZapros | null;
  sobrat: () => Promise<SobratListHtml>;
  /** Подзаголовок листа без вида работы. */
  podzagolovok: string;
}

function vidy(config: GenConfig): Record<string, string> {
  return Object.fromEntries((config.extras?.kinds ?? []).map((k) => [k.id, k.title]));
}

export function zaprosIzSostoyaniya(
  state: GenState & { seed: string },
  config: GenConfig,
): ZaprosBanka {
  const e = state.extras;
  return {
    sostav: sostavIzSlotov(state.plan),
    istochnik: istochnikBanka(state.source),
    variants: state.variants,
    seed: state.seed,
    zameny: state.zameny,
    pamyatka: e.theory,
    primery: e.examples,
    kind: e.kind === null ? '' : (vidy(config)[e.kind] ?? ''),
    date: e.date,
    ...(e.teacher === config.sheet.teacher ? {} : { uchitel: e.teacher }),
    qr: e.qr,
    ...(config.filtr === undefined
      ? {}
      : { filtr: state.filtr ?? (config.filtr.options[0]?.id as string) }),
  };
}

function extrasIzZaprosa(z: ZaprosBanka, config: GenConfig): GenExtras {
  return {
    ...defaultExtras(config),
    theory: z.pamyatka,
    examples: z.primery,
    kind: Object.entries(vidy(config)).find(([, t]) => t === z.kind)?.[0] ?? null,
    date: z.date,
    teacher: z.uchitel ?? config.sheet.teacher,
    qr: z.qr,
  };
}

/** Новая сборка листа: задачи по позициям; прежний адрес — номера по порядку. */
function zadachiIzBlokov(l: ListHtml, legacy: boolean): GenTask[][] {
  const zadachi = l.bloki.find((b) => b.id === 'zadachi');
  const teoriya = l.bloki.find((b) => b.id === 'teoriya');
  const lead =
    teoriya === undefined
      ? ''
      : (teoriya.teoriya === undefined ? '' : l.pamyatka(teoriya.teoriya)) +
        (teoriya.primery ?? []).map((id) => l.primer(id)).join('');
  const variants = (zadachi?.spiski ?? []).map((ids, vi) =>
    ids.flatMap((id, i): GenTask[] => {
      const z = l.zadacha(id);
      if (z === null) return [];
      return [
        {
          pos: legacy
            ? `${vi + 1}.${i + 1}`
            : (zadachi?.pozicii?.[vi]?.[i] ?? `${vi + 1}.${i + 1}`),
          no: i + 1,
          questionHtml: z.question,
          answerHtml: z.answer,
          solutionHtml: z.solution,
          fromBank: !z.analog,
          ...(i === 0 && lead !== '' ? { lead } : {}),
        },
      ];
    }),
  );
  return variants;
}

export function bankEngine(config: GenConfig, s: BankSection): GenEngine {
  const query = (state: GenState & { seed: string }) => {
    if (state.legacy !== undefined) {
      const q = new URLSearchParams(state.legacy);
      q.set('seed', state.seed);
      return q.toString();
    }
    return zaprosBankaQuery(zaprosIzSostoyaniya(state, config), s.avtor);
  };
  return {
    async build(state) {
      const sobrat = await s.sobrat();
      const l = await sobrat(new URLSearchParams(query(state)));
      if (l === null) return { variants: [], note: null };
      const variants = zadachiIzBlokov(l, state.legacy !== undefined);
      /* Банк конечен: позиций больше, чем задач прототипа, — сказать. */
      const zhdali = state.legacy !== undefined ? null : state.plan.length;
      const korotko = zhdali !== null && variants.some((v) => v.length < zhdali);
      const sheet: GenSheet = {
        variants,
        note: korotko ? 'В банке не хватило задач на все позиции: лист короче.' : null,
      };
      return sheet;
    },
    hrefs(state) {
      const q = query(state);
      return {
        student: `${s.base}/pechat/?${q}`,
        teacher: `${s.base}/pechat/otvety/?${q}`,
        all: `${s.base}/pechat/vse/?${q}`,
        link: s.ekran(q),
      };
    },
    subtitle(state) {
      const kind = state.extras.kind === null ? '' : (vidy(config)[state.extras.kind] ?? '');
      return kind !== '' ? kind : s.podzagolovok;
    },
    parse(q) {
      const z = s.parseKlyuchi(q);
      if (z !== null) {
        const plan = slotySostava(z.sostav);
        if (plan.length === 0) return null;
        return {
          source: istochnikGeneratora(z.istochnik),
          levels: [],
          variants: z.variants,
          plan,
          seed: z.seed,
          zameny: z.zameny,
          extras: extrasIzZaprosa(z, config),
          ...(z.filtr === undefined ? {} : { filtr: z.filtr }),
        };
      }
      const old = s.parseStaryy(q);
      if (old === null) return null;
      const plan = slotySostava(old.tipy);
      if (plan.length === 0) return null;
      return {
        source: istochnikGeneratora(old.istochnik),
        levels: [],
        variants: old.variantov,
        plan,
        seed: old.seed,
        zameny: {},
        /* У прежнего листа рамка теории шла вместе с примерами (e). */
        extras: { ...defaultExtras(config), theory: old.primery > 0, examples: old.primery },
        ...(old.filtr === undefined ? {} : { filtr: old.filtr }),
        legacy: q.toString(),
      };
    },
  };
}
