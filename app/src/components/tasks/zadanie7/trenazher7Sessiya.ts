import type { ZadachaLite } from '@/lib/zadanie7/dannye';
import {
  asBool,
  asNumber,
  asNumberList,
  asNumberOrNull,
  asOneOf,
  asString,
  isRecord,
} from '@/lib/trainerSession/restore';
import type { BaseUi } from '@/lib/trainerSession/types';

/**
 * Тренировка №7 в общей сессии: задачи (условие и параметры без
 * ответа — только отпечаток) и состояние экрана. Задачи лёгкие (сотни
 * байт), поэтому в хранилище идут как есть — упаковка не нужна.
 */
export interface Trenazher7Payload {
  zadachi: ZadachaLite[];
}

function isZadacha(value: unknown): value is ZadachaLite {
  return (
    isRecord(value) &&
    typeof value['id'] === 'string' &&
    typeof value['prototypeId'] === 'string' &&
    /^P\d\d$/.test(value['prototypeId']) &&
    (value['source'] === 'fipi' || value['source'] === 'analog') &&
    (value['no'] === undefined || typeof value['no'] === 'number') &&
    typeof value['text'] === 'string' &&
    isRecord(value['params']) &&
    Object.values(value['params']).every((v) => typeof v === 'number' || typeof v === 'string') &&
    typeof value['seal'] === 'string'
  );
}

/** Проверка формата при чтении из хранилища: чужое и повреждённое отсекается. */
export function isTrenazher7Payload(value: unknown): value is Trenazher7Payload {
  return (
    isRecord(value) &&
    Array.isArray(value['zadachi']) &&
    value['zadachi'].length > 0 &&
    value['zadachi'].every(isZadacha)
  );
}

/**
 * Состояние экрана №7 в сессии: общие отметки (marks, tried) и то, что
 * ученик успел сделать на текущей задаче — ввод, итог проверки,
 * открытые подсказка и разбор, пройденные шаги подсказки.
 */
export interface Trenazher7Ui extends BaseUi {
  value: string;
  checked: 'right' | 'wrong' | null;
  oshibalsya: boolean;
  hintOpen: boolean;
  /** Сколько шагов подсказки открыто. */
  shag: number;
  /** Неверные кнопки текущего шага подсказки. */
  mimo: number[];
  razborOtkryt: boolean;
  /** Когда начата текущая задача, мс активного времени. */
  taskFrom: number | null;
}

/** Достать из сохранённого состояния поля экрана; что не прочиталось — по умолчанию. */
export function readTrenazher7Ui(base: BaseUi): Trenazher7Ui {
  const raw: Record<string, unknown> = isRecord(base) ? base : {};
  return {
    ...base,
    value: asString(raw['value']),
    checked: asOneOf(raw['checked'], ['right', 'wrong'] as const),
    oshibalsya: asBool(raw['oshibalsya']),
    hintOpen: asBool(raw['hintOpen']),
    shag: Math.max(1, asNumber(raw['shag'], 1)),
    mimo: asNumberList(raw['mimo']),
    razborOtkryt: asBool(raw['razborOtkryt']),
    taskFrom: asNumberOrNull(raw['taskFrom']),
  };
}
