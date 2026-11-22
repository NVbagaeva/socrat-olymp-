/**
 * Что показывает таймер в каждый момент — общее для кольца на SVG и
 * 3D-кольца. Только из времени (мс активного времени, chasy.ts), не
 * из числа кадров: медленный кадр ничего не сдвигает.
 *
 *   на время   — кольцо «тает» от полного к пустому; последние 10 с
 *                подсветка уходит в оранжевый и мягко пульсирует, на
 *                нуле — короткая вспышка;
 *   секундомер — кольцо заполняется по кругу за минуту и медленно
 *                вращается (оборот за 10 минут).
 */

import { mmss, OTMETKI_SEK } from './chasy';

/** Последние секунды — тёплая подсветка и пульс. */
export const POSLEDNIE_MS = 10_000;
/** Период пульса, мс. */
export const PULS_MS = 1000;
/** Длительность вспышки на нуле, мс. */
export const VSPYSHKA_MS = 450;
/** Оборот секундомера, мс. */
export const OBOROT_MS = 600_000;

export interface TaymerKadr {
  vniz: boolean;
  /** Остаток (на время) или прошедшее время (секундомер), мс. */
  ostalos: number;
  /** Доля кольца от 0 до 1. */
  dolya: number;
  /** Последние 10 секунд. */
  poslednie: boolean;
  nol: boolean;
  /** Поворот кольца, градусы (у секундомера). */
  oborot: number;
  /** Пульс подсветки 0…1 (в последние секунды), иначе 0. */
  puls: number;
  /** Тепло подсветки 0…1: 0 — синее стекло, 1 — оранжевое. */
  teplo: number;
  /** Цифры: «1:05». */
  cifry: string;
  /** Подпись для скринридера по запросу (role=timer). */
  podpis: string;
  /** Отметка, на которой объявлять (60, 30, 10, 0 с), или null. */
  otmetka: number | null;
}

export function taymerKadr(ms: number, limitMs: number | null): TaymerKadr {
  const vniz = limitMs !== null;
  const ostalos = vniz ? Math.max(0, limitMs - ms) : 0;
  const dolya = vniz ? (limitMs > 0 ? ostalos / limitMs : 0) : (ms % 60_000) / 60_000;
  const poslednie = vniz && ostalos <= POSLEDNIE_MS && ostalos > 0;
  const nol = vniz && ostalos === 0;
  /* Пульс — синус от времени: 0 на входе в последние секунды, плавно. */
  const puls = poslednie
    ? 0.5 - 0.5 * Math.cos((2 * Math.PI * (POSLEDNIE_MS - ostalos)) / PULS_MS)
    : 0;
  /* Тепло нарастает за первую секунду последних десяти. */
  const teplo = nol ? 1 : poslednie ? Math.min(1, (POSLEDNIE_MS - ostalos) / 1000) : 0;
  const cifry = mmss(vniz ? ostalos : ms);
  const sek = Math.ceil(ostalos / 1000);
  const limitSek = Math.ceil((limitMs ?? 0) / 1000);
  const otm = vniz ? OTMETKI_SEK.filter((o) => sek <= o && o < limitSek).pop() : undefined;
  return {
    vniz,
    ostalos,
    dolya,
    poslednie,
    nol,
    oborot: vniz ? 0 : ((ms % OBOROT_MS) / OBOROT_MS) * 360,
    puls,
    teplo,
    cifry,
    podpis: cifry,
    otmetka: otm ?? null,
  };
}

/** Сила вспышки 0…1 через t мс после нуля. */
export function vspyshka(t: number): number {
  if (t < 0 || t >= VSPYSHKA_MS) return 0;
  return 1 - t / VSPYSHKA_MS;
}
