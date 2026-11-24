/**
 * №4 и №5 в журнале решения задач (docs/kabinet-zhurnal.md). Задачи —
 * из банка, id «прототип:вариант»: по нему учитель видит ту же задачу.
 * Пишется только раздел из флага журнала.
 */

import { idIz, otpechatokUsloviya, type Mesto, type NovayaZadacha } from '@/lib/zhurnal/model';
import { urovenZadachi } from '@/lib/zhurnal/uroven';
import type { Zadanie45 } from './links';

export interface Zadacha45Dlya {
  id: string;
  kind: string;
  uslovie: string;
  illustration?: { path: string };
  model?: { illustration?: { path: string } };
}

function risunokIz(z: Zadacha45Dlya): string | undefined {
  return z.illustration?.path ?? z.model?.illustration?.path;
}

export function zhurnal45(
  zadanie: Zadanie45,
  z: Zadacha45Dlya,
  place: Mesto,
  placeRef: string,
  klyuch: string,
): NovayaZadacha {
  return {
    id: idIz(`${zadanie}|${place}|${placeRef}|${klyuch}|${z.id}`),
    task_no: zadanie,
    kind: z.kind,
    task_ref: z.id,
    place,
    place_ref: placeRef,
    /* №5 — повышенная, №4 — базовая (решение В-7, lib/zhurnal/uroven.ts). */
    level: urovenZadachi(zadanie),
    gen_hash: otpechatokUsloviya(z.uslovie),
    ...(z.uslovie.length <= 2000 ? { uslovie_tex: z.uslovie } : {}),
    ...(risunokIz(z) === undefined ? {} : { risunok: risunokIz(z) }),
  };
}
