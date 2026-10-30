/**
 * Наборы разделов с готовыми вариантами: «Варианты повышенной
 * сложности» (код PV-07, шесть версий) и «Ежемесячные варианты» (код
 * EV-02, одна версия). Онлайн-режим, лист и результаты узнают по коду,
 * что перед ними набор раздела, а не партия «Собрать вариант», и берут
 * отсюда подписи и адрес раздела.
 *
 * Модуль лёгкий: движков и данных здесь нет.
 */

import { EZH_HREF, EZH_SCREEN, EZH_TITLE, EZH_VARIANT_LABEL } from '@/content/ezhemesyachnye';
import { POV_HREF, POV_SCREEN, POV_TITLE, POV_VERSION_LABEL } from '@/content/povyshennye';
import { ezhNomer } from '@/lib/ezhemesyachnye/kod';
import { povNomer, versiyaText } from './kod';

export type RazdelId = 'pv' | 'ev';

export interface NaborRazdela {
  razdel: RazdelId;
  /** Номер варианта в разделе. */
  k: number;
}

/** Набор раздела по коду; null — это партия «Собрать вариант». */
export function naborRazdela(code: string): NaborRazdela | null {
  const pv = povNomer(code);
  if (pv !== null) return { razdel: 'pv', k: pv };
  const ev = ezhNomer(code);
  if (ev !== null) return { razdel: 'ev', k: ev };
  return null;
}

/** Название работы на листе и в шапке решения: «Вариант повышенной сложности». */
export function naborTitle(n: NaborRazdela): string {
  return n.razdel === 'pv' ? POV_TITLE : EZH_TITLE;
}

/** Подпись версии: «Вариант 7.3» или «Октябрь 2026». */
export function naborVersiya(n: NaborRazdela, v: number): string {
  return n.razdel === 'pv' ? POV_VERSION_LABEL(versiyaText(n.k, v)) : EZH_VARIANT_LABEL(n.k);
}

/** Адрес экрана раздела. */
export function naborHref(n: NaborRazdela): string {
  return n.razdel === 'pv' ? POV_HREF : EZH_HREF;
}

/** Название раздела для крошек: «Варианты повышенной сложности». */
export function naborRazdelTitle(n: NaborRazdela): string {
  return n.razdel === 'pv' ? POV_SCREEN.title : EZH_SCREEN.title;
}
