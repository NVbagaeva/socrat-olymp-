'use client';

/**
 * Карточки в ДЗ (PR 2в): ученик нажимает «Открыть карточки» на экране
 * ДЗ — браузер запоминает, к какому элементу ДЗ сейчас идут карточки
 * раздела. Вкладка «Карточки» засчитывает каждую пройденную карточку:
 * база получает число разных пройденных карточек (dz2_mark). Запись —
 * в localStorage, на 14 дней; чужому ученику база всё равно откажет.
 */

import { useSyncExternalStore } from 'react';
import { browserStorage } from '@/lib/storage';

export interface OtmetkaKartochek {
  item: string;
  homework: string;
  title: string;
  need: number;
  ids: string[];
  at: number;
}

const KEY = (taskNo: number) => `budetege:dz2:kartochki:v1:${taskNo}`;
const SROK = 14 * 24 * 3600 * 1000;
const slushateli = new Set<() => void>();
const kesh = new Map<number, { raw: string | null; v: OtmetkaKartochek | null }>();

function razobrat(raw: string | null): OtmetkaKartochek | null {
  if (raw === null) return null;
  try {
    const x = JSON.parse(raw) as Partial<OtmetkaKartochek>;
    if (
      typeof x.item !== 'string' ||
      typeof x.homework !== 'string' ||
      typeof x.title !== 'string' ||
      typeof x.need !== 'number' ||
      typeof x.at !== 'number' ||
      !Array.isArray(x.ids) ||
      Date.now() - x.at > SROK
    ) {
      return null;
    }
    return {
      ...(x as OtmetkaKartochek),
      ids: x.ids.filter((id): id is string => typeof id === 'string').slice(0, 500),
    };
  } catch {
    return null;
  }
}

export function prochestOtmetku(taskNo: number): OtmetkaKartochek | null {
  let raw: string | null = null;
  try {
    raw = browserStorage()?.getItem(KEY(taskNo)) ?? null;
  } catch {
    raw = null;
  }
  const k = kesh.get(taskNo);
  if (k !== undefined && k.raw === raw) return k.v;
  const v = razobrat(raw);
  kesh.set(taskNo, { raw, v });
  return v;
}

function zapisat(taskNo: number, v: OtmetkaKartochek | null): void {
  try {
    if (v === null) browserStorage()?.removeItem(KEY(taskNo));
    else browserStorage()?.setItem(KEY(taskNo), JSON.stringify(v));
  } catch {
    /* Хранилище недоступно — карточки просто не засчитаются автоматически. */
  }
  slushateli.forEach((f) => f());
}

/** Экран ДЗ: «Открыть карточки» — дальше карточки раздела идут в этот элемент. */
export function nachatOtmetku(taskNo: number, o: Omit<OtmetkaKartochek, 'ids' | 'at'>): void {
  const old = prochestOtmetku(taskNo);
  zapisat(taskNo, { ...o, ids: old?.item === o.item ? old.ids : [], at: Date.now() });
}

/**
 * Вкладка «Карточки»: карточка пройдена. Новая — база узнаёт, сколько
 * разных пройдено. Ошибка базы не мешает карточкам.
 */
export function otmetitKartochku(taskNo: number, id: string): void {
  const o = prochestOtmetku(taskNo);
  if (o === null || o.ids.includes(id)) return;
  const dalshe = { ...o, ids: [...o.ids, id], at: Date.now() };
  zapisat(taskNo, dalshe);
  void import('./api')
    .then(({ dz2Mark }) => dz2Mark(dalshe.item, dalshe.ids.length))
    .catch(() => undefined);
}

export function useOtmetka(taskNo: number): OtmetkaKartochek | null {
  return useSyncExternalStore(
    (f) => {
      slushateli.add(f);
      return () => slushateli.delete(f);
    },
    () => prochestOtmetku(taskNo),
    () => null,
  );
}
