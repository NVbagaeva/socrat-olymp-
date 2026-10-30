/**
 * Код набора раздела «Ежемесячные варианты»: «EV-02» — вариант 2
 * (ноябрь 2026). Версия у варианта одна (`v=1` в ссылке решения).
 * Тем же кодом пользуются онлайн-режим, лист и страница результата.
 *
 * Модуль лёгкий: экран раздела импортирует его без движков.
 */

import { EZH_MESYACY } from '@/content/ezhemesyachnye';

const KOD = /^EV-(\d{2})$/;

export const EZH_VARIANTOV = EZH_MESYACY.length;

export function ezhKod(k: number): string {
  return `EV-${String(k).padStart(2, '0')}`;
}

/** Номер варианта по коду; null — это не код раздела. */
export function ezhNomer(code: string): number | null {
  const m = KOD.exec(code.trim().toUpperCase());
  if (m === null) return null;
  const k = Number(m[1]);
  return k >= 1 && k <= EZH_VARIANTOV ? k : null;
}
