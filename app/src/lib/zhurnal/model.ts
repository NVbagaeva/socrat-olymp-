/**
 * Журнал решения задач: записи и очередь отправки (чистая логика).
 *
 * Одна показанная задача — запись (Zapis); каждое действие — событие.
 * Очередь живёт в хранилище браузера и уходит на сервер пачками
 * (функция базы journal_push, supabase/migrations/…_zhurnal.sql). Повтор
 * пачки на сервере ничего не меняет, поэтому при сбое пачка просто
 * отправляется ещё раз.
 */

import type { AktivnostSnimok } from './aktivnost';

export type Istochnik = 'trainer' | 'opornye' | 'cards' | 'variant' | 'homework';
export type Ishod = 'right' | 'hinted' | 'wrong' | 'revealed' | 'skipped';
export type TipSobytiya =
  | 'attempt'
  | 'hint_open'
  | 'hint_step'
  | 'hint_miss'
  | 'property'
  | 'solution'
  | 'skip'
  | 'similar';

export interface Sobytie {
  seq: number;
  type: TipSobytiya;
  answer?: string;
  ok?: boolean;
  step?: number;
  at: string;
  active_ms: number;
}

/** Что за задача: по этому учитель увидит её такой же. */
export interface OpisanieZadachi {
  /**
   * Ключ показа: один и тот же, пока ученик работает с этой задачей
   * (в том числе после перезагрузки страницы), и новый — для нового показа.
   */
  klyuch: string;
  source: Istochnik;
  /** Номер хранения раздела (content/tasks.ts). */
  taskNo: number;
  /** Тип или прототип. */
  kind?: string;
  /** Ссылка для генератора: «8.A|42|1», «прототип:3». */
  ref?: string;
  gen?: string;
  /** Условие, каким его видел ученик (HTML с формулами KaTeX). */
  statement?: string;
  /** Чертёж (SVG). */
  figure?: string;
  /** Верный ответ, если браузер его знает. */
  answer?: string;
  session?: string;
  workId?: string;
  homeworkId?: string;
  position?: number;
}

export interface Zapis {
  id: string;
  klyuch: string;
  opis: Omit<OpisanieZadachi, 'klyuch' | 'statement' | 'figure' | 'answer'>;
  /** Снимок условия: уходит с первой пачкой и после неё стирается. */
  snapshot: { statement: string; figure?: string; answer?: string } | null;
  startedAt: string;
  closedAt: string | null;
  outcome: Ishod | null;
  vremya: AktivnostSnimok;
  events: Sobytie[];
  /** Сколько событий уже принято сервером. */
  sent: number;
  /** Запись создана на сервере. */
  created: boolean;
  /** Есть неотправленные изменения. */
  dirty: boolean;
  touchedAt: number;
}

export interface Rabota {
  id: string;
  kind: 'sobrat' | 'seriya' | 'povyshennye' | 'ezhemesyachnye' | 'kabinet';
  code?: string;
  variant?: number;
  mode?: 'trening' | 'kontrol';
  title?: string;
  startedAt: string;
  finishedAt: string | null;
  primary?: number;
  max?: number;
  test?: number | null;
  totalMs: number;
  activeMs: number;
  dirty: boolean;
}

export interface Ochered {
  v: 1;
  /** Чей журнал: при смене аккаунта очередь не уходит другому. */
  user: string | null;
  zapisi: Zapis[];
  raboty: Rabota[];
}

export const PUSTAYA: Ochered = { v: 1, user: null, zapisi: [], raboty: [] };

/** Предел базы: в пачке не больше 50 задач, на задачу — 200 событий. */
export const PACHKA_ZADACH = 40;
export const PACHKA_SOBYTIY = 200;
/** На задачу — не больше 500 событий (seq в базе). */
export const PREDEL_SOBYTIY = 500;
/** Открытая запись без движения дольше недели закрывается «как есть». */
export const SROK_OTKRYTOY_MS = 7 * 24 * 3600 * 1000;
/** Пачка со снимками не должна превысить предел шлюза (1 МБ). */
const PACHKA_BAYT = 600_000;

export function novoeSobytie(
  zapis: Zapis,
  type: TipSobytiya,
  at: string,
  activeMs: number,
  extra: { answer?: string; ok?: boolean; step?: number } = {},
): Sobytie | null {
  if (zapis.closedAt !== null || zapis.events.length >= PREDEL_SOBYTIY) {
    return null;
  }
  const last = zapis.events[zapis.events.length - 1];
  const sobytie: Sobytie = {
    seq: (last?.seq ?? 0) + 1,
    type,
    at,
    active_ms: activeMs,
    ...(extra.answer === undefined ? {} : { answer: extra.answer.slice(0, 200) }),
    ...(extra.ok === undefined ? {} : { ok: extra.ok }),
    ...(extra.step === undefined ? {} : { step: extra.step }),
  };
  zapis.events.push(sobytie);
  zapis.dirty = true;
  return sobytie;
}

interface Pachka {
  body: { runs: unknown[]; works: unknown[] };
  /** Что отметить принятым после успеха: запись → сколько событий ушло. */
  zapisi: Array<{ id: string; sent: number; closed: boolean }>;
  raboty: string[];
}

/** Следующая пачка для journal_push; null — отправлять нечего. */
export function sobratPachku(ochered: Ochered): Pachka | null {
  const pachka: Pachka = { body: { runs: [], works: [] }, zapisi: [], raboty: [] };
  for (const r of ochered.raboty.filter((item) => item.dirty).slice(0, 10)) {
    pachka.body.works.push({
      id: r.id,
      kind: r.kind,
      code: r.code ?? null,
      variant: r.variant ?? null,
      mode: r.mode ?? null,
      title: r.title ?? null,
      started_at: r.startedAt,
      finished_at: r.finishedAt,
      primary: r.primary ?? null,
      max: r.max ?? null,
      test: r.test ?? null,
      total_ms: r.totalMs,
      active_ms: r.activeMs,
    });
    pachka.raboty.push(r.id);
  }
  let bayt = 0;
  for (const z of ochered.zapisi) {
    if (!z.dirty && z.created) {
      continue;
    }
    if (pachka.body.runs.length >= PACHKA_ZADACH) {
      break;
    }
    const snapshot = z.created ? null : z.snapshot;
    const ves = snapshot === null ? 0 : snapshot.statement.length + (snapshot.figure?.length ?? 0);
    if (pachka.body.runs.length > 0 && bayt + ves > PACHKA_BAYT) {
      break;
    }
    bayt += ves;
    const events = z.events.slice(z.sent, z.sent + PACHKA_SOBYTIY);
    const vse = z.sent + events.length === z.events.length;
    pachka.body.runs.push({
      id: z.id,
      source: z.opis.source,
      task_no: z.opis.taskNo,
      kind: z.opis.kind ?? null,
      ref: z.opis.ref ?? null,
      gen: z.opis.gen ?? null,
      session: z.opis.session ?? null,
      work_id: z.opis.workId ?? null,
      homework_id: z.opis.homeworkId ?? null,
      position: z.opis.position ?? null,
      started_at: z.startedAt,
      /* Закрытие уходит только с последними событиями: закрытую
         задачу сервер больше не дополняет. */
      closed_at: vse ? z.closedAt : null,
      outcome: vse ? z.outcome : null,
      total_ms: z.vremya.obshchee,
      active_ms: z.vremya.acc,
      snapshot,
      events,
    });
    pachka.zapisi.push({
      id: z.id,
      sent: z.sent + events.length,
      closed: vse && z.closedAt !== null,
    });
  }
  return pachka.body.runs.length + pachka.body.works.length === 0 ? null : pachka;
}

/**
 * Пачка принята. Изменения, появившиеся за время отправки, остаются:
 * `snimki` — отпечатки записей на момент сборки пачки.
 */
export function otmetitPrinyatoe(
  ochered: Ochered,
  pachka: Pachka,
  snimki: Map<string, string>,
): void {
  for (const item of pachka.zapisi) {
    const z = ochered.zapisi.find((zapis) => zapis.id === item.id);
    if (z === undefined) {
      continue;
    }
    z.created = true;
    z.snapshot = null;
    z.sent = Math.max(z.sent, item.sent);
    z.dirty = z.sent < z.events.length || snimki.get(z.id) !== otpechatok(z);
  }
  /* Принятые закрытые записи из очереди уходят. */
  ochered.zapisi = ochered.zapisi.filter((z) => !(z.created && !z.dirty && z.closedAt !== null));
  ochered.raboty = ochered.raboty.filter(
    (r) => !(pachka.raboty.includes(r.id) && snimki.get(r.id) === otpechatokRaboty(r)),
  );
}

/** Состояние записи одной строкой: изменилась ли она за время отправки. */
export function otpechatok(z: Zapis): string {
  return `${z.events.length}|${z.closedAt ?? ''}|${z.outcome ?? ''}|${z.vremya.acc}|${z.vremya.obshchee}`;
}
export function otpechatokRaboty(r: Rabota): string {
  return `${r.finishedAt ?? ''}|${r.primary ?? ''}|${r.totalMs}|${r.activeMs}`;
}

/** Пачку сервер не примет никогда (не сбой сети): её записи убираются. */
export function vybrositPachku(ochered: Ochered, pachka: Pachka): void {
  const ids = new Set(pachka.zapisi.map((item) => item.id));
  ochered.zapisi = ochered.zapisi.filter((z) => !ids.has(z.id));
  ochered.raboty = ochered.raboty.filter((r) => !pachka.raboty.includes(r.id));
}

/** Забытые открытые записи, уже принятые сервером, из очереди уходят. */
export function ubratStarye(ochered: Ochered, now: number): void {
  ochered.zapisi = ochered.zapisi.filter(
    (z) => z.closedAt !== null || z.dirty || !z.created || now - z.touchedAt < SROK_OTKRYTOY_MS,
  );
}
