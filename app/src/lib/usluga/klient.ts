/**
 * Значения, которые есть только в браузере: адрес страницы, сегодняшняя
 * дата, момент открытия формы. Читаются через useSyncExternalStore —
 * как хранилище прогресса в lib/prepProgress.ts: на сервере и при
 * первой отрисовке берётся запасное значение, в браузере — настоящее,
 * без setState в эффекте и без расхождения разметки.
 *
 * Снимки кешируются на весь визит: useSyncExternalStore требует,
 * чтобы снимок не менялся между вызовами.
 */

import { useSyncExternalStore } from 'react';

const bezPodpiski = () => () => {};

export function useKlientskoe<T>(snimok: () => T, naServere: T): T {
  return useSyncExternalStore(bezPodpiski, snimok, () => naServere);
}

/** Строка запроса адреса: «?utm_source=…». Строка сравнивается по значению. */
export const poiskSnimok = () => window.location.search;

let otkryto = 0;
/** Момент первой отрисовки формы в браузере, мс. */
export const otkrytoSnimok = () => {
  if (otkryto === 0) otkryto = Date.now();
  return otkryto;
};
