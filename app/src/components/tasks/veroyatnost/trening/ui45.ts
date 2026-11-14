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
 * Состояние экрана тренажёра №4 и №5 («Стеклянная сцена»), как оно
 * хранится в сессии: всё, что ученик успел на текущей задаче, — ответ,
 * его проверка, открытые подсказка и решение, пройденные вопросы
 * подсказки, выбор метода в «Узнай метод», замены «Похожая задача».
 */
export interface Ui45 extends BaseUi {
  value: string;
  checked: 'right' | 'wrong' | null;
  solutionOpen: boolean;
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
  /** «Узнай метод»: что нажато на текущей задаче. */
  vybor: string | null;
  /** «Похожая задача»: номер в тренировке → ключ «прототип:вариант» другой задачи. */
  pohozhie: Record<string, string>;
}

/**
 * Достать из сохранённого состояния поля экрана; что не прочиталось —
 * по умолчанию. Понимает и запись прежнего экрана №4 и №5 (до
 * редизайна): карточка задачи `card` — введённый ответ, чем кончилась
 * проверка, открыто ли решение; `vybor` «Узнай метод» — как был.
 */
export function readUi45(base: BaseUi): Ui45 {
  const raw: Record<string, unknown> = isRecord(base) ? base : {};
  const card = isRecord(raw['card']) ? raw['card'] : null;
  const misses = raw['misses'];
  const itog = card === null ? null : asOneOf(card['itog'], ['correct', 'incorrect'] as const);
  const prezhniyChecked = itog === 'correct' ? 'right' : itog === 'incorrect' ? 'wrong' : null;
  return {
    ...base,
    value: asString(raw['value'] ?? card?.['value']),
    checked: asOneOf(raw['checked'], ['right', 'wrong'] as const) ?? prezhniyChecked,
    solutionOpen: asBool(raw['solutionOpen']) || card?.['state'] === 'revealed',
    hintOpen: asBool(raw['hintOpen']),
    shag: Math.max(1, asNumber(raw['shag'], 1)),
    mimo: asNumberList(raw['mimo']),
    misses: typeof misses === 'number' && Number.isInteger(misses) && misses >= 0 ? misses : 0,
    failed: asBool(raw['failed']) || itog === 'incorrect',
    taskFrom: asNumberOrNull(raw['taskFrom']),
    vybor: typeof raw['vybor'] === 'string' ? raw['vybor'] : null,
    pohozhie: asStringRecord(raw['pohozhie']),
  };
}
