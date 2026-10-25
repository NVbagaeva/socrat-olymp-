/**
 * Сессия тренажёра с фильтрами: что лежит в хранилище.
 *
 * Задания хранятся ключами шаблонов и seed тренировки, а не готовыми:
 * условие, чертёж и разбор раздел собирает заново тем же движком
 * (lib/trainerSession/ и TrainerSessionHost пишут запись как есть —
 * она и так маленькая). Состояние экрана — общие поля сессии (BaseUi)
 * плюс состояние каждой задачи: к любой задаче можно вернуться по
 * ленте номеров, и всё введённое на месте.
 */

import { asNumberOrNull, isRecord } from '@/lib/trainerSession/restore';
import type { BaseUi } from '@/lib/trainerSession/types';
import type { Rezhim } from './types';

/** Задание тренировки: ключ шаблона; seed — свой, если задан (перенесённая тренировка). */
export interface ZadachaItem {
  k: string;
  /** Seed задания целиком. Нет — от seed тренировки и номера похожей. */
  seed?: string;
}

export interface TrenPayload {
  v: 1;
  /** Фильтр тренировки в виде ссылки (vSsylku): для строки-сводки. */
  filtr: string;
  rezhim: Rezhim;
  /** Seed тренировки: новый на каждый запуск. */
  seed: string;
  items: ZadachaItem[];
}

function isItem(value: unknown): value is ZadachaItem {
  return (
    isRecord(value) &&
    typeof value['k'] === 'string' &&
    (value['seed'] === undefined || typeof value['seed'] === 'string')
  );
}

export function isTrenPayload(value: unknown): value is TrenPayload {
  return (
    isRecord(value) &&
    value['v'] === 1 &&
    typeof value['filtr'] === 'string' &&
    (value['rezhim'] === 'podskazki' ||
      value['rezhim'] === 'bez' ||
      value['rezhim'] === 'vremya') &&
    typeof value['seed'] === 'string' &&
    Array.isArray(value['items']) &&
    value['items'].length > 0 &&
    value['items'].every(isItem)
  );
}

/**
 * Основа seed задания: своя у задания (перенесённая тренировка,
 * «Прорешать те же задачи») или от seed тренировки и места; «Похожая
 * задача» добавляет свой номер.
 */
export function osnovaSeed(payload: TrenPayload, at: number, pohozhaya: number): string {
  const base = payload.items[at]?.seed ?? `${payload.seed}:${at}`;
  return pohozhaya === 0 ? base : `${base}:p${pohozhaya}`;
}

/** Seed попытки собрать задание: первая — сама основа, дальше — с номером. */
export function seedZadaniya(payload: TrenPayload, at: number, pohozhaya: number) {
  const base = osnovaSeed(payload, at, pohozhaya);
  return (attempt: number): string => (attempt === 0 ? base : `${base}:${attempt}`);
}

/** Чем кончилось задание. null — ещё не закрыто. */
export type Itog = 'right' | 'wrong' | 'hinted' | 'skipped';

/** Состояние одной задачи. */
export interface ZadachaSost {
  /** Введённый ответ. */
  v: string;
  /** Неверных попыток. */
  oshibok: number;
  /** Результат последней проверки. */
  proverka: 'right' | 'wrong' | null;
  itog: Itog | null;
  /** Открыта подсказка по шагам. */
  podskazka: boolean;
  /** Что ученик сделал в подсказке — его знает карточка раздела. */
  shagi: Record<string, unknown>;
  /** Разбор открыт. */
  razbor: boolean;
  /** Сколько раз брали «Похожую задачу»: от этого числа seed задания. */
  pohozhaya: number;
  /** Секунд на задачу. */
  sek: number;
}

export const NOVAYA: ZadachaSost = {
  v: '',
  oshibok: 0,
  proverka: null,
  itog: null,
  podskazka: false,
  shagi: {},
  razbor: false,
  pohozhaya: 0,
  sek: 0,
};

export interface TrenUi extends BaseUi {
  z: Record<number, ZadachaSost>;
  /** Когда открыта текущая задача, мс активного времени. */
  s: number | null;
}

function count(value: unknown): number {
  return typeof value === 'number' && Number.isFinite(value) && value >= 0 ? value : 0;
}

function readSost(raw: unknown): ZadachaSost {
  if (!isRecord(raw)) return NOVAYA;
  const itog = raw['itog'];
  const proverka = raw['proverka'];
  return {
    v: typeof raw['v'] === 'string' ? raw['v'] : '',
    oshibok: Math.floor(count(raw['oshibok'])),
    proverka: proverka === 'right' || proverka === 'wrong' ? proverka : null,
    itog:
      itog === 'right' || itog === 'wrong' || itog === 'hinted' || itog === 'skipped' ? itog : null,
    podskazka: raw['podskazka'] === true,
    shagi: isRecord(raw['shagi']) ? raw['shagi'] : {},
    razbor: raw['razbor'] === true,
    pohozhaya: Math.floor(count(raw['pohozhaya'])),
    sek: count(raw['sek']),
  };
}

/**
 * Прочитать состояние экрана. Тренировка, начатая прежним экраном
 * (до фильтров), приходит без поля z: тогда закрытые задачи берутся из
 * общих отметок — верно, с подсказкой, с ошибкой.
 */
export function readTrenUi(base: BaseUi): TrenUi {
  const raw: Record<string, unknown> = isRecord(base) ? base : {};
  const z: Record<number, ZadachaSost> = {};
  if (isRecord(raw['z'])) {
    for (const [at, sost] of Object.entries(raw['z'])) {
      const i = Number(at);
      if (Number.isInteger(i) && i >= 0) z[i] = readSost(sost);
    }
  } else {
    for (const [at, mark] of Object.entries(base.marks)) {
      z[Number(at)] = { ...NOVAYA, itog: mark === 'right' ? 'right' : 'hinted' };
    }
    for (const at of Object.keys(base.tried)) {
      const i = Number(at);
      const was = z[i] ?? NOVAYA;
      z[i] = { ...was, oshibok: Math.max(1, was.oshibok) };
    }
  }
  return { ...base, z, s: asNumberOrNull(raw['s']) };
}

/** Статус задачи на ленте номеров. */
export type Status = 'new' | 'right' | 'wrong' | 'hinted' | 'skipped' | 'open';

export function statusZadachi(s: ZadachaSost | undefined): Status {
  if (s === undefined) return 'new';
  if (s.itog !== null) return s.itog;
  return s.v !== '' || s.oshibok > 0 || s.podskazka ? 'open' : 'new';
}

/** Общие отметки сессии из состояний задач: для панели и итогов. */
export function otmetki(z: Record<number, ZadachaSost>): Pick<BaseUi, 'marks' | 'tried'> {
  const marks: BaseUi['marks'] = {};
  const tried: BaseUi['tried'] = {};
  for (const [at, s] of Object.entries(z)) {
    const i = Number(at);
    if (s.itog === 'right') marks[i] = 'right';
    if (s.itog === 'hinted') marks[i] = 'hinted';
    if (s.oshibok > 0 || s.itog === 'wrong') tried[i] = true;
  }
  return { marks, tried };
}
