/**
 * Данные задания №11 для «Собрать вариант» (серверная часть,
 * маршрут /variant/dannye/z11.json): условия банка и аналогов **без
 * ответов** — тот же список, что тренажёр и лист №11 получают от
 * сервера (`dannyeTrenazhera().bank`, поле answer туда не переносится).
 * Ответ и разбор браузер считает движком подтипа по параметрам.
 * Разминка (РЗ) в вариант ЕГЭ не входит — её задачи сюда не идут.
 */

import { dannyeTrenazhera } from '@/lib/zadanie11/trenazher/dannye';
import type { UslovieBanka } from '@/lib/zadanie11/trenazher/sessiya';

export function dannye(): UslovieBanka[] {
  return dannyeTrenazhera().bank.filter((b) => !b.razminka && !b.id.startsWith('RZ-'));
}
