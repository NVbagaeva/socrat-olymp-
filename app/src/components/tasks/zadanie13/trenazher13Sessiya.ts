import { asBool, asNumberOrNull, asOneOf, asString, isRecord } from '@/lib/trainerSession/restore';
import type { BaseUi } from '@/lib/trainerSession/types';
import { fingerprint } from '@/lib/zadanie13/secret';
import type { Rezhim13, ZadachaPlan13 } from '@/lib/zadanie13/trenazher/plan';
import type { Zadacha13T } from '@/lib/zadanie13/trenazher/zadacha';

/**
 * Тренировка №13 в сессии: собранные задачи, режим и состояние экрана.
 *
 * В хранилище идёт только план — прототип и seed каждой задачи — с
 * контрольной подписью: собранные задачи с разбором весят много, а
 * собираются заново тем же движком. Подпись не сошлась (сайт
 * обновился и seed даёт другую задачу) — тренировка устарела.
 */
export interface Trenazher13Payload {
  rezhim: Rezhim13;
  zadachi: Zadacha13T[];
}

const REZHIMY: readonly Rezhim13[] = ['otvet', 'oformlenie'];

function isZadacha(value: unknown): value is Zadacha13T {
  return (
    isRecord(value) &&
    typeof value['prototypeId'] === 'string' &&
    typeof value['seed'] === 'string' &&
    typeof value['uslovieHtml'] === 'string' &&
    typeof value['seal'] === 'string' &&
    typeof value['podskazki'] === 'string' &&
    typeof value['razbor'] === 'string' &&
    Array.isArray(value['wrongUnits']) &&
    Array.isArray(value['metki']) &&
    (value['vid'] === 'zadachi' || value['vid'] === 'tip') &&
    (value['istochnik'] === 'bank' || value['istochnik'] === 'new') &&
    ['A', 'B', 'C', 'D'].includes(value['type'] as string)
  );
}

export function isTrenazher13Payload(value: unknown): value is Trenazher13Payload {
  return (
    isRecord(value) &&
    REZHIMY.includes(value['rezhim'] as Rezhim13) &&
    Array.isArray(value['zadachi']) &&
    value['zadachi'].length > 0 &&
    value['zadachi'].every(isZadacha)
  );
}

/* ── Запись в хранилище: план тренировки ─────────────────────────── */

type Ssylka13 = [
  prototypeId: string,
  seed: string,
  istochnik: ZadachaPlan13['istochnik'],
  vid: ZadachaPlan13['vid'],
  podpis: string,
];

interface Upakovano13 {
  rezhim: Rezhim13;
  zadachi: Ssylka13[];
}

function podpis(z: Zadacha13T): string {
  return fingerprint(`z13-sess:${z.uslovieHtml}\u0000${z.seal}`);
}

export function upakovat13(payload: Trenazher13Payload): Upakovano13 {
  return {
    rezhim: payload.rezhim,
    zadachi: payload.zadachi.map((z) => [z.prototypeId, z.seed, z.istochnik, z.vid, podpis(z)]),
  };
}

function isSsylka13(value: unknown): value is Ssylka13 {
  return (
    Array.isArray(value) &&
    value.length === 5 &&
    typeof value[0] === 'string' &&
    typeof value[1] === 'string' &&
    (value[2] === 'bank' || value[2] === 'new') &&
    (value[3] === 'zadachi' || value[3] === 'tip') &&
    typeof value[4] === 'string'
  );
}

/** План из записи → задачи. Движок подгружается здесь же, по требованию. */
export async function raspakovat13(packed: unknown): Promise<Trenazher13Payload | null> {
  if (
    !isRecord(packed) ||
    !REZHIMY.includes(packed['rezhim'] as Rezhim13) ||
    !Array.isArray(packed['zadachi']) ||
    !packed['zadachi'].every(isSsylka13)
  ) {
    return null;
  }
  const { sobratZadachu13 } = await import('@/lib/zadanie13/trenazher/zadacha');
  const zadachi: Zadacha13T[] = [];
  for (const [i, [prototypeId, seed, istochnik, vid, sig]] of (
    packed['zadachi'] as Ssylka13[]
  ).entries()) {
    let z: Zadacha13T;
    try {
      z = sobratZadachu13({ prototypeId, seed, istochnik, vid }, i + 1);
    } catch {
      return null;
    }
    if (podpis(z) !== sig) {
      return null;
    }
    zadachi.push(z);
  }
  const payload: unknown = { rezhim: packed['rezhim'], zadachi };
  return isTrenazher13Payload(payload) ? payload : null;
}

/**
 * Состояние экрана №13, как оно хранится в сессии. Общие отметки —
 * в BaseUi; остальное — то, что ученик успел сделать на текущей задаче.
 */
export interface Trenazher13Ui extends BaseUi {
  value: string;
  checked: 'right' | 'units' | 'wrong' | null;
  oshibalsya: boolean;
  /** Режим «Ответ»: открыта подсказка по шагам. */
  hintOpen: boolean;
  /** Режим «С оформлением»: пройдено шагов (схема — 1, строка — 2, дальше шаги). */
  etap: number;
  /** Клетки первой строки: введённое и верно ли. */
  kletki: Record<string, string>;
  vernyeKletki: string[];
  razborOtkryt: boolean;
  taskFrom: number | null;
}

function count(value: unknown): number {
  return typeof value === 'number' && Number.isInteger(value) && value >= 0 ? value : 0;
}

export function readTrenazher13Ui(base: BaseUi): Trenazher13Ui {
  const raw: Record<string, unknown> = isRecord(base) ? base : {};
  const kletki = isRecord(raw['kletki']) ? raw['kletki'] : {};
  const verno = raw['vernyeKletki'];
  return {
    ...base,
    value: asString(raw['value']),
    checked: asOneOf(raw['checked'], ['right', 'units', 'wrong'] as const),
    oshibalsya: asBool(raw['oshibalsya']),
    hintOpen: asBool(raw['hintOpen']),
    etap: count(raw['etap']),
    kletki: Object.fromEntries(
      Object.entries(kletki).filter((e): e is [string, string] => typeof e[1] === 'string'),
    ),
    vernyeKletki: Array.isArray(verno)
      ? verno.filter((x): x is string => typeof x === 'string')
      : [],
    razborOtkryt: asBool(raw['razborOtkryt']),
    taskFrom: asNumberOrNull(raw['taskFrom']),
  };
}
