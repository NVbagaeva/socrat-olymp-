/**
 * Якорь цены «До ЕГЭ»: сколько вышло бы, если платить за 30 дней до
 * конца того же срока. Только подача — цены и правила берутся из
 * config.ts и здесь не меняются. Арифметика видна человеку целиком
 * («8 × 390 ₽»), поэтому «выгоднее» здесь — факт, а не обещание.
 */

import { DO_EGE, PERIOD_DNEY, PLATNYE, segodnya, tsenaDoEge, type Rol } from './config';

export interface Yakor {
  /** Сколько оплат по 30 дней покрывают срок «До ЕГЭ». */
  oplat: number;
  /** Цена одной оплаты за 30 дней, ₽. */
  tsena30: number;
  /** Сумма помесячных оплат, ₽. */
  pomesyachno: number;
  /** Насколько «До ЕГЭ» дешевле, ₽. */
  vygoda: number;
}

const DEN_MS = 86_400_000;

/** null — срок «До ЕГЭ» не продаётся или помесячно не дороже. */
export function yakorDoEge(rol: Rol, data: string = segodnya()): Yakor | null {
  const ege = tsenaDoEge(rol, data);
  if (ege === null) return null;
  const dney = (Date.parse(`${DO_EGE.data}T00:00:00Z`) - Date.parse(`${data}T00:00:00Z`)) / DEN_MS;
  const oplat = Math.max(1, Math.ceil(dney / PERIOD_DNEY));
  const tsena30 = PLATNYE[rol].tsena30;
  const pomesyachno = tsena30 * oplat;
  if (pomesyachno <= ege) return null;
  return { oplat, tsena30, pomesyachno, vygoda: pomesyachno - ege };
}
