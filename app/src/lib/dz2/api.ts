'use client';

/**
 * Новая выдача ДЗ — вызовы функций базы (docs/kabinet-dz2.md). Модуль
 * грузится динамически: в первую загрузку страниц SDK не попадает.
 */

import { getClient } from '@/lib/auth/client';
import type { Itogi, OtvetUchenika } from './itogi';
import type { DomashkaUchenika, ItogProverki, MoyaDomashka, Progress, ShagRazbora } from './uchenik';

export class Dz2Error extends Error {
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
    /* Код PostgREST (PGRST301 — истёк вход) — в текст: его различает lib/dz2/oshibka.ts. */
    const kodPostgrest = typeof error.code === 'string' && error.code.startsWith('PGRST') ? ` [${error.code}]` : '';
    throw new Dz2Error(/^([a-z_0-9]+)/.exec(message)?.[1] ?? 'unknown', message + kodPostgrest);
  }
  return data as T;
}

export interface Dz2Kratko {
  id: string;
  title: string;
  status: 'draft' | 'template' | 'published' | 'closed';
  publish_at?: string;
  due_at?: string;
  created_at: string;
  items: number;
  recipients: number;
  submitted: number;
}

export interface Dz2Polnoe {
  id: string;
  title: string;
  note: string | null;
  status: Dz2Kratko['status'];
  publish_at: string | null;
  due_at: string | null;
  after_due: 'late_ok' | 'closed';
  hints_allowed: boolean;
  attempts_limit: 1 | 2 | 3 | null;
  solutions_when: 'instant' | 'after_due' | 'never';
  individual: boolean;
  kontrol: boolean;
}

export interface Dz2ElementStroka {
  id: string;
  position: number;
  kind: string;
  task_no: number;
  title: string;
  spec: Record<string, unknown>;
  goal_kind: 'all' | 'count' | 'streak';
  goal_n: number | null;
  variant_work_id: string | null;
}

export const dz2Save = (p: Record<string, unknown>) => rpc<string>('dz2_save', { p });
export const dz2Publish = (id: string) => rpc<{ id: string; recipients: number }>('dz2_publish', { p_id: id });
export const dz2Copy = (id: string, status: 'draft' | 'template' = 'draft') =>
  rpc<string>('dz2_copy', { p_id: id, p_status: status });
export const dz2Delete = (id: string) => rpc<null>('dz2_delete', { p_id: id });
export const dz2Edit = (id: string, p: Record<string, unknown>) => rpc<null>('dz2_edit', { p_id: id, p });
export const dz2Spisok = () => rpc<Dz2Kratko[]>('dz2_spisok', {});
export const dz2SaveChernovik = (id: string, p: Record<string, unknown>) =>
  rpc<null>('dz2_chernovik', { p_id: id, p });

/** Рабочая копия мастера в черновике (учитель читает свои строки). */
export async function dz2ProchestChernovik(id: string): Promise<{
  dz: Dz2Polnoe;
  chernovik: Record<string, unknown> | null;
}> {
  const supabase = await getClient();
  const r = await supabase
    .from('homework2')
    .select('id, title, note, status, publish_at, due_at, after_due, hints_allowed, attempts_limit, solutions_when, individual, kontrol, chernovik')
    .eq('id', id)
    .single();
  if (r.error !== null) throw new Dz2Error('not_found', r.error.message);
  const { chernovik, ...dz } = r.data as Dz2Polnoe & { chernovik: Record<string, unknown> | null };
  return { dz, chernovik };
}

/** Черновик целиком: строка ДЗ, цели и элементы (учитель читает свои строки). */
export async function dz2Chernovik(id: string): Promise<{
  dz: Dz2Polnoe;
  targets: { class_id: string | null; student_id: string | null }[];
  items: Dz2ElementStroka[];
}> {
  const supabase = await getClient();
  const [dz, targets, items] = await Promise.all([
    supabase.from('homework2').select('id, title, note, status, publish_at, due_at, after_due, hints_allowed, attempts_limit, solutions_when, individual, kontrol').eq('id', id).single(),
    supabase.from('homework2_targets').select('class_id, student_id').eq('homework_id', id),
    supabase.from('homework2_items').select('id, position, kind, task_no, title, spec, goal_kind, goal_n, variant_work_id').eq('homework_id', id).order('position'),
  ]);
  if (dz.error !== null) throw new Dz2Error('not_found', dz.error.message);
  return {
    dz: dz.data as Dz2Polnoe,
    targets: (targets.data ?? []) as { class_id: string | null; student_id: string | null }[],
    items: (items.data ?? []) as Dz2ElementStroka[],
  };
}

/* ── Ученик (PR 2в): только функции, ключей не читает ───────────── */

export const dz2Moi = () => rpc<MoyaDomashka[]>('dz2_moi', {});
export const dz2Open = (id: string) => rpc<DomashkaUchenika>('dz2_open', { p_id: id });
export const dz2Check = (task: string, answer: string, seconds: number) =>
  rpc<ItogProverki>('dz2_check', { p_task: task, p_answer: answer, p_seconds: Math.max(0, Math.round(seconds)) });
export const dz2Hint = (task: string, step: number) =>
  rpc<{ step: ShagRazbora | null }>('dz2_hint', { p_task: task, p_step: step });
export const dz2Mark = (item: string, done: number) => rpc<Progress>('dz2_mark', { p_item: item, p_done: done });
export const dz2Submit = (id: string) => rpc<{ status: 'submitted' | 'late' }>('dz2_submit', { p_id: id });

/* ── Учитель: итоги ДЗ (PR 2г) ──────────────────────────────────── */

export const dz2Itogi = (id: string) => rpc<Itogi>('dz2_itogi', { p_id: id });
export const dz2Otvety = (id: string, student: string) =>
  rpc<OtvetUchenika[]>('dz2_otvety', { p_id: id, p_student: student });
export const dz2Vernut = (id: string, student: string, comment: string) =>
  rpc<null>('dz2_vernut', { p_id: id, p_student: student, p_comment: comment });
export const dz2Comment = (id: string, student: string, comment: string) =>
  rpc<null>('dz2_comment', { p_id: id, p_student: student, p_comment: comment });
