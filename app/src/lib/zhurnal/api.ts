'use client';

/**
 * Чтение журнала для экранов прогресса (docs/kabinet-zhurnal.md).
 *
 * Учитель — функции uchitel_*: база сама проверяет, что ученик его, и
 * отдаёт записи только с дня связи. Ученик — moya_* и moy_variant: своё,
 * без пометок для учителя. Модуль грузится динамически: в первую загрузку
 * страниц SDK не попадает.
 */

import type { ZapisChast2 } from './model';
import { getClient } from '@/lib/auth/client';

export type IskhodZhurnala = 'right' | 'hinted' | 'wrong' | 'revealed' | 'skipped' | 'left';

export interface PopytkaView {
  n: number;
  answer: string;
  ok: boolean;
  vid: 'answer' | 'format' | 'fraction';
  at: string;
}

export interface ZadachaView {
  id: string;
  task_no: number;
  kind: string;
  task_ref: string;
  gen_hash?: string;
  level?: number;
  place: string;
  place_ref?: string;
  outcome?: IskhodZhurnala;
  verified: boolean;
  answer_key?: string;
  attempts_n: number;
  hint_steps: number;
  hint_wrong: number[];
  shown_fact: boolean;
  shown_solution: boolean;
  skipped: boolean;
  active_ms: number;
  total_ms: number;
  started_at: string;
  closed_at?: string;
  uslovie_tex?: string;
  risunok?: string;
  last_answer?: string;
  /** Только у учителя: верный ответ сложной задачи за несколько секунд. */
  bystro?: true;
  popytki?: PopytkaView[];
}

export interface VariantView {
  id: string;
  source: 'sobrat' | 'seriya' | 'povyshennye' | 'mesyac' | 'rabota';
  title?: string;
  set_code: string;
  variant_no?: number;
  started_at?: string;
  finished_at?: string;
  primary_score?: number;
  max_score?: number;
  test_score?: number;
  active_ms: number;
  total_ms: number;
  zadachi?: ZadachaView[];
  /** Часть 2 — самопроверка ученика (поля как в журнале, lib/zhurnal/model.ts). */
  chast2?: ZapisChast2[];
}

export interface Svodka {
  active_ms: number;
  total_ms: number;
  solved: number;
  right: number;
  po_zadaniyam: { task_no: number; solved: number; right: number; active_ms: number }[];
  dni: { day: string; solved: number; active_ms: number }[];
  slabye: { task_no: number; kind: string; solved: number; right: number }[];
  varianty: VariantView[];
}

export interface UchenikView {
  id: string;
  name: string;
  /** С какого дня учителю видно (день связи). */
  s: string;
  progress_allowed: boolean;
  svodka: Svodka;
}

export interface KlassUchenik {
  id: string;
  name: string;
  s: string;
  last_day?: string;
  nedelya: { solved: number; active_ms: number; dni: number };
  ne_nachal_dz?: { id: string; title: string; due_at: string | null }[];
}

export interface KlassView {
  class: { id: string; name: string };
  ucheniki: KlassUchenik[];
  karta: { id: string; task_no: number; solved: number; right: number; active_ms: number }[];
  /** Ученики класса, чей журнал не виден: связь закончилась. */
  skryto: number;
}

export interface Period {
  /** ГГГГ-ММ-ДД по Москве, включительно. */
  from: string;
  to: string;
  taskNo: number | null;
}

export class ZhurnalError extends Error {
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
    throw new ZhurnalError(/^([a-z_]+)/.exec(message)?.[1] ?? 'unknown', message);
  }
  return data as T;
}

const periodArgs = (p: Period) => ({ p_from: p.from, p_to: p.to, p_task_no: p.taskNo });

export const uchitelKlass = (classId: string, p: Period) =>
  rpc<KlassView>('uchitel_klass', { p_class: classId, p_from: p.from, p_to: p.to });

export const uchitelUchenik = (studentId: string, p: Period) =>
  rpc<UchenikView>('uchitel_uchenik', { p_student: studentId, ...periodArgs(p) });

export const uchitelLenta = (studentId: string, p: Period, before: string | null = null) =>
  rpc<ZadachaView[]>('uchitel_lenta', { p_student: studentId, ...periodArgs(p), p_before: before });

export const uchitelZadacha = (studentId: string, id: string) =>
  rpc<ZadachaView>('uchitel_zadacha', { p_student: studentId, p_id: id });

export const uchitelVariant = (studentId: string, id: string) =>
  rpc<VariantView>('uchitel_variant', { p_student: studentId, p_id: id });

export const moyaStatistika = (p: Period) => rpc<Svodka>('moya_statistika', periodArgs(p));

export const moyaLenta = (p: Period, before: string | null = null) =>
  rpc<ZadachaView[]>('moya_lenta', { ...periodArgs(p), p_before: before });

export const moyVariant = (id: string) => rpc<VariantView>('moy_variant', { p_id: id });
