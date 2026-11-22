/**
 * Личная статистика устного счёта — модель без браузера.
 *
 * Один ключ localStorage (USTNYY_KEY), который живёт и в аккаунте
 * (lib/progressImport/registry.ts, lib/accountSync/merge.ts). Данные
 * устроены так, чтобы два устройства сливались без двойного счёта:
 *   - тренировки — список с идентификаторами (объединение);
 *   - рекорды — по каждому ключу лучший;
 *   - клетки таблицы умножения — побеждает более поздняя запись.
 * Сводка по приёмам считается из тренировок, отдельных счётчиков нет.
 */

import { prohodit, sravnit, type Rezultat } from '../ochki';
import type { Hod, Rezhim } from '../sessiya';
import type { PriyomId, Uroven } from '../types';
import { kletka } from '../priyomy/tablica';

export const USTNYY_KEY = 'budetege:ustnyy-schet:v1';

/** Сколько тренировок храним (последние). */
export const SESSII_MAX = 300;

/** [примеров, верно, мс на верные] */
export type Schet = [number, number, number];

export interface SessiyaZapis {
  id: string;
  /** Когда закончена, мс эпохи. */
  at: number;
  /** Набор: «p:na-11», «p:na-11+okolo-100», «d:umnozhenie», «t», «f:tablica-1m», «o» (ошибки). */
  nabor: string;
  /** Режим: «svobodnyy», «seriya-20», «vremya-60». */
  rezhim: string;
  uroven: Uroven;
  verno: number;
  vsego: number;
  ms: number;
  seriya: number;
  po: Partial<Record<PriyomId, Schet>>;
}

export interface Rekord extends Rezultat {
  sessiya: string;
}

export interface Kletka {
  n: number;
  ok: number;
  /** Сглаженное время верного ответа, мс. */
  ms: number;
  /** Коробка интервального повторения: 0 — трудный, 4 — освоен. */
  box: number;
  /** Когда обновлена, мс эпохи. */
  t: number;
}

export interface Stat {
  v: 1;
  sessii: SessiyaZapis[];
  rekordy: Record<string, Rekord>;
  tablica: Record<string, Kletka>;
}

export const PUSTO: Stat = { v: 1, sessii: [], rekordy: {}, tablica: {} };

/* ── Разбор (мусор — пусто, а не исключение) ──────────────── */

const isObj = (x: unknown): x is Record<string, unknown> =>
  typeof x === 'object' && x !== null && !Array.isArray(x);
const isNum = (x: unknown): x is number => typeof x === 'number' && Number.isFinite(x) && x >= 0;

function parseSessiya(x: unknown): SessiyaZapis | null {
  if (!isObj(x)) return null;
  const { id, at, nabor, rezhim, uroven, verno, vsego, ms, seriya, po } = x;
  if (
    typeof id !== 'string' ||
    id.length > 64 ||
    typeof nabor !== 'string' ||
    typeof rezhim !== 'string'
  )
    return null;
  if (!isNum(at) || !isNum(verno) || !isNum(vsego) || !isNum(ms) || verno > vsego) return null;
  const u = uroven === 2 || uroven === 3 ? uroven : 1;
  const poOut: Partial<Record<PriyomId, Schet>> = {};
  if (isObj(po)) {
    for (const [k, v] of Object.entries(po)) {
      if (Array.isArray(v) && v.length === 3 && v.every(isNum))
        poOut[k as PriyomId] = [v[0], v[1], v[2]] as Schet;
    }
  }
  return {
    id,
    at,
    nabor: nabor.slice(0, 200),
    rezhim: rezhim.slice(0, 40),
    uroven: u,
    verno,
    vsego,
    ms,
    seriya: isNum(seriya) ? seriya : 0,
    po: poOut,
  };
}

export function parseStat(raw: unknown): Stat {
  if (!isObj(raw) || raw.v !== 1) return PUSTO;
  const sessii = Array.isArray(raw.sessii)
    ? raw.sessii.map(parseSessiya).filter((s): s is SessiyaZapis => s !== null)
    : [];
  const rekordy: Record<string, Rekord> = {};
  if (isObj(raw.rekordy)) {
    for (const [k, v] of Object.entries(raw.rekordy)) {
      if (
        isObj(v) &&
        isNum(v.verno) &&
        isNum(v.vsego) &&
        isNum(v.ms) &&
        isNum(v.at) &&
        v.verno <= v.vsego
      ) {
        rekordy[k] = {
          verno: v.verno,
          vsego: v.vsego,
          ms: v.ms,
          at: v.at,
          sessiya: String(v.sessiya ?? ''),
        };
      }
    }
  }
  const tablica: Record<string, Kletka> = {};
  if (isObj(raw.tablica)) {
    for (const [k, v] of Object.entries(raw.tablica)) {
      if (
        /^\d{1,2}x\d{1,2}$/.test(k) &&
        isObj(v) &&
        isNum(v.n) &&
        isNum(v.ok) &&
        isNum(v.ms) &&
        isNum(v.box) &&
        isNum(v.t)
      ) {
        tablica[k] = {
          n: v.n,
          ok: Math.min(v.ok, v.n),
          ms: v.ms,
          box: Math.min(4, Math.floor(v.box)),
          t: v.t,
        };
      }
    }
  }
  return { v: 1, sessii: sessii.slice(-SESSII_MAX), rekordy, tablica };
}

/* ── Слияние двух устройств ───────────────────────────────── */

export function tipRekorda(key: string): 'vremya' | 'seriya' {
  return key.includes('|vremya-') ? 'vremya' : 'seriya';
}

export function mergeStat(a: Stat, b: Stat): Stat {
  const byId = new Map<string, SessiyaZapis>();
  for (const s of [...a.sessii, ...b.sessii]) if (!byId.has(s.id)) byId.set(s.id, s);
  const sessii = [...byId.values()].sort((x, y) => x.at - y.at).slice(-SESSII_MAX);
  const rekordy: Record<string, Rekord> = { ...a.rekordy };
  for (const [k, r] of Object.entries(b.rekordy)) {
    const cur = rekordy[k];
    if (cur === undefined || sravnit(tipRekorda(k), r, cur) < 0) rekordy[k] = r;
  }
  const tablica: Record<string, Kletka> = { ...a.tablica };
  for (const [k, c] of Object.entries(b.tablica)) {
    const cur = tablica[k];
    if (cur === undefined || c.t > cur.t) tablica[k] = c;
  }
  return { v: 1, sessii, rekordy, tablica };
}

/* ── Запись тренировки ────────────────────────────────────── */

export function rezhimKey(r: Rezhim): string {
  return r.tip === 'svobodnyy'
    ? 'svobodnyy'
    : r.tip === 'seriya'
      ? `seriya-${r.n}`
      : `vremya-${r.sek}`;
}

/** Ключ рекорда: набор и режим. У свободного режима рекорда нет. */
export function rekordKey(nabor: string, r: Rezhim): string | null {
  /* У повтора ошибок рекорда нет: набор каждый раз свой. */
  return r.tip === 'svobodnyy' || nabor === 'o' ? null : `${nabor}|${rezhimKey(r)}`;
}

/** Быстрый верный ответ таблицы умножения, мс. */
export const BYSTRO_MS = 3000;

export function obnovitKletku(
  c: Kletka | undefined,
  verno: boolean,
  ms: number,
  t: number,
): Kletka {
  const old = c ?? { n: 0, ok: 0, ms: 0, box: 0, t: 0 };
  const box = !verno ? 0 : ms <= BYSTRO_MS ? Math.min(4, old.box + 1) : Math.max(1, old.box);
  return {
    n: old.n + 1,
    ok: old.ok + (verno ? 1 : 0),
    ms: verno ? (old.ok === 0 ? ms : Math.round(old.ms * 0.6 + ms * 0.4)) : old.ms,
    box,
    t,
  };
}

/** Освоенность клетки для цвета сетки: 0 — не решал, 1 — трудный … 4 — освоен. */
export function osvoennost(c: Kletka | undefined): 0 | 1 | 2 | 3 | 4 {
  if (c === undefined || c.n === 0) return 0;
  return Math.max(1, Math.min(4, c.box)) as 1 | 2 | 3 | 4;
}

export interface Itog {
  id: string;
  at: number;
  nabor: string;
  rezhim: Rezhim;
  uroven: Uroven;
  hody: readonly Hod[];
  ms: number;
  seriya: number;
}

export interface Zapisano {
  stat: Stat;
  /** Ключ рекорда, если тренировка поставила рекорд. */
  rekord: string | null;
  /** Прежний рекорд (до этой тренировки). */
  prezhniy: Rekord | null;
}

export function zapisat(stat: Stat, it: Itog): Zapisano {
  if (it.hody.length === 0) return { stat, rekord: null, prezhniy: null };
  const po: Partial<Record<PriyomId, Schet>> = {};
  const tablica = { ...stat.tablica };
  for (const h of it.hody) {
    const cur = po[h.primer.priyom] ?? [0, 0, 0];
    po[h.primer.priyom] = [cur[0] + 1, cur[1] + (h.verno ? 1 : 0), cur[2] + (h.verno ? h.ms : 0)];
    if (h.primer.priyom === 'tablica') {
      const k = kletka(Number(h.primer.d[0]), Number(h.primer.d[1]));
      tablica[k] = obnovitKletku(tablica[k], h.verno, h.ms, it.at);
    }
  }
  const verno = it.hody.filter((h) => h.verno).length;
  const zapis: SessiyaZapis = {
    id: it.id,
    at: it.at,
    nabor: it.nabor,
    rezhim: rezhimKey(it.rezhim),
    uroven: it.uroven,
    verno,
    vsego: it.hody.length,
    ms: Math.round(it.ms),
    seriya: it.seriya,
    po,
  };
  const rekordy = { ...stat.rekordy };
  const key = rekordKey(it.nabor, it.rezhim);
  let rekord: string | null = null;
  let prezhniy: Rekord | null = null;
  if (key !== null) {
    prezhniy = rekordy[key] ?? null;
    const novyy: Rekord = {
      verno,
      vsego: it.hody.length,
      ms: Math.round(it.ms),
      at: it.at,
      sessiya: it.id,
    };
    const tip = tipRekorda(key);
    /* Серия засчитывается, только если пройдена целиком. */
    const celikom = it.rezhim.tip !== 'seriya' || it.hody.length >= it.rezhim.n;
    if (celikom && prohodit(novyy) && (prezhniy === null || sravnit(tip, novyy, prezhniy) < 0)) {
      rekordy[key] = novyy;
      rekord = key;
    }
  }
  return {
    stat: { v: 1, sessii: [...stat.sessii, zapis].slice(-SESSII_MAX), rekordy, tablica },
    rekord,
    prezhniy,
  };
}

/* ── Сводки ───────────────────────────────────────────────── */

/** Сводка по приёму за все хранимые тренировки. */
export function svodkaPriyoma(
  stat: Stat,
  id: PriyomId,
): { n: number; ok: number; srednee: number } {
  let n = 0;
  let ok = 0;
  let ms = 0;
  for (const s of stat.sessii) {
    const c = s.po[id];
    if (c !== undefined) {
      n += c[0];
      ok += c[1];
      ms += c[2];
    }
  }
  return { n, ok, srednee: ok === 0 ? 0 : Math.round(ms / ok) };
}

/** Трудные клетки таблицы — для работы над ошибками: слабые первыми. */
export function trudnyeKletki(stat: Stat, limit = 20): string[] {
  return Object.entries(stat.tablica)
    .filter(([, c]) => c.n > 0 && c.box <= 2)
    .sort(([, a], [, b]) => a.box - b.box || a.ok / a.n - b.ok / b.n || b.ms - a.ms)
    .slice(0, limit)
    .map(([k]) => k);
}
