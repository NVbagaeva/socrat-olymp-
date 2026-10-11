import {
  asNumberOrNull,
  asOneOf,
  asString,
  isRecord,
} from '@/lib/trainerSession/restore';
import type { BaseUi } from '@/lib/trainerSession/types';
import type { CardState, ProblemCardSnapshot } from '../card';

const STATES: readonly CardState[] = ['before', 'correct', 'incorrect', 'revealed'];

/**
 * Состояние экрана заданий №4 и №5, как оно хранится в сессии.
 *
 * Кроме общих полей — всё, что ученик успел сделать на текущем
 * задании: состояние карточки (ответ, проверка, шаг решения) и выбор
 * метода в «Узнай метод». Порядок заданий — сам подход в payload, так
 * что order всегда null. Открытый разбор не хранится: карточка
 * открывает его заново из запечатанных данных.
 */
export interface SessiyaUi extends BaseUi {
  card: ProblemCardSnapshot;
  /** «Узнай метод»: что нажал ученик на текущем задании. */
  vybor: string | null;
  /** Когда начато текущее задание, мс активного времени. */
  taskFrom: number | null;
}

export const PUSTAYA_KARTOCHKA: ProblemCardSnapshot = {
  value: '',
  state: 'before',
  itog: null,
  shagov: 0,
};

/** Достать из сохранённого состояния поля экрана; что не прочиталось — по умолчанию. */
export function readSessiyaUi(base: BaseUi): SessiyaUi {
  const raw: Record<string, unknown> = isRecord(base) ? base : {};
  const card = isRecord(raw['card']) ? raw['card'] : {};
  const shagov = asNumberOrNull(card['shagov']);
  return {
    ...base,
    card: {
      value: asString(card['value']),
      state: asOneOf(card['state'], STATES) ?? 'before',
      itog: asOneOf(card['itog'], ['correct', 'incorrect'] as const),
      shagov: shagov !== null && Number.isInteger(shagov) && shagov >= 0 ? shagov : 0,
    },
    vybor: typeof raw['vybor'] === 'string' ? raw['vybor'] : null,
    taskFrom: asNumberOrNull(raw['taskFrom']),
  };
}
