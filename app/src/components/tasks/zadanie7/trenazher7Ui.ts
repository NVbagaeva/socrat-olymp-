import {
  asBool,
  asNumber,
  asNumberList,
  asNumberOrNull,
  asOneOf,
  asString,
  asStringRecord,
  isRecord,
} from '@/lib/trainerSession/restore';
import type { BaseUi } from '@/lib/trainerSession/types';

/**
 * Состояние экрана задачи №7, как оно хранится в сессии.
 *
 * Кроме общих полей (номер, отметки, раскладка) — всё, что ученик успел
 * сделать на текущей задаче: ответ, его проверка, открытые подсказка и
 * решение, пройденные вопросы подсказки, замены «Похожая задача».
 * Решение не хранится: его строит решатель по параметрам задачи.
 */
export interface Trenazher7Ui extends BaseUi {
  value: string;
  checked: 'right' | 'wrong' | null;
  /** Открыто ли решение у текущей задачи. */
  solutionOpen: boolean;
  /** Открыта ли подсказка у текущей задачи. */
  hintOpen: boolean;
  /** Сколько вопросов подсказки открыто (с единицы). */
  shag: number;
  /** Неверные кнопки текущего вопроса подсказки. */
  mimo: number[];
  misses: number;
  /** Была ли ошибка в текущей задаче. */
  failed: boolean;
  /** Когда начата текущая задача, мс активного времени. */
  taskFrom: number | null;
  /** «Похожая задача»: номер в тренировке → ключ другой задачи того же прототипа. */
  pohozhie: Record<string, string>;
}

/**
 * Достать из сохранённого состояния поля экрана; что не прочиталось —
 * по умолчанию. Понимает и запись прежнего экрана (до редизайна):
 * `oshibalsya` → была ошибка, `razborOtkryt` → открыто решение.
 */
export function readTrenazher7Ui(base: BaseUi): Trenazher7Ui {
  const raw: Record<string, unknown> = isRecord(base) ? base : {};
  const misses = raw['misses'];
  return {
    ...base,
    value: asString(raw['value']),
    checked: asOneOf(raw['checked'], ['right', 'wrong'] as const),
    solutionOpen: asBool(raw['solutionOpen']) || asBool(raw['razborOtkryt']),
    hintOpen: asBool(raw['hintOpen']),
    shag: Math.max(1, asNumber(raw['shag'], 1)),
    mimo: asNumberList(raw['mimo']),
    misses: typeof misses === 'number' && Number.isInteger(misses) && misses >= 0 ? misses : 0,
    failed: asBool(raw['failed']) || asBool(raw['oshibalsya']),
    taskFrom: asNumberOrNull(raw['taskFrom']),
    pohozhie: asStringRecord(raw['pohozhie']),
  };
}
