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
  };
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
