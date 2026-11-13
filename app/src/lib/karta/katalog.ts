/**
 * Каталог областей «Карты ЕГЭ» — для браузера: 20 заданий, их группы
 * тем и типы журнала (из content/karta/katalog.json, который собирает
 * scripts/build-karta-katalog.mjs), ключи журналов и адреса.
 */

import KATALOG from '@/content/karta/katalog.json';
import { OPORNYE } from '@/content/opornye';
import { href, ZADANIYA } from '@/lib/paths';
import type { KartaRazdel, StatusRazdela } from './model';

export interface KartaRazdelInfo extends KartaRazdel {
  nazvanie: string;
  gruppy: readonly {
    id: string;
    nazvanie: string;
    tipy: readonly string[];
    trenazher: string | null;
  }[];
}

export const KARTA_RAZDELY: readonly KartaRazdelInfo[] = KATALOG.razdely.map((r) => ({
  no: r.no,
  chast: r.chast as 1 | 2,
  status: r.status as StatusRazdela,
  nazvanie: r.nazvanie,
  gruppy: r.gruppy,
}));

/**
 * Ключи журналов попыток разделов (lib/progressLog). У разделов,
 * переведённых со счётчиков, ключ собран по одному правилу
 * (lib/progressStore.ts + LEGACY_LOGS); у №3, №8, №10, №12, №19 — свои.
 * Строки, а не импорты: модули разделов — 'use client', а каталог нужен
 * и проверкам. Что ключи не разошлись, проверяет pnpm test:karta.
 */
export const KARTA_ZHURNALY: Readonly<Record<number, string>> = {
  1: 'budetege:planimetriya-1:log:v1',
  2: 'budetege:vektory-2:log:v1',
  3: 'budetege:zadanie-3:log:v1',
  4: 'budetege:veroyatnost-4:log:v1',
  5: 'budetege:veroyatnost-5:log:v1',
  6: 'budetege:zadanie-6:log:v1',
  7: 'budetege:zadanie-7:log:v1',
  8: 'budetege:vychisleniya-8:log:v1',
  9: 'budetege:proizvodnaya-9:log:v1',
  10: 'budetege:zadanie-10:log:v1',
  11: 'budetege:zadanie-11:log:v1',
  12: 'budetege:zadanie-12:log:v1',
  13: 'budetege:zadanie-13:log:v1',
  14: 'budetege:zadanie-14:log:v1',
  18: 'budetege:zadanie-18:log:v1',
  19: 'budetege:zadanie-19:log:v1',
};

export function razdelInfo(no: number): KartaRazdelInfo {
  const r = KARTA_RAZDELY.find((x) => x.no === no);
  if (r === undefined) throw new Error(`Нет области №${no}`);
  return r;
}

/** Вкладка «О задании». */
export function oZadaniiHref(no: number): string {
  return href(ZADANIYA, String(no));
}

/**
 * Тренажёр раздела; с группой — сразу с её темами, если тренажёр
 * умеет брать выбор из адреса. null — тренажёра ещё нет.
 */
export function trenazherHref(no: number, gruppaId?: string): string | null {
  const r = razdelInfo(no);
  if (r.status !== 'gotov') return null;
  const g = gruppaId === undefined ? undefined : r.gruppy.find((x) => x.id === gruppaId);
  return g?.trenazher ?? href(ZADANIYA, String(no), 'trenazher');
}

/** Вкладка «Опорные задачи»; у раздела №12 она есть только у подтем. */
export function opornyeHref(no: number): string | null {
  const r = razdelInfo(no);
  if (r.status === 'skoro' || no === 12) return null;
  return `${href(ZADANIYA, String(no))}${OPORNYE.tail}`;
}
