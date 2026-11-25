/**
 * Задача общего тренажёра по банку в журнале решения задач (этап 4б,
 * docs/kabinet-zhurnal.md): №1, 2, 7, 9, 10, 11, 12, 13, 21. Задача —
 * из файла прототипа, id — ключ задачи банка: по нему учитель видит ту же
 * задачу. Раздел базы («baza-…») не пишется: у него нет номера.
 */

import { idIz, otpechatokUsloviya, type Mesto, type NovayaZadacha } from '@/lib/zhurnal/model';
import { urovenZadachi } from '@/lib/zhurnal/uroven';

export interface ZadachaBankaDlya {
  /** Ключ задачи банка. */
  id: string;
  /** Прототип (тип) задачи. */
  p: string;
  /** Условие: текст с $…$. */
  text: string;
}

export function zhurnalBanka(
  razdel: string,
  z: ZadachaBankaDlya,
  place: Mesto,
  placeRef: string,
  klyuch: string,
  risunok?: string,
): NovayaZadacha | null {
  const taskNo = /^[0-9]{1,2}$/.test(razdel) ? Number(razdel) : NaN;
  if (!Number.isInteger(taskNo) || taskNo < 1) return null;
  return {
    id: idIz(`${taskNo}|${place}|${placeRef}|${klyuch}|${z.id}`),
    task_no: taskNo,
    kind: z.p,
    task_ref: z.id,
    place,
    place_ref: placeRef,
    level: urovenZadachi(taskNo),
    gen_hash: otpechatokUsloviya(z.text),
    ...(z.text.length <= 2000 ? { uslovie_tex: z.text } : {}),
    /* Картинка — только файл сайта; чертежи движка в запись не идут. */
    ...(risunok !== undefined && risunok.startsWith('/') ? { risunok } : {}),
  };
}
