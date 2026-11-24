'use client';

/**
 * Уведомления — вызовы функций базы (docs/kabinet-uvedomleniya.md).
 * Модуль грузится динамически: в первую загрузку страниц SDK не попадает.
 */

import { getClient } from '@/lib/auth/client';
import type { Nastroyki, Uvedomlenie } from './model';

export class UvedError extends Error {
  constructor(
    readonly code: string,
    message: string,
  ) {
    super(message);
  }
}

async function rpc<T>(name: string, args: Record<string, unknown>): Promise<T> {
  const supabase = await getClient();
  const { data, error } = await supabase.rpc(name, args);
  if (error !== null) {
    const message = error.message ?? 'unknown';
    throw new UvedError(/^([a-z_0-9]+)/.exec(message)?.[1] ?? 'unknown', message);
  }
  return data as T;
}

export const moiUvedomleniya = (limit = 30, before?: number) =>
  rpc<Uvedomlenie[]>('moi_uvedomleniya', { p_limit: limit, p_before: before ?? null });
export const uvedomleniyaSchet = () => rpc<number>('uvedomleniya_schet', {});
export const uvedomleniyaProchitat = (ids?: number[]) =>
  rpc<number>('uvedomleniya_prochitat', { p_ids: ids ?? null });
export const moiNastroyki = () => rpc<Nastroyki>('moi_nastroyki_uvedomleniy', {});
export const sohranitNastroyki = (p: Partial<Nastroyki>) =>
  rpc<Nastroyki>('sohranit_nastroyki_uvedomleniy', { p });
