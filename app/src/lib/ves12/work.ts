/**
 * Зачётная работа по №12: параметры ↔ адрес, план прототипов, оценка.
 *
 * Лёгкий модуль без движка: им пользуются и экран настройки (сколько
 * задач, хватит ли банка), и страница работы, и листы печати.
 *
 * Всё, из чего собираются варианты, лежит в адресе: прототипы, число
 * задач, вариантов, источник и код работы. По одному адресу на любом
 * устройстве собирается тот же набор вариантов — ни localStorage, ни
 * сервера для этого не нужно.
 */

import { generatorVersion, kitCode, newKitId, parseKitCode } from '@/lib/komplekt';
import { counted } from '@/lib/plural';
import type { Ves12Catalog, Ves12Set, Ves12Type } from './types';

export type WorkSource = 'fipi' | 'all';

export interface Grades {
  /** С какого процента верных ответов ставится «5», «4» и «3». */
  five: number;
  four: number;
  three: number;
}

export interface WorkParams {
  /** Выбранные прототипы всех типов: 12.A, 12E.B … */
  sets: string[];
  /** Задач на каждый выбранный тип функции. */
  perType: number;
  /** Вариантов: 1…4. Состав прототипов у всех один, задачи разные. */
  variants: number;
  source: WorkSource;
  /** Время на работу, минуты. */
  minutes: number;
  grades: Grades;
  title: string;
  /** «Учитель: …». Пусто — строки нет. */
  teacher: string;
  /** Код работы: 7K3F-2B. Первые четыре знака — seed, две — версия генератора. */
  code: string;
}

export const PER_TYPE = { min: 1, max: 5, initial: 2 } as const;
export const MAX_VARIANTS = 4;
export const MINUTES_PER_TASK = 3;
export const DEFAULT_GRADES: Grades = { five: 90, four: 70, three: 50 };
export const DEFAULT_TITLE = 'Зачётная работа по заданию №12';

/** Новый код работы. random — для автотеста. */
export function newWorkCode(random: () => number = Math.random): string {
  return kitCode(newKitId(random), generatorVersion('12'));
}

/** Код из адреса в каноническом виде. null — это не код. */
export function normalCode(text: string): string | null {
  const parsed = parseKitCode(text);
  return parsed === null ? null : kitCode(parsed.id, parsed.version);
}

/** Код собран прежней версией генератора: задачи могут не совпасть. */
export function codeOutdated(code: string): boolean {
  const parsed = parseKitCode(code);
  return parsed !== null && parsed.version !== generatorVersion('12');
}

/* ── Адрес ─────────────────────────────────────────────────────── */

function clampInt(raw: string | null, min: number, max: number, fallback: number): number {
  const n = Number(raw);
  return Number.isInteger(n) && n >= min && n <= max ? n : fallback;
}

export function workQuery(params: WorkParams): string {
  const query = new URLSearchParams();
  query.set('s', params.sets.join(','));
  query.set('n', String(params.perType));
  query.set('v', String(params.variants));
  query.set('src', params.source);
  query.set('t', String(params.minutes));
  query.set('g', `${params.grades.five}-${params.grades.four}-${params.grades.three}`);
  if (params.title !== '' && params.title !== DEFAULT_TITLE) {
    query.set('h', params.title);
  }
  if (params.teacher !== '') {
    query.set('u', params.teacher);
  }
  query.set('kod', params.code);
  return query.toString();
}

function gradesFrom(raw: string | null): Grades {
  const parts = (raw ?? '').split('-').map(Number);
  const [five, four, three] = parts;
  const ok = (n: number | undefined): n is number => Number.isInteger(n) && n! >= 1 && n! <= 100;
  if (ok(five) && ok(four) && ok(three) && five >= four && four >= three) {
    return { five, four, three };
  }
  return DEFAULT_GRADES;
}

/** Параметры из адреса. null — в адресе нет работы (нет кода или прототипов). */
export function parseWorkQuery(query: URLSearchParams): WorkParams | null {
  const code = normalCode(query.get('kod') ?? '');
  const sets = (query.get('s') ?? '')
    .split(',')
    .map((item) => item.trim())
    .filter((item) => item !== '');
  if (code === null || sets.length === 0) {
    return null;
  }
  const perType = clampInt(query.get('n'), PER_TYPE.min, PER_TYPE.max, PER_TYPE.initial);
  return {
    sets,
    perType,
    variants: clampInt(query.get('v'), 1, MAX_VARIANTS, 1),
    source: query.get('src') === 'all' ? 'all' : 'fipi',
    minutes: clampInt(query.get('t'), 1, 600, MINUTES_PER_TASK * perType),
    grades: gradesFrom(query.get('g')),
    title: (query.get('h') ?? '').trim() || DEFAULT_TITLE,
    teacher: (query.get('u') ?? '').trim(),
    code,
  };
}

/* ── Банк и выбор ──────────────────────────────────────────────── */

/** Сколько задач прототипа доступно при выбранном источнике. */
export function capacity(set: Ves12Set, source: WorkSource): number {
  if (source === 'all' || set.fipi === null) {
    return Number.POSITIVE_INFINITY;
  }
  return set.fipi;
}

/** Прототипы типа, из которых можно брать задачи при этом источнике. */
export function usableSets(type: Ves12Type, source: WorkSource): Ves12Set[] {
  return type.soon ? [] : type.sets.filter((set) => capacity(set, source) > 0);
}

/** Выбор по умолчанию: все доступные прототипы всех открытых типов. */
export function defaultSets(catalog: Ves12Catalog, source: WorkSource): string[] {
  return catalog.types.flatMap((type) => usableSets(type, source).map((set) => set.id));
}

/** Выбор генератора по умолчанию: первый прототип каждого открытого типа. */
export function firstSets(catalog: Ves12Catalog): string[] {
  return catalog.types.flatMap((type) => usableSets(type, 'all').slice(0, 1).map((set) => set.id));
}

/* ── План: какие прототипы в каждом варианте ───────────────────── */

/** Детерминированный ГПСЧ по строке: FNV-1a → mulberry32. */
export function rngFrom(seed: string): () => number {
  let h = 0x811c9dc5;
  for (let i = 0; i < seed.length; i += 1) {
    h ^= seed.charCodeAt(i);
    h = Math.imul(h, 0x01000193);
  }
  let a = h >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function shuffledBy<T>(items: readonly T[], random: () => number): T[] {
  const out = items.slice();
  for (let i = out.length - 1; i > 0; i -= 1) {
    const j = Math.floor(random() * (i + 1));
    [out[i], out[j]] = [out[j] as T, out[i] as T];
  }
  return out;
}

export interface PlannedType {
  type: Ves12Type;
  /** Прототип каждого места варианта: одинаковый во всех вариантах. */
  slots: string[];
}

export interface Shortage {
  type: Ves12Type;
  set: Ves12Set;
  /** Сколько задач прототипа нужно на все варианты. */
  need: number;
  have: number;
}

export interface WorkPlan {
  types: PlannedType[];
  /** Задач в одном варианте. */
  perVariant: number;
  shortages: Shortage[];
}

/**
 * Места варианта по типам. Состав прототипов у всех вариантов один:
 * место N в каждом варианте — задача одного и того же прототипа.
 *
 * Задачи типа раздаются по выбранным прототипам поровну; при выборе,
 * кому достанется лишнее место, вперёд идут прототипы, у которых банк
 * выдержит все варианты, а среди равных — порядок по коду работы.
 * Банк кончился у всех — место всё равно занимается, и нехватка
 * попадает в shortages: экран настройки скажет о ней до сборки.
 */
export function planWork(params: WorkParams, catalog: Ves12Catalog): WorkPlan {
  const random = rngFrom(`${params.code}:plan`);
  const chosen = new Set(params.sets);
  const types: PlannedType[] = [];
  const shortages: Shortage[] = [];

  catalog.types.forEach((type) => {
    const sets = usableSets(type, params.source).filter((set) => chosen.has(set.id));
    if (sets.length === 0) {
      return;
    }
    const order = shuffledBy(sets, random);
    const used = new Map<string, number>();
    const slots: string[] = [];
    for (let i = 0; i < params.perType; i += 1) {
      const fits = (set: Ves12Set) =>
        ((used.get(set.id) ?? 0) + 1) * params.variants <= capacity(set, params.source);
      const pool = order.filter(fits);
      const from = pool.length > 0 ? pool : order;
      let best = from[0] as Ves12Set;
      from.forEach((set) => {
        if ((used.get(set.id) ?? 0) < (used.get(best.id) ?? 0)) {
          best = set;
        }
      });
      used.set(best.id, (used.get(best.id) ?? 0) + 1);
      slots.push(best.id);
    }
    /* Места одного прототипа идут подряд — в порядке каталога. */
    slots.sort((a, b) => sets.findIndex((s) => s.id === a) - sets.findIndex((s) => s.id === b));
    used.forEach((times, id) => {
      const set = sets.find((item) => item.id === id) as Ves12Set;
      const have = capacity(set, params.source);
      if (times * params.variants > have) {
        shortages.push({ type, set, need: times * params.variants, have });
      }
    });
    types.push({ type, slots });
  });

  return {
    types,
    perVariant: types.reduce((sum, item) => sum + item.slots.length, 0),
    shortages,
  };
}

/* ── Оценка ────────────────────────────────────────────────────── */

export function percentOf(right: number, total: number): number {
  return total === 0 ? 0 : Math.round((right / total) * 100);
}

/** Оценка по шкале учителя. */
export function gradeOf(right: number, total: number, grades: Grades): 2 | 3 | 4 | 5 {
  const percent = total === 0 ? 0 : (right / total) * 100;
  if (percent >= grades.five) {
    return 5;
  }
  if (percent >= grades.four) {
    return 4;
  }
  if (percent >= grades.three) {
    return 3;
  }
  return 2;
}

/** Сколько верных ответов нужно на оценку: «5» — от 9 из 10. */
export function minRight(total: number, percent: number): number {
  return Math.ceil((total * percent) / 100 - 1e-9);
}

/** Строка шкалы: «„5“ — от 90 % (от 9 из 10)». */
export function gradeLines(grades: Grades, total: number): string[] {
  const line = (mark: number, percent: number) =>
    `«${mark}» — от ${percent} % (от ${minRight(total, percent)} из ${total})`;
  return [
    line(5, grades.five),
    line(4, grades.four),
    line(3, grades.three),
    `«2» — меньше ${minRight(total, grades.three)} из ${total}`,
  ];
}

export function tasksLabel(n: number): string {
  return counted(n, 'задача', 'задачи', 'задач');
}

export function minutesLabel(n: number): string {
  return counted(n, 'минута', 'минуты', 'минут');
}
