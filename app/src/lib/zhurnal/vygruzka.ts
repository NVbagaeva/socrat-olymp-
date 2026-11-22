/**
 * Выгрузка прогресса в Excel: строки таблиц ученика и класса. Чистые
 * функции; файл собирает lib/xlsx.ts. Пометок «очень быстро» в выгрузке
 * нет: это сигнал на экране, а не оценка.
 */

import { PROGRESS } from '@/content/progressUchitel';
import type { Cell } from '@/lib/xlsx';
import type { KlassView, ZadachaView } from './api';
import { ISKHODY, MESTA, dataRu, podpisRazdela } from './vid';

export function strokiUchenika(lenta: readonly ZadachaView[]): Cell[][] {
  return [
    [...PROGRESS.excel.uchenik],
    ...lenta.map((z) => [
      dataRu(z.started_at, true),
      podpisRazdela(z.task_no),
      z.kind,
      MESTA[z.place] ?? z.place,
      z.outcome === undefined ? PROGRESS.uchenik.nePrisvoeno : (ISKHODY[z.outcome] ?? z.outcome),
      z.last_answer ?? '',
      z.answer_key ?? '',
      z.attempts_n,
      z.hint_steps,
      z.shown_solution ? 'да' : 'нет',
      Math.round(z.active_ms / 1000),
      Math.round(z.total_ms / 1000),
    ]),
  ];
}

export function strokiKlassa(k: KlassView): Cell[][] {
  const imya = new Map(k.ucheniki.map((u) => [u.id, u.name]));
  const rows = [...k.karta].sort(
    (a, b) => (imya.get(a.id) ?? '').localeCompare(imya.get(b.id) ?? '', 'ru') || a.task_no - b.task_no,
  );
  return [
    [...PROGRESS.excel.klass],
    ...rows.map((c) => [
      imya.get(c.id) ?? '',
      podpisRazdela(c.task_no),
      c.solved,
      c.right,
      c.solved === 0 ? null : Math.round((100 * c.right) / c.solved),
      Math.round(c.active_ms / 60000),
    ]),
  ];
}

/** Имя файла без знаков, которые не любят файловые системы. */
export function imyaFayla(chto: string, from: string, to: string): string {
  const chisto = chto.replace(/[\\/:*?"<>|]+/g, ' ').replace(/\s+/g, ' ').trim().slice(0, 60);
  return `${chisto} ${from}—${to}.xlsx`;
}
