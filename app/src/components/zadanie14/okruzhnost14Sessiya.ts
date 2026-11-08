import { asBool, asNumber, asNumberOrNull, isRecord } from '@/lib/trainerSession/restore';
import type { BaseUi } from '@/lib/trainerSession/types';
import {
  REZHIMY,
  UROVNI,
  type ItogOk,
  type OtmetkaKartochki,
  type Raskladka,
  type Rezhim,
  type Uroven,
} from '@/lib/zadanie14/okruzhnost';

/**
 * Тренировка «Тригонометрическая окружность» в общей сессии: режим,
 * уровень и зёрна раундов — сами раунды собираются по зерну заново.
 * Состояние экрана — раскладка карточек, итог проверки, открытый
 * разбор, серия верных раундов.
 */
export interface Okruzhnost14Payload {
  rezhim: Rezhim;
  uroven: Uroven;
  seeds: number[];
}

export function isOkruzhnost14Payload(value: unknown): value is Okruzhnost14Payload {
  return (
    isRecord(value) &&
    REZHIMY.some((r) => r.id === value['rezhim']) &&
    UROVNI.some((u) => u.id === value['uroven']) &&
    Array.isArray(value['seeds']) &&
    value['seeds'].length > 0 &&
    value['seeds'].every((s) => Number.isInteger(s))
  );
}

export interface Okruzhnost14Ui extends BaseUi {
  raskl: Raskladka;
  itog: ItogOk | null;
  /** Раунд уже проверялся с ошибкой. */
  oshibalsya: boolean;
  reshenie: boolean;
  seria: number;
  luchshaya: number;
  /** Баннер свёрнут (после первой проверки). */
  kotik: boolean;
  taskFrom: number | null;
}

const OTMETKI: readonly OtmetkaKartochki[] = ['verno', 'neverno', 'pusto'];

function readRaskl(v: unknown): Raskladka {
  if (!isRecord(v)) return {};
  const out: Raskladka = {};
  for (const [id, k] of Object.entries(v)) {
    if (!/^\d+$/.test(id)) continue;
    if (k === null) out[Number(id)] = null;
    else if (typeof k === 'number' && Number.isInteger(k) && k >= 0 && k < 24) out[Number(id)] = k;
  }
  return out;
}

function readItog(v: unknown): ItogOk | null {
  if (!isRecord(v) || !isRecord(v['otmetki'])) return null;
  const otmetki: ItogOk['otmetki'] = {};
  for (const [id, o] of Object.entries(v['otmetki'])) {
    if (/^\d+$/.test(id) && OTMETKI.includes(o as OtmetkaKartochki)) {
      otmetki[Number(id)] = o as OtmetkaKartochki;
    }
  }
  return {
    otmetki,
    verno: asNumber(v['verno'], 0),
    vsego: asNumber(v['vsego'], 0),
    vse: asBool(v['vse']),
  };
}

export function readOkruzhnost14Ui(base: BaseUi): Okruzhnost14Ui {
  const raw: Record<string, unknown> = isRecord(base) ? base : {};
  return {
    ...base,
    raskl: readRaskl(raw['raskl']),
    itog: readItog(raw['itog']),
    oshibalsya: asBool(raw['oshibalsya']),
    reshenie: asBool(raw['reshenie']),
    seria: Math.max(0, asNumber(raw['seria'], 0)),
    luchshaya: Math.max(0, asNumber(raw['luchshaya'], 0)),
    kotik: asBool(raw['kotik']),
    taskFrom: asNumberOrNull(raw['taskFrom']),
  };
}
