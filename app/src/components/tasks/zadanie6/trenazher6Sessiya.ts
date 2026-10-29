import type { ZadachaLite } from '@/lib/zadanie6/dannye';
import type { Rezhim6 } from '@/lib/zadanie6/trenazher';
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
 * Тренировка №6 в общей сессии: задачи (условие и параметры без
 * ответа — только отпечаток) и состояние экрана. Задачи лёгкие (сотни
 * байт), поэтому в хранилище идут как есть — упаковка не нужна.
 */
export interface Trenazher6Payload {
  zadachi: ZadachaLite[];
  /** Режим проверки: ответ один, вердикт — в итогах. Нет поля — тренировка. */
  rezhim?: Rezhim6;
}

function isZadacha(value: unknown): value is ZadachaLite {
  return (
    isRecord(value) &&
    typeof value['id'] === 'string' &&
    typeof value['prototypeId'] === 'string' &&
    /^P(0[1-9]|1[0-5])$/.test(value['prototypeId']) &&
    ['fipi', 'demo', 'obrazec', 'analog'].includes(String(value['source'])) &&
    (value['stil'] === 'fipi' || value['stil'] === 'syuzhet') &&
    (value['no'] === undefined || typeof value['no'] === 'number') &&
    typeof value['text'] === 'string' &&
    (value['posle'] === undefined || typeof value['posle'] === 'string') &&
    isRecord(value['params']) &&
    Object.values(value['params']).every(
      (v) =>
        typeof v === 'number' ||
        typeof v === 'string' ||
        (Array.isArray(v) && v.every((x) => typeof x === 'number')),
    ) &&
    typeof value['seal'] === 'string'
  );
}

/** Проверка формата при чтении из хранилища: чужое и повреждённое отсекается. */
export function isTrenazher6Payload(value: unknown): value is Trenazher6Payload {
  return (
    isRecord(value) &&
    (value['rezhim'] === undefined ||
      value['rezhim'] === 'trenirovka' ||
      value['rezhim'] === 'proverka') &&
    Array.isArray(value['zadachi']) &&
    value['zadachi'].length > 0 &&
    value['zadachi'].every(isZadacha)
  );
}

/**
 * Состояние экрана №6 в сессии: общие отметки (marks, tried) и то, что
 * ученик успел сделать на текущей задаче — ввод, итог проверки,
 * открытые подсказка и разбор, пройденные шаги подсказки.
 */
export interface Trenazher6Ui extends BaseUi {
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
  /** Ответы по задачам: номер → последняя запись ученика (переход по точкам). */
  otvety: Record<number, string>;
  /** Задачи, у которых открыт разбор. */
  razbory: number[];
  /** Задачи, где открывали подсказку: решение там уже не «начисто». */
  podskazki: number[];
  /** Режим проверки: сохранённые ответы — номер → запись; их можно менять до конца. */
  prinyato: Record<number, string>;
}

function otvetyIz(value: unknown): Record<number, string> {
  if (!isRecord(value)) {
    return {};
  }
  const out: Record<number, string> = {};
  for (const [k, v] of Object.entries(value)) {
    if (/^\d+$/.test(k) && typeof v === 'string') {
      out[Number(k)] = v.slice(0, 40);
    }
  }
  return out;
}

/** Достать из сохранённого состояния поля экрана; что не прочиталось — по умолчанию. */
export function readTrenazher6Ui(base: BaseUi): Trenazher6Ui {
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
    otvety: otvetyIz(raw['otvety']),
    razbory: asNumberList(raw['razbory']),
    podskazki: asNumberList(raw['podskazki']),
    prinyato: otvetyIz(raw['prinyato']),
  };
}
