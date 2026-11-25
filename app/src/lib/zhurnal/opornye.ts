/**
 * Опорная задача своего экрана раздела в журнале решения задач (этап 4г,
 * docs/kabinet-zhurnal.md): №1, 2, 9, 11, 13. Задача — «микрозадача@seed»:
 * по ним собирается та же задача (и после «Ещё вариант»). Тип — блок.
 */

import { idIz, otpechatokUsloviya, type NovayaZadacha } from './model';
import { urovenZadachi } from './uroven';

export function zhurnalOpornoy(
  taskNo: number,
  blok: string,
  no: number,
  z: { id: string; seed: string; uslovieHtml: string },
): NovayaZadacha {
  const ref = `${z.id}@${z.seed}`;
  return {
    id: idIz(`${taskNo}|opornye|${blok}|${no}|${ref}`),
    task_no: taskNo,
    kind: blok,
    task_ref: ref,
    place: 'opornye',
    place_ref: blok,
    level: urovenZadachi(taskNo),
    gen_hash: otpechatokUsloviya(z.uslovieHtml),
    ...(z.uslovieHtml.length <= 2000 ? { uslovie_tex: z.uslovieHtml } : {}),
  };
}
