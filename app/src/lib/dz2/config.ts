/**
 * Флаги новой выдачи ДЗ (docs/kabinet-dz2.md). Значения считает
 * next.config.ts из Variables репозитория:
 *
 *   NEXT_PUBLIC_DZ2          «1» — кнопки «В домашку», мастер выдачи,
 *                            «Мои домашки» (только при включённом входе);
 *   NEXT_PUBLIC_DZ2_RAZDELY  номера хранения разделов, по умолчанию «5,8».
 *
 * База держит свой флаг (kabinet_flags.dz_novye) и откажет, если он
 * выключен.
 */

import { razdelyIz } from '@/lib/zhurnal/config';

export const DZ2_ON = process.env.DZ2_ON === '1';
export const DZ2_RAZDELY: readonly number[] = razdelyIz(process.env.DZ2_RAZDELY ?? '5,8');

export function dz2Razdel(taskNo: number): boolean {
  return DZ2_ON && DZ2_RAZDELY.includes(taskNo);
}
