/**
 * Своя статистика ученика по журналу решения (функция базы my_summary,
 * supabase/migrations/…_zhurnal.sql) и чистые помощники для экрана.
 * Пометок для учителя здесь нет.
 */

export interface SvodkaZadaniya {
  task_no: number;
  closed: number;
  right: number;
  active_ms: number;
}

export interface SvodkaDnya {
  day: string;
  closed: number;
  active_ms: number;
}

export interface SvodkaRaboty {
  id: string;
  kind: string;
  title: string | null;
  finished_at: string;
  primary: number | null;
  max: number | null;
  test: number | null;
  active_ms: number;
}

export interface Svodka {
  from: string;
  to: string;
  active_ms: number;
  solved: number;
  tasks: SvodkaZadaniya[];
  days: SvodkaDnya[];
  works: SvodkaRaboty[];
}

export interface StrokaLenty {
  id: string;
  source: 'trainer' | 'opornye' | 'cards' | 'variant' | 'homework';
  task_no: number;
  kind: string | null;
  outcome: 'right' | 'hinted' | 'wrong' | 'revealed' | 'skipped';
  active_ms: number;
  started_at: string;
}

/** Москва — постоянные UTC+3: день считается так же, как в базе. */
const MSK_MS = 3 * 3600 * 1000;

/** День по Москве, «2026-11-22». */
export function denMsk(ms: number): string {
  return new Date(ms + MSK_MS).toISOString().slice(0, 10);
}

/** Период: последние `dney` дней по Москве, включая сегодня. */
export function period(dney: number, now: number): { from: string; to: string } {
  return { from: denMsk(now - (dney - 1) * 86_400_000), to: denMsk(now) };
}

/** «1 ч 05 мин», «12 мин», «меньше минуты». */
export function vremyaSlovami(ms: number): string {
  const minut = Math.round(ms / 60_000);
  if (ms > 0 && minut === 0) {
    return 'меньше минуты';
  }
  const ch = Math.floor(minut / 60);
  const m = minut % 60;
  return ch === 0 ? `${m} мин` : `${ch} ч ${String(m).padStart(2, '0')} мин`;
}

/** Точность в процентах; null — задач не было. */
export function tochnost(right: number, closed: number): number | null {
  return closed === 0 ? null : Math.round((right / closed) * 100);
}

/** Ступень активности дня для календаря: 0 — не занимался, 1–4 — по времени. */
export function stupenDnya(activeMs: number): 0 | 1 | 2 | 3 | 4 {
  if (activeMs <= 0) return 0;
  if (activeMs < 10 * 60_000) return 1;
  if (activeMs < 30 * 60_000) return 2;
  if (activeMs < 60 * 60_000) return 3;
  return 4;
}

/** Все дни периода подряд (для календаря), с пустыми днями. */
export function dniPerioda(from: string, to: string, days: readonly SvodkaDnya[]): SvodkaDnya[] {
  const po = new Map(days.map((d) => [d.day, d]));
  const out: SvodkaDnya[] = [];
  for (
    let t = Date.parse(`${from}T00:00:00Z`);
    t <= Date.parse(`${to}T00:00:00Z`);
    t += 86_400_000
  ) {
    const day = new Date(t).toISOString().slice(0, 10);
    out.push(po.get(day) ?? { day, closed: 0, active_ms: 0 });
  }
  return out;
}

export async function zagruzitSvodku(
  dney: number,
): Promise<{ svodka: Svodka; lenta: StrokaLenty[] }> {
  const { getClient } = await import('../auth/client');
  const supabase = await getClient();
  const { from, to } = period(dney, Date.now());
  const [svodka, lenta] = await Promise.all([
    supabase.rpc('my_summary', { p_from: from, p_to: to }),
    supabase
      .from('task_runs')
      .select('id, source, task_no, kind, outcome, active_ms, started_at')
      .neq('outcome', 'open')
      .gte('started_at', new Date(Date.parse(`${from}T00:00:00Z`) - MSK_MS).toISOString())
      .order('started_at', { ascending: false })
      .limit(30),
  ]);
  if (svodka.error !== null) {
    throw new Error(svodka.error.message);
  }
  if (lenta.error !== null) {
    throw new Error(lenta.error.message);
  }
  return { svodka: svodka.data as Svodka, lenta: (lenta.data ?? []) as StrokaLenty[] };
}
