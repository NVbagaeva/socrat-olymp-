/**
 * Новая выдача ДЗ — сторона ученика (docs/kabinet-dz2.md, PR 2в).
 * Типы того, что отдают dz2_moi / dz2_open / dz2_check, и чистые
 * функции экрана: проверяет scripts/check-dz2.mjs.
 *
 * Ключей ученик не получает никогда: ответ сверяет база, решение
 * приходит только тогда, когда его можно показать.
 */

export type StatusUchenika =
  'not_started' | 'in_progress' | 'submitted' | 'late' | 'missed' | 'returned';

/** Строка «Моих домашек» (dz2_moi). */
export interface MoyaDomashka {
  id: string;
  title: string;
  due_at?: string;
  after_due: 'late_ok' | 'closed';
  kontrol: boolean;
  published_at?: string;
  status: StatusUchenika;
  submitted_at?: string;
  tutor_name?: string;
  items: number;
  items_done: number;
}

export type SostoyanieZadachi = 'open' | 'right' | 'wrong' | 'revealed';

export interface ShagRazbora {
  chto: string;
  tex?: string;
}

export interface Reshenie {
  answer: string;
  razbor?: { shagi: ShagRazbora[] } | null;
}

export interface ZapisOtveta {
  a: string;
  ok: boolean;
  vid: 'answer' | 'format' | 'fraction';
  at: string;
}

export interface ZadachaUchenika {
  id: string;
  position: number;
  kind: string;
  task_ref: string;
  question_html: string;
  risunok?: string;
  state: SostoyanieZadachi;
  attempts: number;
  hint_steps: number;
  answers?: ZapisOtveta[];
  solution?: Reshenie;
}

export interface Progress {
  done: number;
  need: number | null;
  completed: boolean;
  /** Цель «верных подряд»: сколько задач закрыто и сколько всего. */
  closed?: number;
  total?: number;
}

export type VidElementa = 'opornye' | 'trenazher' | 'kartochki' | 'variant' | 'chast2' | 'teoriya';

export interface ElementUchenika {
  id: string;
  position: number;
  kind: VidElementa;
  task_no: number;
  title: string;
  spec: Record<string, unknown>;
  goal_kind: 'all' | 'count' | 'streak';
  goal_n?: number;
  variant_work_id?: string;
  progress: Progress;
  tasks?: ZadachaUchenika[];
}

/** Открытое ДЗ (dz2_open). */
export interface DomashkaUchenika {
  id: string;
  title: string;
  note?: string;
  due_at?: string;
  after_due: 'late_ok' | 'closed';
  hints_allowed: boolean;
  attempts_limit?: 1 | 2 | 3;
  solutions_when: 'instant' | 'after_due' | 'never';
  kontrol: boolean;
  status: StatusUchenika;
  /** Почему решать нельзя: homework_closed, already_submitted, due_passed; нет — можно. */
  zakryto?: 'homework_closed' | 'already_submitted' | 'due_passed';
  return_comment?: string;
  comment?: string;
  items: ElementUchenika[];
}

/** Ответ dz2_check. */
export type ItogProverki =
  | { kind: 'closed'; state: SostoyanieZadachi }
  | { kind: 'format' }
  | { kind: 'fractionRight'; decimal: string }
  | {
      kind: 'right' | 'wrong';
      state: SostoyanieZadachi;
      attempts: number;
      left: number | null;
      solution: Reshenie | null;
    };

/* ── Чистые функции экрана ──────────────────────────────────────── */

/** Сдано ли (в том числе с опозданием). */
export function sdano(s: StatusUchenika): boolean {
  return s === 'submitted' || s === 'late';
}

/** Активное — то, что ещё надо делать: не сдано и приём не закрыт. */
export function aktivnaya(d: MoyaDomashka, now = Date.now()): boolean {
  if (sdano(d.status)) return false;
  if (d.due_at !== undefined && Date.parse(d.due_at) < now && d.after_due === 'closed')
    return false;
  return true;
}

/**
 * Порядок «Моих домашек»: сначала активные (вернули на доработку — выше
 * всех, дальше по дедлайну, без дедлайна — в конце), потом сданные и
 * закрытые, свежие выше.
 */
export function poryadok(list: readonly MoyaDomashka[], now = Date.now()): MoyaDomashka[] {
  const srok = (d: MoyaDomashka) => (d.due_at === undefined ? Infinity : Date.parse(d.due_at));
  const svezhest = (d: MoyaDomashka) =>
    Date.parse(d.submitted_at ?? d.published_at ?? '1970-01-01T00:00:00Z');
  return [...list].sort((a, b) => {
    const aa = aktivnaya(a, now);
    const ab = aktivnaya(b, now);
    if (aa !== ab) return aa ? -1 : 1;
    if (aa) {
      const ra = a.status === 'returned' ? 0 : 1;
      const rb = b.status === 'returned' ? 0 : 1;
      if (ra !== rb) return ra - rb;
      return srok(a) - srok(b);
    }
    return svezhest(b) - svezhest(a);
  });
}

/** Задачи элемента, которые ещё не закрыты. */
export function otkrytye(e: ElementUchenika): number {
  return (e.tasks ?? []).filter((t) => t.state === 'open').length;
}

/** Первая незакрытая задача элемента; все закрыты — первая. */
export function pervayaOtkrytaya(e: ElementUchenika): number {
  const i = (e.tasks ?? []).findIndex((t) => t.state === 'open');
  return i < 0 ? 0 : i;
}

/** Сколько элементов выполнено. */
export function vypolneno(d: DomashkaUchenika): number {
  return d.items.filter((e) => e.progress.completed).length;
}

/**
 * Подсказки у элемента: только у опорных задач — там разбор по шагам.
 * У задач тренажёра разбор одним куском: «подсказка» показала бы всё
 * решение сразу.
 */
export function estPodskazki(d: DomashkaUchenika, e: ElementUchenika): boolean {
  return d.hints_allowed && !d.kontrol && e.kind === 'opornye';
}

/** Картинка условия — только своя, из /images/: чужие адреса не грузятся. */
export function risunokSrc(risunok: string | undefined): string | null {
  if (risunok === undefined) return null;
  return /^\/images\/[A-Za-z0-9/_.-]+\.(webp|png|jpg|jpeg|svg)$/.test(risunok) &&
    !risunok.includes('..')
    ? risunok
    : null;
}

/** Прошёл ли дедлайн. */
export function srokProshel(d: { due_at?: string }, now = Date.now()): boolean {
  return d.due_at !== undefined && Date.parse(d.due_at) < now;
}

/** Цель элемента для подписи: сколько из скольких. */
export function cel(e: ElementUchenika): { done: number; need: number } {
  const need = e.progress.need ?? e.tasks?.length ?? 1;
  return { done: Math.min(e.progress.done, need), need };
}
