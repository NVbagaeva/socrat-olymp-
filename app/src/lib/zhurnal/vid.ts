/**
 * Как показывать журнал: номера и названия разделов по структуре
 * ЕГЭ-2027, время, точность, период. Чистые функции — их проверяет
 * scripts/check-zhurnal.mjs.
 */

import { nomerRazdela, vEkzamene } from '@/content/struktura';
import { vseRazdely } from '@/content/tasks';
import { plural } from '@/lib/plural';

/** «№7 · Вычисления» — номер задания ЕГЭ, а не номер хранения. */
export function podpisRazdela(taskNo: number): string {
  const r = vseRazdely.find((t) => t.hranenie === taskNo);
  let nomer: number = taskNo;
  try {
    nomer = nomerRazdela(taskNo);
  } catch {
    /* Раздела нет в структуре — номер хранения. */
  }
  return r === undefined ? `№${nomer}` : `№${nomer} · ${r.name}`;
}

export function nomerEgeRazdela(taskNo: number): number {
  try {
    return nomerRazdela(taskNo);
  } catch {
    return taskNo;
  }
}

/**
 * Разделы для фильтров и столбцов тепловой карты: в порядке номеров
 * ЕГЭ-2027, только разделы журнала, без разделов вне экзамена (№6).
 */
export function razdelyDlyaPokaza(razdely: readonly number[]): number[] {
  return razdely
    .filter((n) => n !== 6 && vEkzamene(n))
    .sort((a, b) => nomerEgeRazdela(a) - nomerEgeRazdela(b));
}

/** Время: «45 с», «12 мин», «1 ч 05 мин». */
export function vremya(ms: number): string {
  const s = Math.round(ms / 1000);
  if (s < 60) return `${s} с`;
  const m = Math.round(s / 60);
  if (m < 60) return `${m} мин`;
  return `${Math.floor(m / 60)} ч ${String(m % 60).padStart(2, '0')} мин`;
}

/** Точность в процентах; null — решено меньше трёх задач, судить рано. */
export function tochnost(right: number, solved: number): number | null {
  return solved < 3 ? null : Math.round((100 * right) / solved);
}

/** Ступень цвета тепловой карты: 0 — нет данных, 1 — слабо … 4 — отлично. */
export function stupen(right: number, solved: number): 0 | 1 | 2 | 3 | 4 {
  if (solved === 0) return 0;
  const p = right / solved;
  if (p < 0.4) return 1;
  if (p < 0.6) return 2;
  if (p < 0.8) return 3;
  return 4;
}

export function zadach(n: number): string {
  return `${n} ${plural(n, 'задача', 'задачи', 'задач')}`;
}

/** Сегодня по Москве, ГГГГ-ММ-ДД. */
export function segodnyaMsk(now = Date.now()): string {
  return new Date(now + 3 * 3600 * 1000).toISOString().slice(0, 10);
}

/** День на n дней раньше. */
export function sdvig(day: string, n: number): string {
  const d = new Date(`${day}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() - n);
  return d.toISOString().slice(0, 10);
}

export type PeriodId = '7' | '30' | '90' | 'god';

export const PERIODY: readonly { id: PeriodId; label: string; dney: number }[] = [
  { id: '7', label: '7 дней', dney: 7 },
  { id: '30', label: '30 дней', dney: 30 },
  { id: '90', label: '3 месяца', dney: 90 },
  { id: 'god', label: 'Год', dney: 365 },
];

export function periodIz(id: PeriodId, now = Date.now()): { from: string; to: string } {
  const to = segodnyaMsk(now);
  const dney = PERIODY.find((p) => p.id === id)?.dney ?? 30;
  return { from: sdvig(to, dney - 1), to };
}

/** «22 ноября», «22 ноября, 14:05» — по Москве. */
export function dataRu(iso: string, sVremenem = false): string {
  const d = new Date(iso.length === 10 ? `${iso}T12:00:00+03:00` : iso);
  return d.toLocaleString('ru-RU', {
    timeZone: 'Europe/Moscow',
    day: 'numeric',
    month: 'long',
    ...(sVremenem ? { hour: '2-digit', minute: '2-digit' } : {}),
  });
}

/** Сколько дней не заходил; null — не заходил ни разу за время связи. */
export function dneyBez(lastDay: string | undefined, now = Date.now()): number | null {
  if (lastDay === undefined) return null;
  const a = Date.parse(`${segodnyaMsk(now)}T00:00:00Z`);
  const b = Date.parse(`${lastDay}T00:00:00Z`);
  return Math.round((a - b) / 86400000);
}

/** «Давно не заходил»: больше 7 дней или ни разу. */
export const DAVNO_DNEY = 7;

export const MESTA: Record<string, string> = {
  trenazher: 'Тренажёр',
  opornye: 'Опорные задачи',
  kartochki: 'Карточки',
  variant: 'Вариант',
  povyshennye: 'Повышенная сложность',
  dz: 'Домашнее задание',
};

export const ISKHODY: Record<string, string> = {
  right: 'Верно',
  hinted: 'Верно с подсказкой',
  wrong: 'Ошибка',
  revealed: 'Открыто решение',
  skipped: 'Пропущено',
  left: 'Не закончено',
};

export const ISTOCHNIKI_VARIANTA: Record<string, string> = {
  sobrat: 'Собранный вариант',
  seriya: 'Серия вариантов',
  povyshennye: 'Вариант повышенной сложности',
  rabota: 'Работа от учителя',
};
