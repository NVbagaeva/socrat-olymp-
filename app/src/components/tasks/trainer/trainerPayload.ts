import { isRecord } from '@/lib/trainerSession/restore';
import type { TrainerTask } from '@/lib/trainer';
import type { TaskRecipe } from '@/lib/trainerSession';

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

/**
 * Тренировка в хранилище: рецепты заданий вместо готовых. Готовое
 * задание с чертежом и разбором весит десятки килобайт (двадцать
 * заданий параболы — полтора мегабайта), рецепт — меньше сотни байт.
 */
export interface TrainerRecipe {
  recipe: 1;
  control: boolean;
  tasks: TaskRecipe[];
}

function recipeOf(task: TrainerTask): TaskRecipe | null {
  const origin: unknown = task.origin;
  return isRecord(origin) && typeof origin['seed'] === 'string' && typeof origin['sig'] === 'string'
    ? { set: task.kind, seed: origin['seed'], id: task.id, sig: origin['sig'] }
    : null;
}

/**
 * Упаковать тренировку для записи. Задание без рецепта (собрано не
 * сессией) — тогда тренировка пишется как есть: восстановить её по
 * рецептам всё равно нельзя.
 */
export function packTrainer(payload: TrainerPayload): TrainerRecipe | TrainerPayload {
  const tasks: TaskRecipe[] = [];
  for (const task of payload.tasks) {
    const recipe = recipeOf(task);
    if (recipe === null) {
      return payload;
    }
    tasks.push(recipe);
  }
  return { recipe: 1, control: payload.control, tasks };
}

/** Рецепты заданий из тренировки: для «Похожих задач». null — рецепта нет. */
export function recipesOf(payload: TrainerPayload, indexes: number[]): TaskRecipe[] | null {
  const out: TaskRecipe[] = [];
  for (const at of indexes) {
    const task = payload.tasks[at];
    const recipe = task === undefined ? null : recipeOf(task);
    if (recipe === null) {
      return null;
    }
    out.push(recipe);
  }
  return out;
}

function isRecipe(value: unknown): value is TaskRecipe {
  return (
    isRecord(value) &&
    typeof value['set'] === 'string' &&
    typeof value['seed'] === 'string' &&
    typeof value['id'] === 'string' &&
    typeof value['sig'] === 'string'
  );
}

/** Прочитать упакованную тренировку. null — это не рецепт или он повреждён. */
export function readTrainerRecipe(value: unknown): TrainerRecipe | null {
  return isRecord(value) &&
    value['recipe'] === 1 &&
    typeof value['control'] === 'boolean' &&
    Array.isArray(value['tasks']) &&
    value['tasks'].length > 0 &&
    value['tasks'].every(isRecipe)
    ? { recipe: 1, control: value['control'], tasks: value['tasks'] }
    : null;
}
