/**
 * Генератор листов заданий базы на общем генераторе (components/generator/)
 * — одна реализация на все разделы базы с банком задач.
 *
 *   Темы    — группы раздела (RazdelBazy.gruppy);
 *   подтипы — прототипы (RazdelBazy.prototipy), в банке — RazdelBazy.zadach;
 *   задачи  — банк базы (lib/baza/bank.ts): все считаются аналогами,
 *             исходных задач ФИПИ в нём нет, поэтому источник один.
 *
 * Лист собирается общим «листом из банка готовых задач»
 * (lib/generator/obshchiy/bank.ts, адрес ps=2): позиция — «прототип +
 * номер», задача позиции зависит только от ключа, варианта и seed.
 * Конфиг собирается на сервере из данных раздела и уходит в браузер
 * целиком: из него же браузер знает ключи задач банка (индекс).
 *
 * Модуль чистый — его берут страница вкладки, адаптер в браузере,
 * страница печати и проверка (scripts/check-generator.mjs).
 */

import { GENERATOR_BAZY as T } from '@/content/baza/generator';
import { GEN_UI } from '@/content/generatorUi';
import {
  blokiBanka,
  parseZaprosBanka,
  shapkaBanka,
  sobratPoKlyucham,
  type BlokBanka,
  type ShapkaBanka,
  type ZadachaBanka,
  type ZaprosBanka,
} from '@/lib/generator/obshchiy/bank';
import { tasksText } from '@/lib/generator/obshchiy/state';
import type { GenConfig, GenPreset, GenTopic } from '@/lib/generator/obshchiy/types';
import type { KitScope } from '@/lib/komplekt';
import { klyuchZadachi } from './bank';
import type { RazdelBazy } from './types';

/** Вариантов на листе — не больше. */
export const VARIANTOV_MAX_BAZY = 6;

/** Задание базы для конфига: номер, название, адрес вкладки генератора. */
export interface ZadanieBazy {
  /** Номер задания: «12». */
  slug: string;
  name: string;
}

/** Область комплекта генератора базы: «baza-12» (lib/komplekt.ts). */
export function scopeBazy(slug: string): KitScope {
  return `baza-${slug}`;
}

function presety(topics: readonly GenTopic[]): GenPreset[] {
  const vse = (n: number) => Object.fromEntries(topics.map((t) => [t.id, n]));
  const P = T.presets;
  const k = topics.length;
  const out: GenPreset[] = [
    {
      id: 'vse',
      title: P.vse.title,
      sub: P.vse.sub(tasksText(k)),
      variants: 1,
      levels: [],
      sostav: vse(1),
    },
    {
      id: 'dz',
      title: P.dz.title,
      sub: P.dz.sub(tasksText(2 * k)),
      variants: 1,
      levels: [],
      sostav: vse(2),
      kind: 'dz',
    },
    {
      id: 'sr',
      title: P.sr.title,
      sub: P.sr.sub(tasksText(k)),
      variants: 2,
      levels: [],
      sostav: vse(1),
      kind: 'sr',
    },
  ];
  const first = topics[0];
  if (first !== undefined) {
    out.push({
      id: 'odin',
      title: P.odin.title,
      sub: P.odin.sub,
      variants: 1,
      levels: [],
      sostav: { [first.id]: 6 },
      pickTopic: 6,
    });
  }
  return out;
}

/**
 * Конфиг генератора раздела базы. slot — адрес вкладки генератора: по
 * нему хранится текущий комплект.
 */
export function configBazy(task: ZadanieBazy, razdel: RazdelBazy, slot: string): GenConfig {
  const no = Number(task.slug);
  const prototipy = razdel.prototipy ?? [];
  const topics: GenTopic[] = (razdel.gruppy ?? [])
    .map((g) => {
      const subtypes = prototipy
        .filter((p) => p.gruppa === g.id)
        .map((p) => ({
          id: p.id,
          /* Код на экране — номер прототипа: «№7». */
          code: String(Number(p.id.slice(1))),
          title: p.title,
          level: 1 as const,
          bank: p.zadach,
        }));
      return {
        id: g.id,
        title: g.nazvanie,
        /* Источник один — банк: подпись «в банке N», а не «генерируются». */
        note: GEN_UI.vBanke(subtypes.reduce((a, s) => a + s.bank, 0)),
        subtypes,
      };
    })
    .filter((t) => t.subtypes.length > 0);
  return {
    id: task.slug,
    scope: scopeBazy(task.slug),
    slot,
    section: T.section(no, task.name),
    sheet: {
      chip: T.sheet.chip(no),
      title: task.name,
      course: T.sheet.course,
      teacher: T.sheet.teacher,
    },
    topics,
    levels: [],
    sources: [{ id: 'new', ...T.istochnik }],
    presets: presety(topics),
    limits: { variantsMax: VARIANTOV_MAX_BAZY },
    /* Памятки по прототипам у базы нет, разобранных примеров тоже: на
       листе «по одной на тему» их было бы столько же, сколько задач, а
       краткий разбор каждой задачи и так есть на листе учителя. */
    extras: {
      kinds: Object.entries(GEN_UI.vidyRaboty as Record<string, string>).map(([id, title]) => ({
        id,
        title,
      })),
      theory: false,
      examples: false,
    },
  };
}

/** Индекс банка по конфигу: ключи задач прототипов, все — аналоги. */
export function indeksBazy(config: GenConfig): ZadachaBanka[] {
  return config.topics.flatMap((t) =>
    t.subtypes.flatMap((s) =>
      Array.from({ length: s.bank }, (_, i) => ({
        id: klyuchZadachi(s.id, i + 1, s.bank),
        p: s.id,
        s: 'a' as const,
      })),
    ),
  );
}

/** Адрес листа (ps=2) → запрос; null — адрес не этой схемы или состав пуст. */
export function parseZaprosBazy(q: URLSearchParams, config: GenConfig): ZaprosBanka | null {
  const est = new Set(config.topics.flatMap((t) => t.subtypes.map((s) => s.id)));
  const z = parseZaprosBanka(q, {
    idRe: /P\d\d/,
    est: (id) => est.has(id),
    variantsMax: config.limits.variantsMax,
  });
  /* Памятки и примеров у базы нет: tr=1 и pr=… в адресе ничего не добавляют. */
  return z === null ? null : { ...z, pamyatka: false, primery: 0 };
}

/** Модель листа: заголовок, блок задач по вариантам, шапка. */
export interface ModelListaBazy {
  zagolovok: string;
  /** Подпись внизу листа: seed. */
  kod: string;
  bloki: BlokBanka[];
  shapka: ShapkaBanka;
}

export function modelListaBazy(z: ZaprosBanka, config: GenConfig): ModelListaBazy {
  /* Примеров нет — задачи под них не откладываются: в листы идёт весь банк. */
  const l = sobratPoKlyucham(z, indeksBazy(config), `baza${config.id}-ps2`, undefined, true);
  return {
    zagolovok: T.zagolovok(Number(config.id), config.sheet.title),
    kod: z.seed,
    bloki: blokiBanka(z, l),
    shapka: shapkaBanka(z),
  };
}

/** Прототипы, задачи которых нужны листу. */
export function prototipyLista(model: ModelListaBazy): string[] {
  const ids = model.bloki.flatMap((b) => b.spiski.flat());
  return [...new Set(ids.map((id) => id.slice(0, id.indexOf('-'))))];
}
