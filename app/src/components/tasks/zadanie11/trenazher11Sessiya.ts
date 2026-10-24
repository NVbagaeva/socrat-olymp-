import {
  asBool,
  asNumberOrNull,
  asOneOf,
  asString,
  isRecord,
} from '@/lib/trainerSession/restore';
import { fingerprint } from '@/lib/secret';
import type { BaseUi } from '@/lib/trainerSession/types';
import type { UslovieBanka, ZadachaPlan } from '@/lib/zadanie11/trenazher/sessiya';
import type { Zadacha11 } from '@/lib/zadanie11/trenazher/zadacha';

/**
 * Тренировка №11 в сессии: собранные задачи и состояние экрана.
 *
 * Экран получает задачи (Zadacha11) готовыми: условие набрано KaTeX,
 * подсказки и разбор лежат закрытыми отпечатком. В хранилище же идёт
 * только план — номер задачи банка или подтип и seed новой — с
 * контрольной подписью (upakovat11/raspakovat11 ниже): готовые задачи
 * с таблицами и разбором весят по 60 КБ, а пятьдесят — три мегабайта.
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

/* ── Запись в хранилище: план тренировки ─────────────────────────── */

/** Задача в записи: откуда она, подтип, номер в банке или seed, подпись. */
type Ssylka11 = [vid: ZadachaPlan['vid'], id: string, otkuda: number | string, podpis: string];

interface Upakovano11 {
  podskazki: boolean;
  zadachi: Ssylka11[];
}

/**
 * Контрольная подпись задачи: отпечаток условия и отпечатка ответа.
 * Банк и генераторы обновляются вместе с сайтом: если тот же план
 * теперь даёт другую задачу, подпись не сойдётся и тренировка
 * сбросится как устаревшая.
 */
function podpis(z: Zadacha11): string {
  return fingerprint('z11-sess:', `${z.uslovieHtml}\u0000${z.seal}`);
}

/**
 * План задачи по её ключу (klyuchZadachi в trenazher/sessiya.ts):
 * «ДП-07|b12» — задача банка №12, «|r» — разминки, «|a» — аналог,
 * «|n<seed>» — новая. Ключ не разобрался — null.
 */
function planZadachi(z: Zadacha11): ZadachaPlan | null {
  const hvost = z.key.slice(z.id.length + 1);
  if (!z.key.startsWith(`${z.id}|`) || hvost === '') {
    return null;
  }
  if (z.vid === 'new') {
    return hvost.startsWith('n') ? { vid: 'new', id: z.id, seed: hvost.slice(1) } : null;
  }
  const no = Number(hvost.slice(1));
  return Number.isInteger(no) ? { vid: z.vid, no, id: z.id } : null;
}

/** Задачи → план с подписями для записи (pack оболочки). */
export function upakovat11(payload: Trenazher11Payload): Upakovano11 {
  return {
    podskazki: payload.podskazki,
    zadachi: payload.zadachi.flatMap((z): Ssylka11[] => {
      const plan = planZadachi(z);
      if (plan === null) {
        return [];
      }
      return [[plan.vid, plan.id, plan.vid === 'new' ? plan.seed : plan.no, podpis(z)]];
    }),
  };
}

function isSsylka11(value: unknown): value is Ssylka11 {
  return (
    Array.isArray(value) &&
    value.length === 4 &&
    typeof value[0] === 'string' &&
    VIDY.includes(value[0]) &&
    typeof value[1] === 'string' &&
    (value[0] === 'new' ? typeof value[2] === 'string' : typeof value[2] === 'number') &&
    typeof value[3] === 'string'
  );
}

/**
 * План из записи → задачи (unpack оболочки). Собирает их тот же
 * sobratZadachu, что и при старте, по банку страницы; движок
 * подгружается здесь же, по требованию. Подпись не сошлась или задачи
 * нет в банке — null: тренировка устарела.
 */
export async function raspakovat11(
  packed: unknown,
  bank: readonly UslovieBanka[],
): Promise<Trenazher11Payload | null> {
  if (
    !isRecord(packed) ||
    typeof packed['podskazki'] !== 'boolean' ||
    !Array.isArray(packed['zadachi']) ||
    !packed['zadachi'].every(isSsylka11)
  ) {
    return null;
  }
  const { sobratZadachu } = await import('@/lib/zadanie11/trenazher/zadacha');
  const zadachi: Zadacha11[] = [];
  for (const [vid, id, otkuda, sig] of packed['zadachi'] as Ssylka11[]) {
    const plan: ZadachaPlan =
      vid === 'new'
        ? { vid, id, seed: String(otkuda) }
        : { vid, id, no: Number(otkuda) };
    let z: Zadacha11;
    try {
      z = sobratZadachu(plan, bank);
    } catch {
      return null;
    }
    if (podpis(z) !== sig) {
      return null;
    }
    zadachi.push(z);
  }
  const payload: unknown = { podskazki: packed['podskazki'], zadachi };
  return isTrenazher11Payload(payload) ? payload : null;
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
