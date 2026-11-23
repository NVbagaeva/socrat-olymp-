/**
 * Освоение типа тренажёра — одно правило для колец прогресса во всех
 * шапках разделов: тип освоен, когда в журнале попыток (lib/progressLog)
 * у него есть три верных ответа подряд без подсказок. Подсказка,
 * ошибка или открытое решение серию обрывают. Освоенный тип освоенным
 * и остаётся: кольцо считает, сколько пройдено, а «пора повторить»
 * показывает «Карта ЕГЭ».
 *
 * Чистая функция без браузера: её проверяет scripts/check-shapki.mjs.
 *
 * Старые счётчики (archive, folded) порядка попыток не хранят. Из них
 * тип засчитывается, только если там не меньше трёх верных и ни одной
 * ошибки или подсказки — тогда три верных подряд были наверняка.
 */

import type { ArchiveTally, ProgressLog } from '@/lib/progressLog/model';

export const PODRYAD_DLYA_OSVOENIYA = 3;

function chistyeStarye(t: ArchiveTally | undefined): boolean {
  return (
    t !== undefined &&
    t.right >= PODRYAD_DLYA_OSVOENIYA &&
    t.right === t.done &&
    (t.hinted ?? 0) === 0
  );
}

/** Освоенные типы журнала. */
export function osvoennyeTipy(log: ProgressLog | undefined): Set<string> {
  const out = new Set<string>();
  if (log === undefined) return out;
  const seriya = new Map<string, number>();
  /* Попытки в журнале лежат по времени (sortAttempts). */
  for (const a of log.attempts) {
    const n = a.outcome === 'right' ? (seriya.get(a.kind) ?? 0) + 1 : 0;
    seriya.set(a.kind, n);
    if (n >= PODRYAD_DLYA_OSVOENIYA) out.add(a.kind);
  }
  for (const ustroystvo of Object.values(log.archive)) {
    for (const [kind, t] of Object.entries(ustroystvo)) {
      if (chistyeStarye(t)) out.add(kind);
    }
  }
  for (const [kind, t] of Object.entries(log.folded?.kinds ?? {})) {
    if (chistyeStarye(t)) out.add(kind);
  }
  return out;
}

/** Сколько типов из списка освоено. */
export function skolkoOsvoeno(log: ProgressLog | undefined, tipy: readonly string[]): number {
  if (tipy.length === 0) return 0;
  const osv = osvoennyeTipy(log);
  return tipy.filter((t) => osv.has(t)).length;
}
