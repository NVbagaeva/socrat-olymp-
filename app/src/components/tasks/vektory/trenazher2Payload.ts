import { isRecord } from '@/lib/trainerSession/restore';
import type { Task2 } from '@/lib/vektory/session';

/** Задания тренировки №2 в том виде, в каком они лежат в сессии. */
export interface Trenazher2Payload {
  tasks: Task2[];
  /** Контроль: без подсказок и решения до конца. */
  control: boolean;
}

function isTask(value: unknown): value is Task2 {
  return (
    isRecord(value) &&
    typeof value['id'] === 'string' &&
    typeof value['prototype'] === 'string' &&
    (value['gruppa'] === 'A' || value['gruppa'] === 'B' || value['gruppa'] === 'C') &&
    typeof value['questionHtml'] === 'string' &&
    (value['risunokSvg'] === null || typeof value['risunokSvg'] === 'string') &&
    typeof value['seal'] === 'string' &&
    typeof value['razbor'] === 'string'
  );
}

/** Проверка формата при чтении из хранилища: чужое и повреждённое отсекается. */
export function isTrenazher2Payload(value: unknown): value is Trenazher2Payload {
  return (
    isRecord(value) &&
    typeof value['control'] === 'boolean' &&
    Array.isArray(value['tasks']) &&
    value['tasks'].length > 0 &&
    value['tasks'].every(isTask)
  );
}
