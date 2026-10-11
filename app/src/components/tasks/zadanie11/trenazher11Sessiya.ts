import {
  asBool,
  asNumberOrNull,
  asOneOf,
  asString,
  isRecord,
} from '@/lib/trainerSession/restore';
import type { BaseUi } from '@/lib/trainerSession/types';
import type { Zadacha11 } from '@/lib/zadanie11/trenazher/zadacha';

/**
 * Тренировка №11 в сессии: собранные задачи целиком и состояние экрана.
 *
 * Задачи (Zadacha11) — только строки и числа: условие уже набрано
 * KaTeX, подсказки и разбор лежат закрытыми отпечатком. Поэтому
 * сохраняются они как есть, и вернувшийся ученик видит те же задачи.
 */
export interface Trenazher11Payload {
  zadachi: Zadacha11[];
  /** Выбор «с подсказками» на момент старта. */
  podskazki: boolean;
}

const RAZDELY = ['RZ', 'PR', 'SM', 'DP', 'PT', 'VD', 'OK', 'RB', 'PG'];
const VIDY = ['bank', 'razminka', 'analog', 'new'];

function isStringList(value: unknown): value is string[] {
  return Array.isArray(value) && value.every((item) => typeof item === 'string');
}

function isVybor(value: unknown): boolean {
  return isRecord(value) && typeof value['number'] === 'string' && typeof value['label'] === 'string';
}

function isZadacha(value: unknown): value is Zadacha11 {
  return (
    isRecord(value) &&
    typeof value['key'] === 'string' &&
    typeof value['id'] === 'string' &&
    typeof value['vid'] === 'string' &&
    VIDY.includes(value['vid']) &&
    typeof value['section'] === 'string' &&
    RAZDELY.includes(value['section']) &&
    (value['level'] === 1 || value['level'] === 2 || value['level'] === 3) &&
    typeof value['title'] === 'string' &&
    typeof value['uslovieHtml'] === 'string' &&
    (value['answerType'] === 'number' || value['answerType'] === 'choice') &&
    (value['vybory'] === null ||
      (Array.isArray(value['vybory']) && value['vybory'].every(isVybor))) &&
    typeof value['seal'] === 'string' &&
    typeof value['podskazki'] === 'string' &&
    typeof value['razbor'] === 'string' &&
    isStringList(value['lifehacks'])
  );
}

/** Проверка формата при чтении из хранилища: чужое и повреждённое отсекается. */
export function isTrenazher11Payload(value: unknown): value is Trenazher11Payload {
  return (
    isRecord(value) &&
    typeof value['podskazki'] === 'boolean' &&
    Array.isArray(value['zadachi']) &&
    value['zadachi'].length > 0 &&
    value['zadachi'].every(isZadacha)
  );
}

/**
 * Состояние экрана №11, как оно хранится в сессии.
 *
 * Общие отметки: marks[i] — 'right' (начисто) или 'hinted' (с подсказкой
 * или после ошибки); tried[i] — была ошибка или открыто решение. «Не решена»
 * прежнего экрана здесь — отсутствие отметки: с tried это «неверно»,
 * без него — «пропущено». Остальное — то, что ученик успел сделать
 * на текущей задаче.
 */
export interface Trenazher11Ui extends BaseUi {
  value: string;
  checked: 'right' | 'wrong' | null;
  oshibalsya: boolean;
  hintOpen: boolean;
  shag: number;
  /** Неверные варианты текущего шага подсказки. */
  mimo: number[];
  /** Клетки таблицы, открытые нажатием (было Set). */
  otkrytye: string[];
  /** Открыто ли решение: разбор заново достаётся из отпечатка. */
  razborOtkryt: boolean;
  /** Когда начата текущая задача, мс активного времени. */
  taskFrom: number | null;
}

function count(value: unknown): number {
  return typeof value === 'number' && Number.isInteger(value) && value >= 0 ? value : 0;
}

/** Достать из сохранённого состояния поля экрана; что не прочиталось — по умолчанию. */
export function readTrenazher11Ui(base: BaseUi): Trenazher11Ui {
  const raw: Record<string, unknown> = isRecord(base) ? base : {};
  const mimo = raw['mimo'];
  return {
    ...base,
    value: asString(raw['value']),
    checked: asOneOf(raw['checked'], ['right', 'wrong'] as const),
    oshibalsya: asBool(raw['oshibalsya']),
    hintOpen: asBool(raw['hintOpen']),
    shag: count(raw['shag']),
    mimo: Array.isArray(mimo) ? mimo.filter((item): item is number => count(item) === item) : [],
    otkrytye: isStringList(raw['otkrytye']) ? raw['otkrytye'] : [],
    razborOtkryt: asBool(raw['razborOtkryt']),
    taskFrom: asNumberOrNull(raw['taskFrom']),
  };
}
