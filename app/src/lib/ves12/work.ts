/**
 * Зачётная работа по №12: параметры ↔ адрес, план прототипов, оценка.
 *
 * Лёгкий модуль без движка: им пользуются и экран настройки (сколько
 * задач, хватит ли банка), и страница работы, и листы печати.
 *
 * Всё, из чего собираются варианты, лежит в адресе: сколько задач у
 * каждого типа, какие прототипы выключены, источник, число вариантов и
 * код работы. По одному адресу на любом устройстве собирается тот же
 * набор вариантов — ни localStorage, ни сервера для этого не нужно.
 */

import { generatorVersion, kitCode, newKitId, parseKitCode } from '@/lib/komplekt';
import { counted } from '@/lib/plural';
import type { Ves12Catalog, Ves12Set, Ves12Type } from './types';

export type WorkSource = 'fipi' | 'all';
export type WorkOrder = 'types' | 'mix';

export interface Grades {
  /** С какого процента верных ответов ставится «5», «4» и «3». */
  five: number;
  four: number;
  three: number;
}

/** Состав: сколько задач у каждого типа и какие прототипы выключены. */
export interface Composition {
  /** Задач у типа: 0 — тип не включён, 1…5. */
  counts: Record<string, number>;
  /** Выключенные прототипы: 12E.D … */
  off: string[];
}

export interface WorkParams extends Composition {
  /** Типы, у которых к задачам банка добавлены аналоги (при «Только ФИПИ»). */
  analogs: string[];
  /** Вариантов: 1…4. Задачи между вариантами не повторяются. */
  variants: number;
  source: WorkSource;
  /** Время на работу, минуты. */
  minutes: number;
  grades: Grades;
  order: WorkOrder;
  title: string;
  /** «Учитель: …». Пусто — строки нет. */
  teacher: string;
  /** Код работы: 7K3F-2B. Первые четыре знака — seed, две — версия генератора. */
  code: string;
}

export const COUNT = { min: 0, max: 5 } as const;
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

/* ── Банк ──────────────────────────────────────────────────────── */

/** Открытые типы: готовые, с прототипами. «Скоро» сюда не входят. */
export function openTypes(catalog: Ves12Catalog): Ves12Type[] {
  return catalog.types.filter((type) => !type.soon);
}

/** Источник для типа: у типа с добавленными аналогами — все задачи. */
export function typeSource(params: Pick<WorkParams, 'source' | 'analogs'>, typeId: string): WorkSource {
  return params.source === 'all' || params.analogs.includes(typeId) ? 'all' : 'fipi';
}

/** Сколько задач прототипа доступно при источнике. */
export function capacity(set: Ves12Set, source: WorkSource): number {
  if (source === 'all' || set.fipi === null) {
    return Number.POSITIVE_INFINITY;
  }
  return set.fipi;
}

/** Включённые прототипы типа (в порядке каталога). */
export function enabledSets(type: Ves12Type, off: readonly string[]): Ves12Set[] {
  return type.sets.filter((set) => !off.includes(set.id));
}

/* ── Шаблоны ───────────────────────────────────────────────────── */

export interface Template {
  id: string;
  title: string;
  /** Подпись: «все типы · по 2 задачи». */
  lead: string;
  counts: Record<string, number>;
}

function countsOf(catalog: Ves12Catalog, ids: readonly string[] | null, n: number): Record<string, number> {
  const out: Record<string, number> = {};
  openTypes(catalog).forEach((type) => {
    out[type.id] = ids === null || ids.includes(type.id) ? n : 0;
  });
  return out;
}

function pairLead(n: number, types: number): string {
  return `по ${n} ${counted(n, 'задаче', 'задачи', 'задач').split(' ')[1]} · ${counted(types, 'тип', 'типа', 'типов')}`;
}

/**
 * Шаблоны быстрого старта. Тематический шаблон есть, только если все
 * его типы готовы: незаконченный тип не попадёт в работу молча.
 */
export function templates(catalog: Ves12Catalog): Template[] {
  const open = new Set<string>(openTypes(catalog).map((type) => type.id));
  const out: Template[] = [
    { id: 'ege', title: 'Весь №12, как на ЕГЭ', lead: 'все типы · по 2 задачи', counts: countsOf(catalog, null, 2) },
    { id: 'short', title: 'Короткая проверка', lead: 'все типы · по 1 задаче', counts: countsOf(catalog, null, 1) },
  ];
  const pairs: [string, string, string[]][] = [
    ['lin-quad', 'Линейная + квадратичная', ['linear', 'quadratic']],
    ['exp-log', 'Показательная + логарифмическая', ['exponential', 'logarithmic']],
    ['rat-sqrt', 'Гипербола + корень', ['rational', 'irrational']],
    ['trig', 'Тригонометрия', ['trigonometric']],
  ];
  pairs.forEach(([id, title, ids]) => {
    if (ids.every((type) => open.has(type))) {
      out.push({ id, title, lead: pairLead(3, ids.length), counts: countsOf(catalog, ids, 3) });
    }
  });
  return out;
}

/** Шаблон, которому соответствует состав. null — свой состав. */
export function matchTemplate(list: readonly Template[], counts: Record<string, number>): string | null {
  const found = list.find((item) =>
    Object.keys({ ...item.counts, ...counts }).every((id) => (item.counts[id] ?? 0) === (counts[id] ?? 0)),
  );
  return found?.id ?? null;
}

/** Подпись состава: «5 типов · по 2 задачи» или «3 типа · 7 задач». */
export function compositionLead(counts: Record<string, number>): string {
  const on = Object.values(counts).filter((n) => n > 0);
  if (on.length === 0) {
    return 'задач нет';
  }
  const types = counted(on.length, 'тип', 'типа', 'типов');
  const same = on.every((n) => n === on[0]);
  return same
    ? `${types} · по ${on[0]} ${counted(on[0] as number, 'задаче', 'задачи', 'задач').split(' ')[1]}`
    : `${types} · ${tasksLabel(on.reduce((sum, n) => sum + n, 0))}`;
}

/* ── Адрес ─────────────────────────────────────────────────────── */

function clampInt(raw: string | null, min: number, max: number, fallback: number): number {
  const n = Number(raw);
  return Number.isInteger(n) && n >= min && n <= max ? n : fallback;
}

function list(raw: string | null): string[] {
  return (raw ?? '')
    .split(',')
    .map((item) => item.trim())
    .filter((item) => item !== '');
}

/** Настройки без кода: по ним экран узнаёт, что собранная работа устарела. */
export function settingsQuery(params: Omit<WorkParams, 'code'>): string {
  const query = new URLSearchParams();
  query.set(
    'c',
    Object.entries(params.counts)
      .filter(([, n]) => n > 0)
      .map(([id, n]) => `${id}:${n}`)
      .join(','),
  );
  if (params.off.length > 0) {
    query.set('off', params.off.join(','));
  }
  if (params.analogs.length > 0 && params.source === 'fipi') {
    query.set('a', params.analogs.join(','));
  }
  query.set('v', String(params.variants));
  query.set('src', params.source);
  query.set('t', String(params.minutes));
  if (
    params.grades.five !== DEFAULT_GRADES.five ||
    params.grades.four !== DEFAULT_GRADES.four ||
    params.grades.three !== DEFAULT_GRADES.three
  ) {
    query.set('g', `${params.grades.five}-${params.grades.four}-${params.grades.three}`);
  }
  if (params.order === 'mix') {
    query.set('o', 'mix');
  }
  if (params.title !== '' && params.title !== DEFAULT_TITLE) {
    query.set('h', params.title);
  }
  if (params.teacher !== '') {
    query.set('u', params.teacher);
  }
  return query.toString();
}

export function workQuery(params: WorkParams): string {
  return `${settingsQuery(params)}&kod=${encodeURIComponent(params.code)}`;
}

function gradesFrom(raw: string | null): Grades {
  const [five, four, three] = (raw ?? '').split('-').map(Number);
  const ok = (n: number | undefined): n is number => n !== undefined && Number.isInteger(n) && n >= 1 && n <= 100;
  if (ok(five) && ok(four) && ok(three) && five >= four && four >= three) {
    return { five, four, three };
  }
  return DEFAULT_GRADES;
}

/** Состав из адреса. null — в адресе нет ни одного типа с задачами. */
export function parseComposition(query: URLSearchParams): Composition | null {
  const counts: Record<string, number> = {};
  list(query.get('c')).forEach((pair) => {
    const [id, raw] = pair.split(':');
    const n = Number(raw);
    if (id !== undefined && id !== '' && Number.isInteger(n) && n >= 1 && n <= COUNT.max) {
      counts[id] = n;
    }
  });
  if (Object.keys(counts).length === 0) {
    return null;
  }
  return { counts, off: list(query.get('off')) };
}

/** Параметры без кода — для экрана настройки (ссылка на настройку). */
export function parseSettings(query: URLSearchParams): Omit<WorkParams, 'code'> | null {
  const composition = parseComposition(query);
  if (composition === null) {
    return null;
  }
  const total = Object.values(composition.counts).reduce((sum, n) => sum + n, 0);
  return {
    ...composition,
    analogs: list(query.get('a')),
    variants: clampInt(query.get('v'), 1, MAX_VARIANTS, 1),
    source: query.get('src') === 'all' ? 'all' : 'fipi',
    minutes: clampInt(query.get('t'), 1, 600, MINUTES_PER_TASK * total),
    grades: gradesFrom(query.get('g')),
    order: query.get('o') === 'mix' ? 'mix' : 'types',
    title: (query.get('h') ?? '').trim() || DEFAULT_TITLE,
    teacher: (query.get('u') ?? '').trim(),
  };
}

/** Параметры из адреса работы. null — в адресе нет работы (нет кода или задач). */
export function parseWorkQuery(query: URLSearchParams): WorkParams | null {
  const code = normalCode(query.get('kod') ?? '');
  const settings = parseSettings(query);
  return code === null || settings === null ? null : { ...settings, code };
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

/** Место в варианте: тип и прототип. */
export interface Slot {
  type: Ves12Type;
  setId: string;
}

export interface TypeShortage {
  type: Ves12Type;
  /** На сколько вариантов без повторов хватает задач банка. */
  enough: number;
}

export interface WorkPlan {
  /** Типы с задачами, в порядке каталога. */
  types: { type: Ves12Type; count: number; sets: Ves12Set[] }[];
  /** Места каждого варианта. */
  variants: Slot[][];
  /** Задач в одном варианте. */
  perVariant: number;
  /** Типы, у которых задач банка не хватает на все варианты. */
  shortages: TypeShortage[];
}

/**
 * Прототипы мест типа в варианте v: задачи раздаются по включённым
 * прототипам по кругу и продолжают круг в следующем варианте. Задач
 * столько же, сколько прототипов, — состав у вариантов один; меньше —
 * разные прототипы идут по кругу между вариантами; больше — каждый
 * прототип не меньше раза.
 */
function setsOfVariant(sets: readonly Ves12Set[], count: number, v: number): Ves12Set[] {
  const out: Ves12Set[] = [];
  for (let i = 0; i < count; i += 1) {
    out.push(sets[(v * count + i) % sets.length] as Ves12Set);
  }
  /* В варианте — в порядке каталога: задачи одного прототипа рядом. */
  return out.sort((a, b) => sets.indexOf(a) - sets.indexOf(b));
}

/** Хватает ли банка на k вариантов. */
function fits(sets: readonly Ves12Set[], count: number, k: number, source: WorkSource): boolean {
  const need = new Map<string, number>();
  for (let v = 0; v < k; v += 1) {
    setsOfVariant(sets, count, v).forEach((set) => need.set(set.id, (need.get(set.id) ?? 0) + 1));
  }
  return sets.every((set) => (need.get(set.id) ?? 0) <= capacity(set, source));
}

export function planWork(params: Omit<WorkParams, 'code'>, catalog: Ves12Catalog): WorkPlan {
  const types = openTypes(catalog)
    .map((type) => ({ type, count: params.counts[type.id] ?? 0, sets: enabledSets(type, params.off) }))
    .filter((item) => item.count > 0 && item.sets.length > 0);

  const shortages: TypeShortage[] = [];
  types.forEach(({ type, count, sets }) => {
    const source = typeSource(params, type.id);
    if (!fits(sets, count, params.variants, source)) {
      let enough = 0;
      while (enough < params.variants && fits(sets, count, enough + 1, source)) {
        enough += 1;
      }
      shortages.push({ type, enough });
    }
  });

  const variants: Slot[][] = [];
  for (let v = 0; v < params.variants; v += 1) {
    const byType = types.map(({ type, count, sets }) =>
      setsOfVariant(sets, count, v).map((set) => ({ type, setId: set.id })),
    );
    if (params.order === 'mix') {
      /* Вперемешку: типы чередуются, по соседним задачам метод не угадать. */
      const mixed: Slot[] = [];
      for (let i = 0; byType.some((items) => i < items.length); i += 1) {
        byType.forEach((items) => {
          const slot = items[i];
          if (slot !== undefined) {
            mixed.push(slot);
          }
        });
      }
      variants.push(mixed);
    } else {
      variants.push(byType.flat());
    }
  }

  return {
    types,
    variants,
    perVariant: types.reduce((sum, item) => sum + item.count, 0),
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

/** Строки шкалы: «„5“ — от 90 % (от 9 из 10)». */
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

export function variantsLabel(n: number): string {
  return counted(n, 'вариант', 'варианта', 'вариантов');
}
