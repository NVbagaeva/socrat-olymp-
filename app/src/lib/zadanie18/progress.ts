'use client';

/**
 * Прогресс ключевых схем №18 — поверх общего прогресса карточек по
 * теории (lib/kartochki/progress, ключ budetege:kartochki:18:v1).
 *
 * У схемы две карточки общей колоды (lib/zadanie18/kartochki):
 * «Узнай схему по чертежу» и «Вспомни следствия». Плитки, «Знаю / Не
 * знаю» на странице схемы и вводная плашка читают и пишут те же
 * коробки, что вкладка «Карточки»: ответ в одном месте сразу виден
 * во всех.
 *
 * Статус схемы: ни одна карточка ещё не оценена — «Не начинал»; обе
 * во 2-й коробке и выше (последний ответ — «Знаю») — «Знаю»; иначе —
 * «Учу». «Знаю / Не знаю» на странице схемы оценивает обе карточки.
 */

import type { Status18 } from '@/content/zadanie18';
import {
  korobka,
  neznakoma,
  otsenit,
  poraPovtoryat,
  type ProgressKolody,
} from '@/lib/kartochki/leitner';
import { prochitat, useProgressKolody, zapisatProgress } from '@/lib/kartochki/progress';
import { storage } from '@/lib/storage';
import { NOMER_18, kartochkiSkhemy } from './kartochki';

export function useProgress18(): ProgressKolody {
  return useProgressKolody(NOMER_18);
}

export function status18(p: ProgressKolody, skhema: string): Status18 {
  const b = kartochkiSkhemy(skhema).map((id) => korobka(p, id));
  if (b.every((x) => x === 0)) return 'new';
  return b.every((x) => x >= 2) ? 'known' : 'learning';
}

/** Младшая коробка карточек схемы; 0 — схему ещё не открывали. */
export function korobkaSkhemy(p: ProgressKolody, skhema: string): number {
  return Math.min(...kartochkiSkhemy(skhema).map((id) => korobka(p, id)));
}

/** «Знаю / Не знаю» на странице схемы: оценка обеих её карточек. */
export function otmetit18(skhema: string, znayu: boolean): void {
  const seychas = Date.now();
  const p = kartochkiSkhemy(skhema).reduce(
    (acc, id) => otsenit(acc, id, znayu, seychas),
    prochitat(NOMER_18),
  );
  zapisatProgress(NOMER_18, p);
}

/** Карточки колоды схем, которые пора повторить к `seychas`. */
export function kPovtoreniyu(
  skhemy: readonly string[],
  p: ProgressKolody,
  seychas: number,
): number {
  return skhemy.flatMap(kartochkiSkhemy).filter((id) => poraPovtoryat(p, id, seychas)).length;
}

/** Незнакомые карточки колоды схем: новые и с последним «Не знаю». */
export function neznakomyh(skhemy: readonly string[], p: ProgressKolody): number {
  return skhemy.flatMap(kartochkiSkhemy).filter((id) => neznakoma(p, id)).length;
}

/* ── Перенос старого прогресса ─────────────────────────────────── */

/**
 * До общей колоды у схем было своё хранилище: схема → {korobka,
 * otvetov, kogda}, ключ budetege:planimetriya-18:skhemy:v1. Коробка
 * схемы переносится в обе её карточки (вместе со временем ответа —
 * «На сегодня» считает по нему), если у карточки ещё нет своей записи.
 * Старый ключ после переноса удаляется: перенос один раз.
 */
const STARYY_KLYUCH = 'planimetriya-18:skhemy:v1';

export function perenestiStaryyProgress(): void {
  const raw = storage.get<unknown>(STARYY_KLYUCH, null);
  if (raw === null || typeof raw !== 'object' || Array.isArray(raw)) return;
  let p = prochitat(NOMER_18);
  const bylo = p;
  for (const [skhema, z] of Object.entries(raw as Record<string, unknown>)) {
    if (typeof z !== 'object' || z === null) continue;
    const { korobka: k, otvetov, kogda } = z as Record<string, unknown>;
    if (typeof k !== 'number' || !Number.isInteger(k) || k < 1 || k > 5) continue;
    for (const id of kartochkiSkhemy(skhema)) {
      if (p[id] !== undefined) continue;
      p = {
        ...p,
        [id]: {
          b: k,
          n: typeof otvetov === 'number' && otvetov > 0 ? otvetov : 1,
          ...(typeof kogda === 'number' && kogda > 0 ? { t: kogda } : {}),
        },
      };
    }
  }
  if (p !== bylo) zapisatProgress(NOMER_18, p);
  storage.remove(STARYY_KLYUCH);
}
