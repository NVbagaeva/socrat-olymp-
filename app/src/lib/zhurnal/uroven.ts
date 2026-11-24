/**
 * Сложность задачи для журнала и ДЗ (решение В-7, docs/kabinet-zhurnal.md):
 * от неё зависит пометка «очень быстро» — только у повышенной и высокой.
 *
 * Одно место на все разделы (этап 4). По спецификации профильного ЕГЭ:
 *   — первая часть — базовый уровень (1);
 *   — вторая часть, задания 13–17 — повышенный (2);
 *   — 18 и 19 — высокий (3).
 * Исключения, принятые раньше (этап 1): №5 «сложная вероятность» —
 * повышенная; у №8 задача уровня «повышенный» тренажёра — повышенная.
 */

import { chastRazdela, nomerEge } from '@/content/struktura';

export type Uroven = 1 | 2 | 3;

/** Первое задание второй части, которое уже «высокого» уровня. */
const VYSOKIY_S = 18;

export function urovenZadachi(taskNo: number, povyshennyyTip = false): Uroven {
  if (taskNo === 5) return 2;
  if (taskNo === 8 && povyshennyyTip) return 2;
  let nomer: number | null;
  let chast: 1 | 2;
  try {
    nomer = nomerEge(taskNo);
    chast = chastRazdela(taskNo);
  } catch {
    return 1;
  }
  if (chast === 1) return 1;
  return nomer !== null && nomer >= VYSOKIY_S ? 3 : 2;
}
