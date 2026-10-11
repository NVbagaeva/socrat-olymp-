import { isRecord } from '@/lib/trainerSession/restore';
import type { Task8 } from '@/lib/vychisleniya/session';

/** Задания тренировки №8 в том виде, в каком они лежат в сессии. */
export interface Trenazher8Payload {
  tasks: Task8[];
  /** Контроль: без решения и подсказок до конца. */
  control: boolean;
}

function isTask(value: unknown): value is Task8 {
  return (
    isRecord(value) &&
    typeof value['id'] === 'string' &&
    typeof value['prototype'] === 'string' &&
    typeof value['skill'] === 'string' &&
    (value['level'] === 'base' || value['level'] === 'advanced') &&
    typeof value['questionHtml'] === 'string' &&
    typeof value['seal'] === 'string' &&
    typeof value['razbor'] === 'string'
  );
}

/** Проверка формата при чтении из хранилища: чужое и повреждённое отсекается. */
export function isTrenazher8Payload(value: unknown): value is Trenazher8Payload {
  return (
    isRecord(value) &&
    typeof value['control'] === 'boolean' &&
    Array.isArray(value['tasks']) &&
    value['tasks'].length > 0 &&
    value['tasks'].every(isTask)
  );
}
