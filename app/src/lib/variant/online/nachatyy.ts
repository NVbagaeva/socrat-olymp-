'use client';

/**
 * Начатый вариант со страницы «Решить вариант онлайн»: есть ли он в этом
 * браузере и сколько в нём ответов.
 *
 * Страница помнит адрес последнего варианта (variant-onlayn:last). По
 * адресу находится сессия решения — та же запись, из которой страница
 * решения восстанавливает работу (lib/trainerSession, ключ workScope).
 * Нет записи — вариант не начинали («Начать» не нажата) или запись
 * убрана. Есть итог в архиве после начала сессии — вариант завершён.
 * В обоих случаях плашки «Продолжить» нет.
 */

import { readSession } from '@/lib/trainerSession/store';
import { listWorks } from './archive';
import { parseReshat, workScope } from './link';
import { readCode } from '../session';

export interface NachatyyVariant {
  href: string;
  /** Заданий с введённым ответом. */
  resheno: number;
  vsego: number;
  code: string;
  variant: number;
  mode: 'trening' | 'kontrol';
  /** Когда начата сессия: итог в архиве позже этого — вариант завершён. */
  nachat: number;
}

function otvetov(ui: unknown): number {
  if (typeof ui !== 'object' || ui === null) return 0;
  const answers = (ui as Record<string, unknown>)['answers'];
  if (typeof answers !== 'object' || answers === null) return 0;
  return Object.values(answers).filter((a) => typeof a === 'string' && a.trim() !== '').length;
}

/** Сессия по адресу варианта — синхронно, из localStorage. */
export function nachatyyVariant(href: string): NachatyyVariant | null {
  if (href === '') return null;
  const q = href.includes('?') ? href.slice(href.indexOf('?') + 1) : '';
  const link = parseReshat(new URLSearchParams(q));
  if (link === null) return null;
  const read = readSession(workScope(link.code, link.variant, link.mode));
  if (read.status !== 'ok') return null;
  const code = readCode(link.code);
  const vsego = code === null ? 13 : code.config.tasks.length;
  return {
    href,
    resheno: Math.min(vsego, otvetov(read.session.ui)),
    vsego,
    code: link.code,
    variant: link.variant,
    mode: link.mode,
    nachat: read.session.createdAt,
  };
}

/** Есть ли итог этого варианта в архиве (IndexedDB) — после начала сессии. */
export async function zavershen(v: NachatyyVariant): Promise<boolean> {
  const works = await listWorks();
  return works.some(
    (w) =>
      w.code === v.code && w.variant === v.variant && w.mode === v.mode && w.finishedAt >= v.nachat,
  );
}
