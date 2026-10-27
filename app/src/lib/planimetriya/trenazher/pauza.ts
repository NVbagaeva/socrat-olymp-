'use client';

/**
 * Тренировка на паузе прежнего тренажёра №1 (до общей оболочки
 * сессий): переносится в запись общей оболочки один раз.
 *
 * Прежняя запись хранила план (номер банка, аналога или seed новой
 * задачи), текущую задачу и отметки. Задания общего тренажёра — те же
 * ключи (filtry1.ts), поэтому тренировка открывается как была: та же
 * задача, те же отметки, на паузе — с плашкой «Продолжить».
 */

import {
  encodeSession,
  newSessionId,
  readSession,
  TAB_ID,
  writeRaw,
} from '../../trainerSession/store';
import type { TrenPayload, TrenUi, ZadachaSost } from '../../trenazher/sessiya';
import { NOVAYA } from '../../trenazher/sessiya';
import { klyuchNovoy1 } from './filtry1';

const KEY = 'budetege:planimetriya-1:trenazher-pauza:v1';

interface StarayaPauza {
  plan: { vid: string; id: string; no?: number; seed?: string }[];
  podskazki?: boolean;
  index?: number;
  otmetki?: unknown[];
  nachato?: number;
}

function zadanie(p: StarayaPauza['plan'][number]): TrenPayload['items'][number] | null {
  if (typeof p.id !== 'string' || !/^p\d{2}$/.test(p.id)) return null;
  if (p.vid === 'new')
    return typeof p.seed === 'string' ? { k: klyuchNovoy1(p.id), seed: p.seed } : null;
  if ((p.vid === 'bank' || p.vid === 'analog') && typeof p.no === 'number') {
    return { k: `${p.id}|${p.vid === 'bank' ? 'b' : 'a'}${p.no}` };
  }
  return null;
}

/**
 * Перенести прежнюю паузу в запись сессии раздела «1», если своей
 * записи там ещё нет. Прежний ключ убирается в любом случае.
 */
export function perenestiPauzu1(): void {
  let raw: string | null;
  try {
    raw = window.localStorage.getItem(KEY);
  } catch {
    return;
  }
  if (raw === null) return;
  try {
    window.localStorage.removeItem(KEY);
  } catch {
    /* Запись запрещена — перенос всё равно попробуем. */
  }
  if (readSession('1').status !== 'none') return;
  let v: StarayaPauza;
  try {
    v = JSON.parse(raw) as StarayaPauza;
  } catch {
    return;
  }
  if (!Array.isArray(v.plan)) return;
  const items = v.plan.map(zadanie);
  if (items.length === 0 || items.some((x) => x === null)) return;
  const payload: TrenPayload = {
    v: 1,
    filtr: '',
    rezhim: v.podskazki === false ? 'bez' : 'podskazki',
    seed: 'perenos',
    items: items as TrenPayload['items'],
  };
  const z: Record<number, ZadachaSost> = {};
  const marks: TrenUi['marks'] = {};
  const tried: TrenUi['tried'] = {};
  (Array.isArray(v.otmetki) ? v.otmetki : []).forEach((o, i) => {
    if (o === 'right' || o === 'hinted' || o === 'wrong') z[i] = { ...NOVAYA, itog: o };
    if (o === 'right' || o === 'hinted') marks[i] = o;
    if (o === 'wrong') tried[i] = true;
  });
  const index =
    typeof v.index === 'number' && v.index >= 0 && v.index < items.length ? Math.floor(v.index) : 0;
  const ui: TrenUi = { index, marks, tried, order: null, z, s: null };
  const now = Date.now();
  const nachato = typeof v.nachato === 'number' ? v.nachato : now;
  writeRaw(
    '1',
    encodeSession(
      {
        scope: '1',
        id: newSessionId(),
        createdAt: nachato,
        updatedAt: now,
        rev: 1,
        writer: TAB_ID,
        paused: true,
        activeMs: 0,
        total: items.length,
      },
      JSON.stringify(ui),
      JSON.stringify(payload),
    ),
  );
}
