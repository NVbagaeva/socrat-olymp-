/**
 * Ссылки онлайн-режима: решать вариант, страница серии, проверка
 * результата, статистика.
 *
 *   /variant/reshat/?kod=K7M2-1Z0GH-4F&v=3&r=k&tm=90&w=dz
 *   /variant/seriya/?kod=…&r=t&tm=s&w=probnik
 *   /variant/proverka/?r=<код результата>
 *
 * kod — код партии (тот же, что на листе: бумажный и онлайн-вариант
 * совпадают задача в задачу); v — номер варианта в партии; r — режим
 * (t — тренировка, k — контрольная); tm — таймер (0 — нет, s —
 * секундомер, число — обратный отсчёт в минутах); w — тип работы из
 * списка шапки, n — своё название (если w=custom).
 *
 * Этап 1: всё в адресе, сервер ничего не хранит. Режим и таймер ученик
 * может поменять в адресе — это закроет этап 2 (выдача через кабинет).
 */

export type Mode = 'trening' | 'kontrol';

export type Timer = { kind: 'none' } | { kind: 'up' } | { kind: 'down'; minutes: number };

export interface WorkSettings {
  mode: Mode;
  timer: Timer;
  /** Тип работы (id из WORK_KINDS) или 'custom'. */
  kind: string;
  /** Своё название — при kind = 'custom'. */
  title: string;
}

export interface WorkLink extends WorkSettings {
  code: string;
  /** Номер варианта в партии, с 1. */
  variant: number;
}

export const ONLINE_PATHS = {
  reshat: '/variant/reshat/',
  seriya: '/variant/seriya/',
  proverka: '/variant/proverka/',
  statistika: '/variant/statistika/',
} as const;

export const MAX_MINUTES = 300;

export function defaultSettings(): WorkSettings {
  return { mode: 'trening', timer: { kind: 'none' }, kind: 'ege', title: '' };
}

function timerParam(t: Timer): string {
  if (t.kind === 'up') return 's';
  if (t.kind === 'down') return String(t.minutes);
  return '0';
}

function parseTimer(raw: string | null): Timer {
  if (raw === 's') return { kind: 'up' };
  const n = Number(raw);
  if (raw !== null && /^\d+$/.test(raw) && n >= 1 && n <= MAX_MINUTES) {
    return { kind: 'down', minutes: n };
  }
  return { kind: 'none' };
}

function settingsQuery(s: WorkSettings, q: URLSearchParams): void {
  q.set('r', s.mode === 'kontrol' ? 'k' : 't');
  q.set('tm', timerParam(s.timer));
  q.set('w', s.kind);
  if (s.kind === 'custom' && s.title.trim() !== '') q.set('n', s.title.trim().slice(0, 80));
}

function parseSettings(q: URLSearchParams): WorkSettings {
  const kind = (q.get('w') ?? 'ege').replace(/[^a-z]/g, '').slice(0, 20) || 'ege';
  return {
    mode: q.get('r') === 'k' ? 'kontrol' : 'trening',
    timer: parseTimer(q.get('tm')),
    kind,
    title: kind === 'custom' ? (q.get('n') ?? '').slice(0, 80) : '',
  };
}

export function reshatHref(link: WorkLink): string {
  const q = new URLSearchParams({ kod: link.code, v: String(link.variant) });
  settingsQuery(link, q);
  return `${ONLINE_PATHS.reshat}?${q.toString()}`;
}

export function seriyaHref(code: string, s: WorkSettings): string {
  const q = new URLSearchParams({ kod: code });
  settingsQuery(s, q);
  return `${ONLINE_PATHS.seriya}?${q.toString()}`;
}

export function proverkaHref(resultCode: string): string {
  return `${ONLINE_PATHS.proverka}?${new URLSearchParams({ r: resultCode }).toString()}`;
}

/** Адрес решения → ссылка. null — нет кода или номера варианта. */
export function parseReshat(q: URLSearchParams): WorkLink | null {
  const code = (q.get('kod') ?? '').trim();
  const v = Number(q.get('v') ?? '1');
  if (code === '' || !Number.isInteger(v) || v < 1 || v > 99) return null;
  return { code, variant: v, ...parseSettings(q) };
}

/** Адрес серии → код и настройки. null — нет кода. */
export function parseSeriya(q: URLSearchParams): { code: string; settings: WorkSettings } | null {
  const code = (q.get('kod') ?? '').trim();
  return code === '' ? null : { code, settings: parseSettings(q) };
}

/** Ключ сессии решения: у каждого варианта партии и режима — свой. */
export function workScope(code: string, variant: number, mode: Mode): string {
  return `variant:${code}:${variant}:${mode === 'kontrol' ? 'k' : 't'}`;
}

/** Ключ «Работы над ошибками» по варианту. */
export function oshibkiScope(code: string, variant: number): string {
  return `variant:${code}:${variant}:oshibki`;
}

/** Опорные задачи и тренажёр раздела задания — для неверных номеров. */
export function sectionLinks(
  egeNumber: number,
  subtype: string,
): { opornye: string; trenazher: string } {
  /* №12 разбит по типам функций: подтип варианта — это тип раздела. */
  const base =
    egeNumber === 12 && subtype !== '' ? `/zadaniya/12/${subtype}` : `/zadaniya/${egeNumber}`;
  return { opornye: `${base}/opornye-zadachi/`, trenazher: `${base}/trenazher/` };
}
