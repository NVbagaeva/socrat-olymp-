/**
 * №8 в журнале решения задач (docs/kabinet-zhurnal.md): что записать о
 * задаче и как учителю собрать её заново — те же числа по тому же id.
 */

import { otpechatokUsloviya, idIz, type Mesto, type NovayaZadacha } from '@/lib/zhurnal/model';
import { generate } from './generate';
import { parseTaskId } from './ids';

/** Номер хранения раздела. */
export const TASK_NO_8 = 8;

/** Условие (TeX) и ответ задачи по id; null — id не читается или генератор не справился. */
export function sobrat8(taskRef: string): { uslovie: string; otvet: string; advanced: boolean } | null {
  const parsed = parseTaskId(taskRef);
  if (parsed === null) return null;
  try {
    const task = generate(parsed.prototype, parsed.seed, parsed.level);
    return { uslovie: task.uslovie, otvet: String(task.otvet), advanced: task.level === 'advanced' };
  } catch {
    return null;
  }
}

/**
 * Задача №8 для журнала. klyuch — место задачи в тренировке или блоке:
 * та же задача на том же месте после перезагрузки — та же запись.
 */
export function zhurnal8(taskRef: string, kind: string, place: Mesto, placeRef: string, klyuch: string): NovayaZadacha {
  const sobrana = sobrat8(taskRef);
  return {
    id: idIz(`${TASK_NO_8}|${place}|${placeRef}|${klyuch}|${taskRef}`),
    task_no: TASK_NO_8,
    kind,
    task_ref: taskRef,
    place,
    place_ref: placeRef,
    /* Повышенный уровень генератора №8 — повышенная сложность (решение В-7). */
    level: sobrana?.advanced === true ? 2 : 1,
    ...(sobrana === null
      ? {}
      : { gen_hash: otpechatokUsloviya(sobrana.uslovie), uslovie_tex: sobrana.uslovie }),
  };
}
