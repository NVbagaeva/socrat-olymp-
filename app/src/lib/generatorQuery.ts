/**
 * Адрес листа генератора: параметры ↔ строка запроса.
 *
 * Отдельно от generatorSheet.ts: тот модуль тянет движок graph/ и
 * шаблон листа (сотни килобайт), а экрану генератора для ссылки на
 * лист нужна только эта лёгкая часть. Экран открывается на странице
 * темы, поэтому не должен грузить движок до печати листа.
 */

import type { SheetLayoutId, SheetThemeId } from '@/content/generator';

export interface SheetParams {
  /** Наборы движка: 12.A, 12.B … */
  skills: string[];
  count: number;
  /** Уровень задач. null — любой. */
  level: string | null;
  seed: string;
  theme: SheetThemeId;
  layout: SheetLayoutId;
  /** Вид работы: подзаголовок листа. */
  kind: string;
  /** Дата в подзаголовке, в записи ГГГГ-ММ-ДД. Пусто — даты нет. */
  date: string;
  /** Сколько вариантов: 1…4. Структура у всех одна, числа разные. */
  variants: number;
  /**
   * Порядок задач. 'mix' — навыки чередуются одним блоком, как у
   * генератора раздела; 'types' — блоки по типам функций (генератор по
   * всем типам №12). Не задан — 'mix'.
   */
  order?: 'mix' | 'types';
  /** Рамка «Запомни» по каждому типу на листе. Не задано — нет. */
  theory?: boolean;
  /** Разобранных примеров на тип: 0…2. Не задано — 0. */
  examples?: number;
  /**
   * Задач у каждого набора — у генератора по всем типам №12 (по
   * счётчикам типов). Не задано — поровну по плану.
   */
  per?: Record<string, number>;
}

/** Сколько вариантов можно заказать в генераторе. */
export const MAX_VARIANTS = 4;

/** Число вариантов из адреса: 1…MAX_VARIANTS, иначе 1. */
export function variantsFrom(raw: string | null): number {
  const n = Number(raw);
  return Number.isInteger(n) && n >= 1 && n <= MAX_VARIANTS ? n : 1;
}

/** Строка адреса из параметров. */
export function sheetQuery(params: SheetParams): string {
  const query = new URLSearchParams();
  query.set('s', params.skills.join(','));
  query.set('n', String(params.count));
  if (params.level !== null) {
    query.set('l', params.level);
  }
  query.set('seed', params.seed);
  query.set('t', params.theme);
  query.set('c', params.layout === 'double' ? '2' : '1');
  if (params.kind !== '') {
    query.set('k', params.kind);
  }
  if (params.date !== '') {
    query.set('d', params.date);
  }
  /* Один вариант — адрес как прежде. */
  if (params.variants > 1) {
    query.set('v', String(params.variants));
  }
  /* Поля генератора по всем типам: у генератора раздела их нет, и его
     адреса не меняются. */
  if (params.order === 'types') {
    query.set('o', 'types');
  }
  if (params.theory === true) {
    query.set('th', '1');
  }
  if ((params.examples ?? 0) > 0) {
    query.set('pr', String(params.examples));
  }
  if (params.per !== undefined) {
    query.set(
      'pp',
      Object.entries(params.per)
        .map(([id, n]) => `${id}:${n}`)
        .join(','),
    );
  }
  return query.toString();
}

/** Параметры из адреса. Чего в адресе нет — берётся по умолчанию. */
export function parseSheetQuery(query: URLSearchParams): SheetParams {
  const skills = (query.get('s') ?? '')
    .split(',')
    .map((item) => item.trim())
    .filter((item) => item !== '');
  const count = Number(query.get('n'));
  const level = query.get('l');
  return {
    skills,
    count: Number.isFinite(count) && count > 0 ? Math.floor(count) : 10,
    level: level === null || level === '' ? null : level,
    seed: query.get('seed') ?? 'variant',
    theme: query.get('t') === 'print' ? 'print' : 'color',
    layout: query.get('c') === '2' ? 'double' : 'single',
    kind: query.get('k') ?? '',
    date: /^\d{4}-\d{2}-\d{2}$/.test(query.get('d') ?? '') ? (query.get('d') as string) : '',
    variants: variantsFrom(query.get('v')),
    order: query.get('o') === 'types' ? 'types' : 'mix',
    theory: query.get('th') === '1',
    examples: ['1', '2'].includes(query.get('pr') ?? '') ? Number(query.get('pr')) : 0,
    ...perFrom(query.get('pp')),
  };
}

/** Задачи наборов из адреса: «12.A:2,12Q.B:1». Нет поля — нет и per. */
function perFrom(raw: string | null): { per?: Record<string, number> } {
  if (raw === null || raw === '') {
    return {};
  }
  const per: Record<string, number> = {};
  raw.split(',').forEach((pair) => {
    const [id, n] = pair.split(':');
    const count = Number(n);
    if (id !== undefined && id !== '' && Number.isInteger(count) && count > 0 && count <= 20) {
      per[id] = count;
    }
  });
  return { per };
}

/** «18.09.2026» из записи ГГГГ-ММ-ДД. */
export function dateText(date: string): string {
  const [year, month, day] = date.split('-');
  return `${day}.${month}.${year}`;
}

/** Подзаголовок листа: вид работы и дата, что есть. */
export function subtitleOf(params: Pick<SheetParams, 'kind' | 'date'>): string {
  return [params.kind, params.date === '' ? '' : dateText(params.date)]
    .filter((part) => part !== '')
    .join(' · ');
}
