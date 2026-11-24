/**
 * Итоги ДЗ у учителя (docs/kabinet-dz2.md, PR 2г): «ученики × элементы».
 * Типы того, что отдают dz2_itogi и dz2_otvety, и чистые функции экрана —
 * проверяет scripts/check-dz2.mjs. Данные — только своих ДЗ: чужому
 * учителю база отвечает forbidden.
 */

import type {
  Progress,
  SostoyanieZadachi,
  StatusUchenika,
  VidElementa,
  ZapisOtveta,
} from './uchenik';

export interface ElementItogov {
  id: string;
  position: number;
  kind: VidElementa;
  task_no: number;
  title: string;
  goal_kind: 'all' | 'count' | 'streak';
  goal_n: number | null;
}

export interface UchenikItogov {
  id: string;
  name?: string;
  status: StatusUchenika;
  submitted_at?: string;
  returned_at?: string;
  comment?: string;
  seconds: number;
  /** id элемента → прогресс. */
  progress: Record<string, Progress> | null;
}

export interface Itogi {
  id: string;
  title: string;
  status: 'draft' | 'template' | 'published' | 'closed';
  due_at: string | null;
  publish_at: string | null;
  items: ElementItogov[];
  ucheniki: UchenikItogov[];
}

/** Задача ученика с верным ответом (dz2_otvety) — только учителю. */
export interface OtvetUchenika {
  id: string;
  item_id: string;
  position: number;
  kind: string;
  task_ref: string;
  question_html: string;
  risunok?: string;
  answer_key: string;
  state: SostoyanieZadachi;
  attempts: number;
  hint_steps: number;
  seconds: number;
  answers?: ZapisOtveta[];
}

/* ── Чистые функции ─────────────────────────────────────────────── */

export type Yacheyka = 'gotovo' | 'nachato' | 'net';

/** Клетка «ученик × элемент»: выполнено, начато или не начато. */
export function yacheyka(p: Progress | undefined): Yacheyka {
  if (p === undefined) return 'net';
  if (p.completed) return 'gotovo';
  return p.done > 0 || (p.closed ?? 0) > 0 ? 'nachato' : 'net';
}

/** Подпись клетки: «3/3», у теории — галочка или прочерк. */
export function podpisYacheyki(e: ElementItogov, p: Progress | undefined): string {
  if (p === undefined) return '—';
  if (e.kind === 'teoriya') return p.completed ? '✓' : '—';
  const need = p.need ?? 0;
  return `${Math.min(p.done, need || p.done)}/${need}`;
}

/** Сколько учеников сдали (в том числе с опозданием). */
export function sdali(u: readonly UchenikItogov[]): number {
  return u.filter((x) => x.status === 'submitted' || x.status === 'late').length;
}

/** Сколько учеников выполнили элемент. */
export function vypolnili(u: readonly UchenikItogov[], itemId: string): number {
  return u.filter((x) => x.progress?.[itemId]?.completed === true).length;
}

/** Счёт по статусам — для строки над таблицей. */
export function poStatusam(u: readonly UchenikItogov[]): Partial<Record<StatusUchenika, number>> {
  const out: Partial<Record<StatusUchenika, number>> = {};
  for (const x of u) out[x.status] = (out[x.status] ?? 0) + 1;
  return out;
}

/**
 * Порядок учеников: сначала сдавшие (их проверять), потом на доработке,
 * в работе, не начавшие и не сдавшие; внутри — по имени.
 */
const VES: Record<StatusUchenika, number> = {
  submitted: 0,
  late: 0,
  returned: 1,
  in_progress: 2,
  not_started: 3,
  missed: 4,
};

export function poryadokUchenikov(u: readonly UchenikItogov[]): UchenikItogov[] {
  return [...u].sort(
    (a, b) => VES[a.status] - VES[b.status] || (a.name ?? '').localeCompare(b.name ?? '', 'ru'),
  );
}

/** Вернуть можно только сданное. */
export function mozhnoVernut(x: UchenikItogov): boolean {
  return x.status === 'submitted' || x.status === 'late';
}

/** Задачи ученика по элементам, в порядке элементов. */
export function poElementam(
  items: readonly ElementItogov[],
  otvety: readonly OtvetUchenika[],
): { e: ElementItogov; zadachi: OtvetUchenika[] }[] {
  return items.map((e) => ({
    e,
    zadachi: otvety.filter((o) => o.item_id === e.id).sort((a, b) => a.position - b.position),
  }));
}
