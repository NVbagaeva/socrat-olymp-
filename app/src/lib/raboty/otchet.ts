/**
 * Статистика учителя по выданной работе: средний балл и доля полных
 * баллов по каждому заданию, таблица для Excel. Считаются только
 * сданные работы; часть 2 — только проверенные.
 */

import { MAX_BALL, type EgeNo20 } from '@/content/variantOnline/bally';
import type { Cell } from './xlsx';
import type { SubStatus, WorkReport } from './types';

export interface ZadanieStat {
  no: number;
  max: number;
  /** Сколько оценок по заданию. */
  n: number;
  sredniy: number | null;
  /** Доля полного балла, 0…1. */
  polnyh: number | null;
  /** Доля нулей, 0…1. */
  nuley: number | null;
}

const NOS = Array.from({ length: 20 }, (_, i) => i + 1);

const sdana = (s: SubStatus | 'none') => s !== 'none' && s !== 'draft';

export function statistikaZadaniy(r: WorkReport): ZadanieStat[] {
  return NOS.map((no) => {
    const max = MAX_BALL[no as EgeNo20];
    const bally = r.rows
      .filter((row) => sdana(row.status) && (no <= 13 || row.status === 'checked'))
      .map((row) => row.bally[no])
      .filter((b): b is number => b !== null && b !== undefined);
    const n = bally.length;
    return {
      no,
      max,
      n,
      sredniy: n === 0 ? null : bally.reduce((s, b) => s + b, 0) / n,
      polnyh: n === 0 ? null : bally.filter((b) => b === max).length / n,
      nuley: n === 0 ? null : bally.filter((b) => b === 0).length / n,
    };
  });
}

const STATUS: Record<SubStatus | 'none', string> = {
  none: 'не начата',
  draft: 'не сдана',
  submitted: 'на проверке',
  checking: 'на проверке',
  checked: 'проверено',
  returned: 'на доработке',
};

/** Строки листа Excel: ученики × задания, итоги и средние по заданиям. */
export function tablitsaExcel(r: WorkReport): Cell[][] {
  const head: Cell[] = [
    'Ученик',
    'Статус',
    'Сдано',
    ...NOS.map((n) => `№${n}`),
    'Часть 1',
    'Часть 2',
    'Итого',
    'Тестовый (примерно)',
  ];
  const rows: Cell[][] = r.rows.map((row) => [
    row.student.name,
    STATUS[row.status],
    row.submittedAt === null ? null : row.submittedAt.slice(0, 16).replace('T', ' '),
    ...NOS.map((n) =>
      sdana(row.status) && (n <= 13 || row.status === 'checked') ? (row.bally[n] ?? null) : null,
    ),
    row.score?.part1 ?? null,
    row.status === 'checked' ? (row.score?.part2 ?? null) : null,
    row.status === 'checked' ? (row.score?.total ?? null) : null,
    row.score?.test ?? null,
  ]);
  const st = statistikaZadaniy(r);
  const round = (x: number | null, k = 100) => (x === null ? null : Math.round(x * k) / k);
  return [
    [`${r.work.title} — ${r.work.code}, версия ${r.work.versiya}`],
    head,
    ...rows,
    [],
    ['Средний балл', null, null, ...st.map((s) => round(s.sredniy))],
    ['Максимум', null, null, ...st.map((s) => s.max)],
    [
      'Полный балл, %',
      null,
      null,
      ...st.map((s) => round(s.polnyh === null ? null : s.polnyh * 100, 1)),
    ],
  ];
}
