/**
 * Флаги журнала решения задач и экранов прогресса (docs/kabinet-zhurnal.md).
 *
 * Значения считает next.config.ts из Variables репозитория:
 *
 *   NEXT_PUBLIC_ZHURNAL           «1» — браузер ученика пишет журнал на
 *                                 сервер (только при включённом входе);
 *   NEXT_PUBLIC_ZHURNAL_RAZDELY   номера хранения разделов через запятую,
 *                                 по умолчанию «5,8»;
 *   NEXT_PUBLIC_PROGRESS_UCHITEL  «1» — экраны прогресса у учителя;
 *   NEXT_PUBLIC_PROGRESS_UCHENIK  «1» — «Моя статистика» у ученика.
 *
 * База держит свой флаг (kabinet_flags) и примет запись, только если он
 * включён: сборка со старым флагом в выключенный журнал не запишет.
 */

import { vEkzamene } from '@/content/struktura';

export const ZHURNAL_ON = process.env.ZHURNAL_ON === '1';
export const PROGRESS_UCHITEL_ON = process.env.PROGRESS_UCHITEL_ON === '1';
export const PROGRESS_UCHENIK_ON = process.env.PROGRESS_UCHENIK_ON === '1';

/**
 * Разделы журнала из строки флага: только существующие и только те, что
 * есть в действующей структуре экзамена. №6 вне ЕГЭ-2027 и не пишется
 * никогда — это же проверяет база.
 */
export function razdelyIz(value: string): readonly number[] {
  const out: number[] = [];
  for (const part of value.split(',')) {
    const n = Number(part.trim());
    if (!Number.isInteger(n) || n < 1 || n === 6 || out.includes(n)) continue;
    try {
      if (!vEkzamene(n)) continue;
    } catch {
      continue;
    }
    out.push(n);
  }
  return out;
}

export const ZHURNAL_RAZDELY: readonly number[] = razdelyIz(process.env.ZHURNAL_RAZDELY ?? '5,8');

/** Раздел пишется в журнал на этой сборке. */
export function zhurnalRazdel(taskNo: number): boolean {
  return ZHURNAL_ON && ZHURNAL_RAZDELY.includes(taskNo);
}
