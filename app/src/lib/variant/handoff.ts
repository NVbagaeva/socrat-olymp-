/**
 * Передача набора с экрана /variant/ на страницу печати.
 *
 * Страница печати открывается новой вкладкой и берёт **тот же объект**
 * `VariantSet`, что на экране, — через `window.opener`. Задачи она не
 * генерирует. Только если связи с экраном нет (вкладку перезагрузили,
 * открыли по ссылке), набор собирается заново по коду из адреса: сборка
 * детерминирована, и страница сверяет версию генератора.
 *
 * Настройки экрана и шапку работы помним в localStorage — удобство:
 * вернулся на страницу, всё на месте.
 */

import { storage } from '@/lib/storage';
import type { SheetChoice } from './sheets';
import type { VariantConfig, VariantMeta, VariantSet } from './types';

export interface PrintPayload {
  set: VariantSet;
  meta: VariantMeta;
  workTitle: string;
}

declare global {
  interface Window {
    /** Набор для вкладки печати: её `window.opener.__variantPrint`. */
    __variantPrint?: PrintPayload;
  }
}

export const PRINT_PATH = '/variant/pechat/';

export function printHref(choice: SheetChoice, code: string): string {
  const q = new URLSearchParams({ list: choice, kod: code });
  return `${PRINT_PATH}?${q.toString()}`;
}

/** Открыть лист в новой вкладке. false — браузер не дал открыть окно. */
export function openSheet(choice: SheetChoice, payload: PrintPayload): boolean {
  window.__variantPrint = payload;
  saveMeta(payload.meta);
  const w = window.open(printHref(choice, payload.set.code), '_blank');
  return w !== null;
}

/** Набор от экрана, открывшего вкладку. null — связи нет. */
export function payloadFromOpener(code: string): PrintPayload | null {
  try {
    const p = (window.opener as Window | null)?.__variantPrint;
    return p !== undefined && p.set.code === code ? p : null;
  } catch {
    return null;
  }
}

/* ── Память экрана ──────────────────────────────────────────────── */

const META_KEY = 'variant:meta';
const CONFIG_KEY = 'variant:config';

export function saveMeta(meta: VariantMeta): void {
  storage.set(META_KEY, meta);
}

export function loadMeta(): Partial<VariantMeta> | null {
  return objectOrNull(storage.get<unknown>(META_KEY, null)) as Partial<VariantMeta> | null;
}

export function saveConfig(config: VariantConfig): void {
  storage.set(CONFIG_KEY, config);
}

export function loadConfig(): Partial<VariantConfig> | null {
  return objectOrNull(storage.get<unknown>(CONFIG_KEY, null)) as Partial<VariantConfig> | null;
}

function objectOrNull(v: unknown): object | null {
  return typeof v === 'object' && v !== null && !Array.isArray(v) ? v : null;
}
