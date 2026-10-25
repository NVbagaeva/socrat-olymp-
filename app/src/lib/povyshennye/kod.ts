/**
 * Код набора раздела: «PV-07» — вариант 7, номер версии — номер
 * варианта в наборе (`v` в ссылке решения). Тем же кодом пользуются
 * онлайн-режим, лист и страница проверки результата «Собрать вариант»:
 * они узнают код раздела и берут набор здесь, а не у сборщика партий.
 *
 * Модуль лёгкий: экран раздела импортирует его без движков.
 */

import { VARIANTOV } from './types';

const KOD = /^PV-(\d{2})$/;

export function povKod(k: number): string {
  return `PV-${String(k).padStart(2, '0')}`;
}

/** Номер варианта по коду; null — это не код раздела. */
export function povNomer(code: string): number | null {
  const m = KOD.exec(code.trim().toUpperCase());
  if (m === null) return null;
  const k = Number(m[1]);
  return k >= 1 && k <= VARIANTOV ? k : null;
}

/** Подпись версии: «7.3». */
export function versiyaText(k: number, v: number): string {
  return `${k}.${v}`;
}
