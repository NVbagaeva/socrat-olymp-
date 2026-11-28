/**
 * Адреса страниц сайта — всегда с «/» на конце.
 *
 * Сайт выгружается папками с index.html (trailingSlash: true в
 * next.config.ts), и настоящий адрес страницы — /zadaniya/, а не
 * /zadaniya. На адрес без косой черты Apache на хостинге отвечает
 * редиректом на http://…/zadaniya/ — с понижением до http: он стоит за
 * прокси и не знает, что пришли по https. Safari при переходе внутри
 * сайта такой редирект блокирует, и вместо страницы — белый экран.
 *
 * Поэтому ссылку на страницу собираем через href(), а не руками.
 * Собранный сайт проверяет scripts/check-trailing-slash.mjs.
 *
 * Адрес раздела банка — по коду раздела (`/zadaniya/uravneniya/`), а не
 * по номеру: номер ЕГЭ меняется со структурой экзамена, код — никогда
 * (docs/ege-2027-struktura-shag-0.md, раздел 3). Код говорит структура
 * (content/struktura.js). Номер хранения в адресе href() переводит в
 * код сам: href(ZADANIYA, 7, 'teoriya') → /zadaniya/uravneniya/teoriya/.
 * Прежние адреса по номеру — заглушки и 301 (content/pereezd).
 */

import { RAZDELY } from '@/content/struktura';

/**
 * Начало адресов банка заданий — без «/» на конце: к нему дописывают
 * хвост (`${razdelBase(4)}/trenazher/`). Как ссылка не используется —
 * ссылка на банк: tasksPage.href.
 */
export const ZADANIYA = '/zadaniya';

/** Сборщик варианта: href(VARIANT) → /variant/. */
export const VARIANT = '/variant';

const KOD_PO_NOMERU: ReadonlyMap<string, string> = new Map(
  RAZDELY.map((r) => [String(r.hranenie), r.kod]),
);

/** Код раздела по номеру хранения или коду: 7 → «uravneniya». */
export function kodAdresa(x: string | number): string {
  return KOD_PO_NOMERU.get(String(x)) ?? String(x);
}

/**
 * Начало адресов раздела профиля без «/» на конце — к нему дописывают
 * вкладку: razdelBase(7) → «/zadaniya/uravneniya». Принимает номер
 * хранения или код.
 */
export function razdelBase(x: string | number): string {
  return `${ZADANIYA}/${kodAdresa(x)}`;
}

/** Номер хранения раздела по коду в адресе: «uravneniya» → 7; не раздел — null. */
export function nomerPoKodu(kod: string): number | null {
  return RAZDELY.find((r) => r.kod === kod)?.hranenie ?? null;
}

/**
 * Ссылка на страницу из кусков пути: href(ZADANIYA, 4, 'trenazher') →
 * /zadaniya/veroyatnost/trenazher/. Лишние и повторные «/» между кусками убираются,
 * «/» в начале и в конце ставится. Строка запроса и якорь в последнем
 * куске остаются после косой черты: href('/zadaniya', '?part=2') →
 * /zadaniya/?part=2.
 *
 * Адрес файла (последний кусок с расширением: .pdf, .png) не трогается.
 */
export function href(...parts: readonly (string | number)[]): string {
  const joined = parts.map(String).join('/');
  const cut = joined.search(/[?#]/);
  const path = cut === -1 ? joined : joined.slice(0, cut);
  const rest = cut === -1 ? '' : joined.slice(cut);
  const chasti = path.split('/').filter(Boolean);
  /* Раздел банка профиля — по коду: номер хранения после «zadaniya»
     (но не «baza/zadaniya») переводится в код. */
  const z = chasti.indexOf('zadaniya');
  if (z !== -1 && chasti[z - 1] !== 'baza' && chasti[z + 1] !== undefined) {
    chasti[z + 1] = kodAdresa(chasti[z + 1]!);
  }
  const clean = `/${chasti.join('/')}`;
  const last = clean.slice(clean.lastIndexOf('/') + 1);
  if (/\.[a-z0-9]{1,5}$/i.test(last)) {
    return clean + rest;
  }
  return (clean === '/' ? '/' : `${clean}/`) + rest;
}

/**
 * Раздел «Устный счёт» — один для профиля и базы. Начало адреса без
 * «/» на конце, ссылки собираются через href(): href(USTNYY) →
 * /ustnyy-schet/, href(USTNYY, USTNYY_TAIL.tablica) →
 * /ustnyy-schet/tablica-umnozheniya/, страница приёма —
 * href(USTNYY, id приёма).
 */
export const USTNYY = '/ustnyy-schet';

export const USTNYY_TAIL = {
  /** Отдельный режим таблицы умножения. */
  tablica: 'tablica-umnozheniya',
  /** Экран тренировки (настройки в строке запроса). */
  trenirovka: 'trenirovka',
  /** Рейтинг — появится вместе с рейтинговыми тренировками. */
  reyting: 'reyting',
} as const;
