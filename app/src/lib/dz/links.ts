/**
 * Адреса классов и домашних заданий — одним местом (CLAUDE.md: адреса
 * не пишутся строкой по месту). Страницы статические, всё, что меняется,
 * — в параметрах адреса.
 */

import type { HwOrigin } from './types';

export const DZ_HREF = {
  kabinet: '/kabinet/',
  klass: '/kabinet/klassy/',
  vstupit: '/kabinet/vstupit/',
  vydat: '/kabinet/dz-vydat/',
  domashka: '/kabinet/domashka/',
  pechat: '/kabinet/domashka/pechat/',
} as const;

export function klassHref(id: string): string {
  return `${DZ_HREF.klass}?id=${encodeURIComponent(id)}`;
}

/** Ссылка-приглашение в класс: полный адрес, чтобы отправить ученику. */
export function inviteUrl(
  code: string,
  origin = typeof window === 'undefined' ? '' : window.location.origin,
): string {
  return `${origin}${DZ_HREF.vstupit}?kod=${encodeURIComponent(code)}`;
}

export function homeworkHref(id: string): string {
  return `${DZ_HREF.domashka}?id=${encodeURIComponent(id)}`;
}

export type PrintList = 'uchenik' | 'uchitel';

export function printHref(id: string, list: PrintList, grid: boolean): string {
  return `${DZ_HREF.pechat}?id=${encodeURIComponent(id)}&list=${list}${grid ? '&kletka=1' : ''}`;
}

/** Что выдать: типы с количеством, конкретные задачи или работа над ошибками. */
export interface IssuePreset {
  origin: HwOrigin;
  /** Прототипы «8.A». */
  kinds?: readonly string[];
  /** Задач каждого типа. */
  perKind?: number;
  /** Конкретные задачи «прототип|seed|уровень». */
  refs?: readonly string[];
  /** Работа над ошибками по этому ДЗ. */
  mistakesOf?: string;
}

/** «Выдать ДЗ» с заполненной формой: /kabinet/dz-vydat/?ot=generator&tipy=8.A,8.C&n=3. */
export function issueHref(preset: IssuePreset): string {
  const q = new URLSearchParams({ ot: preset.origin });
  if (preset.kinds !== undefined && preset.kinds.length > 0) q.set('tipy', preset.kinds.join(','));
  if (preset.perKind !== undefined) q.set('n', String(preset.perKind));
  if (preset.refs !== undefined && preset.refs.length > 0) q.set('zadachi', preset.refs.join(','));
  if (preset.mistakesOf !== undefined) q.set('oshibki', preset.mistakesOf);
  return `${DZ_HREF.vydat}?${q.toString()}`;
}

const ORIGINS: readonly HwOrigin[] = ['kabinet', 'generator', 'opornye', 'trenazher', 'oshibki'];

/** Разобрать параметры формы выдачи. Неизвестное — отбрасывается. */
export function readIssuePreset(search: string): IssuePreset {
  const q = new URLSearchParams(search);
  const ot = q.get('ot') as HwOrigin | null;
  const n = Number(q.get('n'));
  const list = (key: string) =>
    (q.get(key) ?? '')
      .split(',')
      .map((s) => s.trim())
      .filter((s) => s !== '');
  return {
    origin: ot !== null && ORIGINS.includes(ot) ? ot : 'kabinet',
    kinds: list('tipy').filter((k) => /^8\.[A-Z]$/.test(k)),
    ...(Number.isInteger(n) && n >= 1 && n <= 10 ? { perKind: n } : {}),
    refs: list('zadachi').filter((r) => /^8\.[A-Z]\|[^|]{1,40}\|(base|advanced|any)$/.test(r)),
    ...(q.get('oshibki') ? { mistakesOf: q.get('oshibki') as string } : {}),
  };
}
