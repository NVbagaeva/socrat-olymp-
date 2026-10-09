import { isRecord } from '@/lib/trainerSession/restore';
import type { TrainerTask } from '@/lib/trainer';

/** Задания тренировки №12 в том виде, в каком они лежат в сессии. */
export interface TrainerPayload {
  tasks: TrainerTask[];
  /** Контроль: без подсказок и разбора до конца. */
  control: boolean;
}

function isTask(value: unknown): value is TrainerTask {
  return (
    isRecord(value) &&
    typeof value['id'] === 'string' &&
    typeof value['kind'] === 'string' &&
    typeof value['questionHtml'] === 'string' &&
    (value['chartSvg'] === null || typeof value['chartSvg'] === 'string') &&
    typeof value['answer'] === 'string' &&
    typeof value['wrongHint'] === 'string' &&
    typeof value['rightHint'] === 'string' &&
    Array.isArray(value['steps']) &&
    (value['options'] === null || Array.isArray(value['options'])) &&
    isRecord(value['oshibki']) &&
    (value['solution'] === null || Array.isArray(value['solution'])) &&
    (value['method'] === null || isRecord(value['method']))
  );
}

/** Проверка формата при чтении из хранилища: чужое и повреждённое отсекается. */
export function isTrainerPayload(value: unknown): value is TrainerPayload {
  return (
    isRecord(value) &&
    typeof value['control'] === 'boolean' &&
    Array.isArray(value['tasks']) &&
    value['tasks'].length > 0 &&
    value['tasks'].every(isTask)
  );
}
