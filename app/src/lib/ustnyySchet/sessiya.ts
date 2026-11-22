/**
 * Тренировка устного счёта — чистые функции над состоянием: показать
 * пример, принять ответ, решить, что дальше, посчитать итоги.
 *
 * Время сюда приходит числом (мс активного времени с начала, из
 * chasy.ts): модуль не знает ни о браузере, ни о кадрах анимации.
 *
 * Режимы:
 *   свободный — без лимита времени и количества;
 *   серия     — N примеров, секундомер вверх;
 *   на время  — общий лимит, считать как можно больше.
 */

import { normalizeAnswer } from '@/lib/otvet';
import type { Generator } from './nabor';
import type { Primer } from './types';

export type Rezhim =
  { tip: 'svobodnyy' } | { tip: 'seriya'; n: number } | { tip: 'vremya'; sek: number };

export const SERII: readonly number[] = [10, 20, 50];
export const LIMITY_SEK: readonly number[] = [60, 120, 180, 300];

/** Пауза после ошибки в режимах на время, мс. */
export const PAUZA_OSHIBKI_MS = 1500;

export interface Hod {
  primer: Primer;
  /** Что ввёл ученик, нормальной записью. */
  vvod: string;
  verno: boolean;
  /** Время на пример: от показа до ответа, мс. */
  ms: number;
}

export interface Sostoyanie {
  rezhim: Rezhim;
  hody: Hod[];
  tekushiy: Primer | null;
  /** Когда показан текущий пример (активное время, мс). */
  pokazanV: number;
  konec: boolean;
  /** Работа над ошибками: неверный пример вернётся через несколько других. */
  vozvrat: { primer: Primer; cherez: number }[];
}

export interface Opcii {
  /** Возвращать неверные примеры в эту же тренировку (работа над ошибками). */
  vozvrashchat?: boolean;
}

/** Через сколько других примеров вернётся ошибка. */
export const VOZVRAT_CHEREZ = 3;

export function nachat(gen: Generator, rezhim: Rezhim, t = 0): Sostoyanie {
  const p = gen.next();
  return { rezhim, hody: [], tekushiy: p, pokazanV: t, konec: p === null, vozvrat: [] };
}

/** Режим «на время» и «серия» — с секундомером и автоматическим переходом. */
export function naVremya(r: Rezhim): boolean {
  return r.tip !== 'svobodnyy';
}

export function limitMs(r: Rezhim): number | null {
  return r.tip === 'vremya' ? r.sek * 1000 : null;
}

export type Otvet =
  { kind: 'format' } | { kind: 'hod'; hod: Hod; s: Sostoyanie } | { kind: 'pozdno'; s: Sostoyanie };

/** Принять ответ. Неверная запись (буквы, пусто) — не попытка. */
export function otvetit(s: Sostoyanie, vvod: string, t: number): Otvet {
  if (s.konec || s.tekushiy === null) return { kind: 'pozdno', s };
  const lim = limitMs(s.rezhim);
  if (lim !== null && t > lim) return { kind: 'pozdno', s: { ...s, konec: true } };
  const n = normalizeAnswer(vvod);
  if (!n.ok) return { kind: 'format' };
  const hod: Hod = {
    primer: s.tekushiy,
    vvod: n.value,
    verno: n.value === s.tekushiy.otvet,
    ms: Math.max(0, t - s.pokazanV),
  };
  const hody = [...s.hody, hod];
  const konec = s.rezhim.tip === 'seriya' && hody.length >= s.rezhim.n;
  return { kind: 'hod', hod, s: { ...s, hody, konec } };
}

/** Показать следующий пример. */
export function dalee(s: Sostoyanie, gen: Generator, t: number, o: Opcii = {}): Sostoyanie {
  if (s.konec) return s;
  const lim = limitMs(s.rezhim);
  if (lim !== null && t >= lim) return { ...s, konec: true, tekushiy: null };
  let vozvrat = s.vozvrat.map((v) => ({ ...v, cherez: v.cherez - 1 }));
  const last = s.hody[s.hody.length - 1];
  if (o.vozvrashchat === true && last !== undefined && !last.verno && last.primer === s.tekushiy) {
    vozvrat = [...vozvrat, { primer: last.primer, cherez: VOZVRAT_CHEREZ }];
  }
  const due = vozvrat.findIndex((v) => v.cherez <= 0);
  let p: Primer | null;
  if (due >= 0) {
    p = (vozvrat[due] as { primer: Primer }).primer;
    vozvrat = vozvrat.filter((_, i) => i !== due);
  } else {
    p = gen.next();
  }
  return { ...s, tekushiy: p, pokazanV: t, konec: p === null, vozvrat };
}

/** Закончить: время вышло или ученик сам нажал «Закончить». */
export function zakonchit(s: Sostoyanie): Sostoyanie {
  return { ...s, konec: true, tekushiy: null };
}

/** Вышло ли время у режима «на время». */
export function vremyaVyshlo(s: Sostoyanie, t: number): boolean {
  const lim = limitMs(s.rezhim);
  return lim !== null && t >= lim;
}

/* ── Итоги ─────────────────────────────────────────────────── */

export interface Itogi {
  verno: number;
  oshibki: number;
  vsego: number;
  /** Общее (активное) время тренировки, мс. */
  ms: number;
  /** Среднее на пример, мс. */
  srednee: number;
  luchshayaSeriya: number;
  /** Три самых медленных верных примера. */
  medlennye: Hod[];
  /** Ошибки по порядку (без повторов одного примера). */
  spisokOshibok: Hod[];
}

export function itogi(s: Sostoyanie, ms: number): Itogi {
  const verno = s.hody.filter((h) => h.verno).length;
  let seriya = 0;
  let luchshaya = 0;
  for (const h of s.hody) {
    seriya = h.verno ? seriya + 1 : 0;
    luchshaya = Math.max(luchshaya, seriya);
  }
  const medlennye = s.hody
    .filter((h) => h.verno)
    .sort((a, b) => b.ms - a.ms)
    .slice(0, 3);
  const seen = new Set<string>();
  const spisokOshibok = s.hody.filter((h) => {
    if (h.verno || seen.has(h.primer.key)) return false;
    seen.add(h.primer.key);
    return true;
  });
  const vsego = s.hody.length;
  return {
    verno,
    oshibki: vsego - verno,
    vsego,
    ms,
    srednee: vsego === 0 ? 0 : Math.round(ms / vsego),
    luchshayaSeriya: luchshaya,
    medlennye,
    spisokOshibok,
  };
}
