import {
  asBool,
  asNumberOrNull,
  asOneOf,
  asString,
  isRecord,
} from '@/lib/trainerSession/restore';
import type { BaseUi } from '@/lib/trainerSession/types';
import type { UslovieBanka, ZadachaPlan } from '@/lib/planimetriya/trenazher/sessiya';
import type { Zadacha1 } from '@/lib/planimetriya/trenazher/zadacha';
import { rngOf } from '@/lib/vychisleniya/rng';

/**
 * Тренировка №1 в сессии: план, собранные задачи и состояние экрана.
 *
 * Собранная задача весит много: чертёж условия, чертёж каждого шага
 * подсказки и лист учителя — SVG, закрытые отпечатком. Пятьдесят задач
 * — около двух мегабайт, поэтому в хранилище идёт только план (номер
 * задачи банка или аналога, у новой — прототип и seed) и подпись.
 * При возврате задачи собираются заново тем же движком, что и при
 * старте (trenazher/zadacha.ts), и сверяются с подписью: сайт
 * обновился и движок дал другие задачи — тренировка сбрасывается как
 * устаревшая.
 */
export interface Trenazher1Payload {
  plan: ZadachaPlan[];
  /** Задачи плана, собранные движком: по одной на пункт плана. */
  zadachi: Zadacha1[];
  /** Выбор «с подсказками» на момент старта. */
  podskazki: boolean;
}

/** Что лежит в хранилище: план без собранных задач. */
interface Upakovka {
  v: 1;
  plan: ZadachaPlan[];
  podskazki: boolean;
  /** Подпись собранных задач: условие, чертёж, отпечаток ответа, закрытые блоки. */
  podpis: string;
}

const VIDY = ['bank', 'analog', 'new'];

function isPlan(value: unknown): value is ZadachaPlan {
  if (!isRecord(value) || typeof value['id'] !== 'string' || !/^p\d{2}$/.test(value['id'])) {
    return false;
  }
  if (value['vid'] === 'new') {
    return typeof value['seed'] === 'string';
  }
  return (
    (value['vid'] === 'bank' || value['vid'] === 'analog') &&
    typeof value['no'] === 'number' &&
    Number.isInteger(value['no'])
  );
}

function isZadacha(value: unknown): value is Zadacha1 {
  return (
    isRecord(value) &&
    typeof value['key'] === 'string' &&
    typeof value['id'] === 'string' &&
    typeof value['proto'] === 'number' &&
    typeof value['vid'] === 'string' &&
    VIDY.includes(value['vid']) &&
    (value['fipi'] === null || typeof value['fipi'] === 'number') &&
    typeof value['title'] === 'string' &&
    typeof value['uslovieHtml'] === 'string' &&
    typeof value['risunokSvg'] === 'string' &&
    typeof value['seal'] === 'string' &&
    typeof value['podskazki'] === 'string' &&
    typeof value['razbor'] === 'string'
  );
}

/** Проверка собранной тренировки: чужое и повреждённое отсекается. */
export function isTrenazher1Payload(value: unknown): value is Trenazher1Payload {
  return (
    isRecord(value) &&
    typeof value['podskazki'] === 'boolean' &&
    Array.isArray(value['plan']) &&
    value['plan'].length > 0 &&
    value['plan'].every(isPlan) &&
    Array.isArray(value['zadachi']) &&
    value['zadachi'].length === value['plan'].length &&
    value['zadachi'].every(isZadacha)
  );
}

/* ── Упаковка ────────────────────────────────────────────────────── */

/** FNV-1a, 32 бита: короткая подпись длинной строки. */
function fnv(text: string, start = 0x811c9dc5): number {
  let h = start;
  for (let i = 0; i < text.length; i += 1) {
    h = Math.imul(h ^ text.charCodeAt(i), 0x01000193) >>> 0;
  }
  return h;
}

/**
 * Подпись задач: всё, что видит ученик и чем проверяется ответ. Два
 * хеша с разным началом — 64 бита: случайное совпадение исключено.
 */
export function podpisZadach(zadachi: readonly Zadacha1[]): string {
  const text = zadachi
    .map((z) =>
      [z.key, z.seal, z.title, z.uslovieHtml, z.risunokSvg, z.podskazki, z.razbor].join('\u0000'),
    )
    .join('\u0001');
  return `${fnv(text).toString(36)}.${fnv(text, 0x050c5d1f).toString(36)}`;
}

export function upakovat(payload: Trenazher1Payload): Upakovka {
  return {
    v: 1,
    plan: payload.plan,
    podskazki: payload.podskazki,
    podpis: podpisZadach(payload.zadachi),
  };
}

/** Задачи плана: модуль движка подгружается только здесь. */
export async function sobratPlan(
  plan: ZadachaPlan[],
  podskazki: boolean,
  bank: readonly UslovieBanka[],
): Promise<Trenazher1Payload> {
  const { sobratZadachu } = await import('@/lib/planimetriya/trenazher/zadacha');
  return { plan, zadachi: plan.map((p) => sobratZadachu(p, bank)), podskazki };
}

/**
 * Собрать задачи из записи. null — запись не та или движок дал не те
 * задачи, что были (сайт обновился): тренировка устарела.
 */
export async function raspakovat(
  packed: unknown,
  bank: readonly UslovieBanka[],
): Promise<Trenazher1Payload | null> {
  if (
    !isRecord(packed) ||
    packed['v'] !== 1 ||
    typeof packed['podskazki'] !== 'boolean' ||
    typeof packed['podpis'] !== 'string' ||
    !Array.isArray(packed['plan']) ||
    packed['plan'].length === 0 ||
    !packed['plan'].every(isPlan)
  ) {
    return null;
  }
  const payload = await sobratPlan(packed['plan'], packed['podskazki'], bank);
  return podpisZadach(payload.zadachi) === packed['podpis'] ? payload : null;
}

/** Часть тренировки — «Прорешать те же задачи»: задачи уже собраны. */
export function chastTrenirovki(payload: Trenazher1Payload, at: number[]): Trenazher1Payload {
  return {
    ...payload,
    plan: at.flatMap((i) => payload.plan[i] ?? []),
    zadachi: at.flatMap((i) => payload.zadachi[i] ?? []),
  };
}

/**
 * План «Похожих задач»: на каждую задачу с ошибкой — аналог того же
 * прототипа, которого в тренировке не было; аналоги кончились — новая
 * задача генератора. Задачи банка сюда не берутся: числа должны быть
 * другими.
 */
export function pokhozhiyPlan(
  payload: Trenazher1Payload,
  at: number[],
  bank: readonly UslovieBanka[],
  seed: string,
): ZadachaPlan[] {
  const r = rngOf(`z1-pokhozhie|${seed}`);
  const zanyato = new Set(payload.plan.flatMap((p) => (p.vid === 'analog' ? [p.no] : [])));
  return at.flatMap((i, k): ZadachaPlan[] => {
    const id = payload.plan[i]?.id;
    if (id === undefined) {
      return [];
    }
    const svobodnye = bank.filter((b) => b.analog && b.id === id && !zanyato.has(b.no));
    const a = svobodnye.length === 0 ? undefined : r.sample(svobodnye, 1)[0];
    if (a === undefined) {
      return [{ vid: 'new', id, seed: `${seed}-${k}` }];
    }
    zanyato.add(a.no);
    return [{ vid: 'analog', no: a.no, id }];
  });
}

/* ── Состояние экрана ────────────────────────────────────────────── */

/**
 * Состояние экрана №1, как оно хранится в сессии.
 *
 * Общие отметки: marks[i] — 'right' (начисто) или 'hinted' (с
 * подсказкой или после ошибки); tried[i] — была ошибка, открыто
 * решение или задача брошена после попытки. «Не решено» прежнего
 * экрана — отсутствие отметки: с tried это «неверно», без него —
 * «пропущено». Остальное — то, что ученик успел сделать на текущей
 * задаче: ответ, шаг подсказки (по нему же чертёж подсвечивает
 * нужный элемент), открытое решение.
 */
export interface Trenazher1Ui extends BaseUi {
  value: string;
  checked: 'right' | 'wrong' | null;
  oshibalsya: boolean;
  hintOpen: boolean;
  shag: number;
  /** Неверные варианты текущего шага подсказки. */
  mimo: number[];
  /** Открыто ли решение: разбор заново достаётся из отпечатка. */
  razborOtkryt: boolean;
  /** Когда начата текущая задача, мс активного времени. */
  taskFrom: number | null;
  /** Неверные ответы и неверные варианты подсказки за тренировку. */
  misses: number;
}

function count(value: unknown): number {
  return typeof value === 'number' && Number.isInteger(value) && value >= 0 ? value : 0;
}

/** Достать из сохранённого состояния поля экрана; что не прочиталось — по умолчанию. */
export function readTrenazher1Ui(base: BaseUi): Trenazher1Ui {
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
    razborOtkryt: asBool(raw['razborOtkryt']),
    taskFrom: asNumberOrNull(raw['taskFrom']),
    misses: count(raw['misses']),
  };
}
