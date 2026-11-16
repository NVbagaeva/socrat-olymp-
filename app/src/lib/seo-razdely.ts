/**
 * Заголовки страниц разделов №1, №8 и №16 (номера ЕГЭ; в адресе — 1, 9
 * и 13). Их файлы содержания (content/zadanie1.ts, proizvodnaya.ts,
 * zadanie13.ts) сверяет scripts/check-redesign.mjs знак за знаком,
 * поэтому новый вид заголовка (lib/seo.ts) подставляется здесь, а не
 * в них.
 */

import { PROIZVODNAYA } from '@/content/proizvodnaya';
import { ZADANIE1 } from '@/content/zadanie1';
import { ZADANIE13 } from '@/content/zadanie13';
import { zagolovokRazdela } from '@/lib/seo';

export const zadanie1Zagolovok = (tab: string) => zagolovokRazdela(1, ZADANIE1.title, tab);
export const proizvodnayaZagolovok = (tab: string) => zagolovokRazdela(9, PROIZVODNAYA.title, tab);
export const zadanie13Zagolovok = (tab: string) => zagolovokRazdela(13, ZADANIE13.title, tab);
