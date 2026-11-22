/**
 * Экраны прогресса: чистые помощники (docs/kabinet-progress.md) — период,
 * время словами, ступень тепловой карты, «давно не заходил», таблицы
 * для Excel. Без браузера: проверяет scripts/check-progress-ekrany.mjs.
 */

import type { KlassView, Svodka, UchenikView, VariantView, ZadachaView, IskhodZhurnala } from './api';
import { nomerRazdela } from '@/content/struktura';
import type { Cell } from '@/lib/xlsx';

/** Москва — постоянные UTC+3: день считается так же, как в базе. */
const MSK_MS = 3 * 3600 * 1000;
const DEN_MS = 86_400_000;

/** День по Москве: «2026-11-22». */
export function denMsk(ms: number): string {
  return new Date(ms + MSK_MS).toISOString().slice(0, 10);
}

export type PeriodId = '7' | '30' | '90' | 'god';

export const PERIODY: readonly { id: PeriodId; label: string }[] = [
  { id: '7', label: '7 дней' },
  { id: '30', label: '30 дней' },
  { id: '90', label: '3 месяца' },
  { id: 'god', label: 'Учебный год' },
];

/** Период по Москве, включая сегодня. Учебный год — с 1 сентября. */
export function period(id: PeriodId, now: number): { from: string; to: string } {
  const to = denMsk(now);
  if (id === 'god') {
    const god = Number(to.slice(0, 4)) - (to.slice(5) < '09-01' ? 1 : 0);
    return { from: `${god}-09-01`, to };
  }
  return { from: denMsk(now - (Number(id) - 1) * DEN_MS), to };
}

/** Сколько дней между двумя днями «ГГГГ-ММ-ДД». */
export function dneyMezhdu(from: string, to: string): number {
  return Math.round((Date.parse(`${to}T00:00:00Z`) - Date.parse(`${from}T00:00:00Z`)) / DEN_MS);
}

/** «1 ч 05 мин», «12 мин», «40 с», «—». */
export function vremya(ms: number): string {
  if (ms <= 0) return '—';
  if (ms < 60_000) return `${Math.max(1, Math.round(ms / 1000))} с`;
  const minut = Math.round(ms / 60_000);
  const ch = Math.floor(minut / 60);
  const m = minut % 60;
  return ch === 0 ? `${m} мин` : `${ch} ч ${String(m).padStart(2, '0')} мин`;
}

/** Точность в процентах; null — задач не было. */
export function tochnost(right: number, solved: number): number | null {
  return solved <= 0 ? null : Math.round((right / solved) * 100);
}

/**
 * Ступень успешности для тепловой карты: 0 — не решал, 1–5 — по
 * точности. Цвет дублируется числом: один цвет ничего не сообщает.
 */
export function stupenUspeha(right: number, solved: number): 0 | 1 | 2 | 3 | 4 | 5 {
  const p = tochnost(right, solved);
  if (p === null) return 0;
  if (p < 40) return 1;
  if (p < 60) return 2;
  if (p < 75) return 3;
  if (p < 90) return 4;
  return 5;
}

/** Ступень дня в календаре: 0 — не занимался, 1–4 — по активному времени. */
export function stupenDnya(activeMs: number): 0 | 1 | 2 | 3 | 4 {
  if (activeMs <= 0) return 0;
  if (activeMs < 10 * 60_000) return 1;
  if (activeMs < 30 * 60_000) return 2;
  if (activeMs < 60 * 60_000) return 3;
  return 4;
}

/** Все дни периода подряд, с пустыми. Не раньше дня `min` (с него учителю видно). */
export function dniPerioda(
  from: string,
  to: string,
  dni: Svodka['dni'],
  min?: string,
): { day: string; solved: number; active_ms: number }[] {
  const po = new Map(dni.map((d) => [d.day, d]));
  const start = min !== undefined && min > from ? min : from;
  const out = [];
  for (let t = Date.parse(`${start}T00:00:00Z`); t <= Date.parse(`${to}T00:00:00Z`); t += DEN_MS) {
    const day = new Date(t).toISOString().slice(0, 10);
    out.push(po.get(day) ?? { day, solved: 0, active_ms: 0 });
  }
  return out;
}

/** Больше скольких дней без занятий — «давно не заходил». */
export const DAVNO_DNEY = 7;

/**
 * Когда занимался в последний раз: дней назад и давно ли. Без записей
 * отсчёт идёт от дня, с которого ученик виден учителю.
 */
export function posledniyDen(
  lastDay: string | undefined,
  s: string,
  today: string,
): { dney: number | null; davno: boolean } {
  if (lastDay === undefined) {
    return { dney: null, davno: dneyMezhdu(s, today) > DAVNO_DNEY };
  }
  const dney = Math.max(0, dneyMezhdu(lastDay, today));
  return { dney, davno: dney > DAVNO_DNEY };
}

/** «сегодня», «вчера», «3 дня назад», «12 дней назад». */
export function dneyNazad(dney: number): string {
  if (dney === 0) return 'сегодня';
  if (dney === 1) return 'вчера';
  const d10 = dney % 10;
  const d100 = dney % 100;
  const slovo = d10 === 1 && d100 !== 11 ? 'день' : d10 >= 2 && d10 <= 4 && (d100 < 12 || d100 > 14) ? 'дня' : 'дней';
  return `${dney} ${slovo} назад`;
}

/** Номер задания на экране — по действующей структуре экзамена. */
export function nomerZadaniya(taskNo: number): string {
  try {
    return `№${nomerRazdela(taskNo)}`;
  } catch {
    return `№${taskNo}`;
  }
}

export const ISKHOD: Record<IskhodZhurnala, { text: string; ton: 'da' | 'net' | 'tiho' }> = {
  right: { text: 'верно', ton: 'da' },
  hinted: { text: 'верно с подсказкой', ton: 'da' },
  wrong: { text: 'с ошибкой', ton: 'net' },
  revealed: { text: 'открыто решение', ton: 'tiho' },
  skipped: { text: 'пропущено', ton: 'tiho' },
  left: { text: 'не закончено', ton: 'tiho' },
};

export const MESTO: Record<string, string> = {
  trenazher: 'тренажёр',
  opornye: 'опорная задача',
  kartochki: 'карточка',
  variant: 'вариант',
  povyshennye: 'вариант повышенной сложности',
  dz: 'домашнее задание',
};

export const ISTOCHNIK_VARIANTA: Record<VariantView['source'], string> = {
  sobrat: 'Собрать вариант',
  seriya: 'Серия',
  povyshennye: 'Повышенной сложности',
  rabota: 'Работа от учителя',
};

/** Исход записи словами; без исхода — «не закончено». */
export function iskhodSlovami(z: Pick<ZadachaView, 'outcome'>): { text: string; ton: 'da' | 'net' | 'tiho' } {
  return ISKHOD[z.outcome ?? 'left'];
}

/** Задания, по которым в классе есть решённое, по порядку номеров экзамена. */
export function zadaniyaKlassa(karta: KlassView['karta'], vsegda: readonly number[] = []): number[] {
  const set = new Set<number>(vsegda);
  for (const k of karta) if (k.solved > 0) set.add(k.task_no);
  const poryadok = (n: number): number => {
    try {
      return nomerRazdela(n);
    } catch {
      return 100 + n;
    }
  };
  return [...set].sort((a, b) => poryadok(a) - poryadok(b));
}

/** Клетка тепловой карты: ученик × задание. */
export function kletka(
  karta: KlassView['karta'],
  userId: string,
  taskNo: number,
): { solved: number; right: number; active_ms: number } {
  return (
    karta.find((k) => k.id === userId && k.task_no === taskNo) ?? { solved: 0, right: 0, active_ms: 0 }
  );
}

const dataRu = (day: string): string => `${day.slice(8, 10)}.${day.slice(5, 7)}.${day.slice(0, 4)}`;
const minuty = (ms: number): number => Math.round(ms / 6000) / 10;

/** Excel по классу: строка на ученика, по два столбца на задание. */
export function klassXlsx(
  view: KlassView,
  zadaniya: readonly number[],
  from: string,
  to: string,
  today: string,
): { rows: Cell[][]; widths: number[] } {
  const head: Cell[] = ['Ученик', 'Последнее занятие', 'За 7 дней: задач', 'За 7 дней: минут', 'За 7 дней: дней'];
  for (const n of zadaniya) head.push(`${nomerZadaniya(n)}: решено`, `${nomerZadaniya(n)}: верно, %`);
  head.push('Не начатые ДЗ', `Период: ${dataRu(from)}–${dataRu(to)}`);
  const rows: Cell[][] = [head];
  for (const u of view.ucheniki) {
    const p = posledniyDen(u.last_day, u.s, today);
    const row: Cell[] = [
      u.name,
      u.last_day === undefined ? 'нет записей' : dataRu(u.last_day) + (p.davno ? ' (давно)' : ''),
      u.nedelya.solved,
      minuty(u.nedelya.active_ms),
      u.nedelya.dni,
    ];
    for (const n of zadaniya) {
      const k = kletka(view.karta, u.id, n);
      row.push(k.solved === 0 ? null : k.solved, tochnost(k.right, k.solved));
    }
    row.push((u.ne_nachal_dz ?? []).map((d) => d.title).join('; ') || null, null);
    rows.push(row);
  }
  return { rows, widths: [28, 18, 12, 12, 12, ...zadaniya.flatMap(() => [11, 11]), 30, 26] };
}

/** Excel по ученику: сводка по заданиям, варианты и лента задач. */
export function uchenikXlsx(
  view: UchenikView,
  lenta: readonly ZadachaView[],
  from: string,
  to: string,
): { rows: Cell[][]; widths: number[] } {
  const s = view.svodka;
  const rows: Cell[][] = [
    ['Ученик', view.name, `Период: ${dataRu(from)}–${dataRu(to)}`, null, null, null, null],
    ['Активное время, мин', minuty(s.active_ms), 'Решено', s.solved, 'Точность, %', tochnost(s.right, s.solved), null],
    [null, null, null, null, null, null, null],
    ['Задание', 'Решено', 'Верно', 'Точность, %', 'Активное время, мин', null, null],
    ...s.po_zadaniyam.map((z): Cell[] => [
      nomerZadaniya(z.task_no),
      z.solved,
      z.right,
      tochnost(z.right, z.solved),
      minuty(z.active_ms),
      null,
      null,
    ]),
    [null, null, null, null, null, null, null],
    ['Вариант', 'Дата', 'Первичный балл', 'Из', 'Тестовый балл', 'Активное время, мин', null],
    ...s.varianty.map((v): Cell[] => [
      v.title ?? ISTOCHNIK_VARIANTA[v.source],
      v.finished_at === undefined ? null : dataRu(denMsk(Date.parse(v.finished_at))),
      v.primary_score ?? null,
      v.max_score ?? null,
      v.test_score ?? null,
      minuty(v.active_ms),
      null,
    ]),
    [null, null, null, null, null, null, null],
    ['Когда', 'Задание', 'Тип', 'Где', 'Итог', 'Ответ', 'Активное время, с'],
    ...lenta.map((z): Cell[] => [
      new Date(Date.parse(z.started_at) + MSK_MS).toISOString().slice(0, 16).replace('T', ' '),
      nomerZadaniya(z.task_no),
      z.kind,
      MESTO[z.place] ?? z.place,
      iskhodSlovami(z).text,
      z.last_answer ?? null,
      Math.round(z.active_ms / 1000),
    ]),
  ];
  return { rows, widths: [22, 16, 18, 22, 20, 20, 18] };
}
