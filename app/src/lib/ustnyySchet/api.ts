/**
 * Рейтинг устного счёта — вызовы функций базы (миграция
 * 20261115120000_ustnyy_schet.sql). SDK Supabase грузится только при
 * первом вызове (lib/auth/client.ts): гостю он не нужен.
 *
 * Ошибки базы — UstnyyError с кодом из начала сообщения
 * («too_many_starts: …» → too_many_starts).
 */

import { getClient } from '@/lib/auth/client';
import type { ReytingFormatId } from './formaty';

export class UstnyyError extends Error {
  constructor(
    public readonly code: string,
    message: string,
  ) {
    super(message);
  }
}

function fail(error: { message?: string } | null): never {
  const message = error?.message ?? 'unknown';
  const code = /^([a-z_]+)(?::|$)/.exec(message)?.[1] ?? 'unknown';
  throw new UstnyyError(code, message);
}

async function rpc<T>(name: string, args: Record<string, unknown> = {}): Promise<T> {
  let supabase;
  try {
    supabase = await getClient();
  } catch {
    throw new UstnyyError('no_auth', 'no_auth');
  }
  const r = await supabase.rpc(name, args);
  if (r.error) fail(r.error);
  return r.data as T;
}

/** Пример с сервера: из этих данных сайт собирает пример приёма. */
export interface ServerPrimer {
  pos: number;
  priyom: string;
  d: string[];
  v: string | null;
}

export interface Start {
  session: string;
  format: ReytingFormatId;
  tip: 'vremya' | 'seriya';
  sek: number | null;
  n: number | null;
  nick: string;
  /** Время сервера и срок, мс эпохи. */
  server_now: number;
  deadline: number;
  items: ServerPrimer[];
}

export type OtvetServera =
  | { kind: 'format' }
  | { kind: 'late' }
  | { kind: 'answer'; verno: boolean; otvet: string; next: ServerPrimer | null; done: boolean };

export interface Final {
  valid: boolean;
  /** Почему не в рейтинге: too_fast, accuracy, incomplete, late, empty, abandoned. */
  reason: string | null;
  verno: number;
  vsego: number;
  net_ms: number;
  score_ms: number;
  mesto: number | null;
  rekord: boolean;
  prezhniy: { verno: number; vsego: number; net_ms: number; score_ms: number } | null;
}

export type Period = 'den' | 'nedelya' | 'vse';

export interface ReytingStroka {
  mesto: number;
  nick: string;
  verno: number;
  vsego: number;
  net_ms: number;
  score_ms: number;
  at: number;
  ya: boolean;
  /** Имя ученика — только репетитору его класса. */
  imya?: string;
}

export interface Reyting {
  format: ReytingFormatId;
  tip: 'vremya' | 'seriya';
  rows: ReytingStroka[];
  ya: (Omit<ReytingStroka, 'at' | 'ya'> & { pokazyvat: boolean }) | null;
  vsego: number;
}

export interface MoyProfil {
  nick: string;
  auto: boolean;
  pokazyvat: boolean;
  /** Может ли участвовать: ученик с нужными согласиями. */
  mozhno: boolean;
}

export const api = {
  start: (format: ReytingFormatId) => rpc<Start>('ustnyy_start', { p_format: format }),
  otvet: (session: string, pos: number, answer: string) =>
    rpc<OtvetServera>('ustnyy_answer', { p_session: session, p_pos: pos, p_answer: answer }),
  finish: (session: string) => rpc<Final>('ustnyy_finish', { p_session: session }),
  reyting: (format: ReytingFormatId, period: Period, klass: string | null) =>
    rpc<Reyting>('ustnyy_reyting', { p_format: format, p_period: period, p_class: klass }),
  moyProfil: () => rpc<MoyProfil>('ustnyy_moy_profil'),
  setNick: (nick: string) =>
    rpc<{ nick?: string; error?: string }>('ustnyy_set_nick', { p_nick: nick }),
  randomNick: () => rpc<{ nick: string }>('ustnyy_random_nick'),
  setPokazyvat: (on: boolean) =>
    rpc<{ pokazyvat: boolean }>('ustnyy_set_pokazyvat', { p_pokazyvat: on }),
  /** Классы вошедшего: репетитору — свои, ученику — те, где он состоит (RLS). */
  async klassy(): Promise<{ id: string; name: string }[]> {
    const supabase = await getClient();
    const r = await supabase
      .from('classes')
      .select('id, name')
      .is('archived_at', null)
      .order('name');
    if (r.error) fail(r.error);
    return (r.data ?? []) as { id: string; name: string }[];
  },
};
