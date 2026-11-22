/**
 * Флаги кабинета, версия 2 (docs/plans/cabinet-v2.md, раздел 2).
 *
 * Значения ставятся при сборке (next.config.ts → env): всегда «1» или
 * «0», поэтому условие вычисляется на сборке и выключенная ветка в
 * сборку не попадает. Все флаги требуют включённого входа.
 */

/** Журнал решения задач и статистика ученика. */
export const ZHURNAL_ON = process.env.KAB2_ZHURNAL === '1';

/** Разделы (номера хранения), где кабинет-2 включён: «5,8» или «all». */
const RAZDELY = process.env.KAB2_RAZDELY ?? '';

export function razdelVklyuchen(taskNo: number): boolean {
  if (RAZDELY === 'all') {
    return true;
  }
  return RAZDELY.split(',').includes(String(taskNo));
}
