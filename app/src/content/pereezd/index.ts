/**
 * Переезд адресов банка на коды разделов (docs/ege-2027-struktura-shag-0.md,
 * раздел 5): /zadaniya/7/teoriya/ → /zadaniya/uravneniya/teoriya/.
 *
 * starye-adresa.json — все страницы банка профиля по номеру, снятые со
 * сборки до переезда (main 7c8388a7), и куда каждая ведёт теперь. Для
 * прежних заглушек «Страница переехала» цель — сразу итоговая, без
 * цепочки. Адресов скрытого раздела (№6 хранения) в таблице нет: им —
 * 404 (scripts/build-skrytye.mjs).
 *
 * По каждому адресу собирается заглушка (app/zadaniya/[task]); сервер
 * отвечает 301 раньше — правила в public/.htaccess пишет
 * scripts/build-pereezd.mjs из этой же таблицы и структуры.
 */

import STARYE from './starye-adresa.json';

export const STARYE_ADRESA: Readonly<Record<string, string>> = STARYE;

/** Куда ведёт прежний адрес: «/zadaniya/7/teoriya/» → новый; не прежний — undefined. */
export function novyyAdres(staryy: string): string | undefined {
  return STARYE_ADRESA[staryy];
}

/** Прежние адреса как части пути: ['7'], ['7', 'teoriya'], … */
export function chastiStarykh(): string[][] {
  return Object.keys(STARYE_ADRESA).map((a) => a.split('/').filter(Boolean).slice(1));
}
