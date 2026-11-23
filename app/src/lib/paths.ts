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
 */

/**
 * Начало адресов банка заданий — без «/» на конце: к нему дописывают
 * хвост (`${ZADANIYA}/4/trenazher/`). Как ссылка не используется —
 * ссылка на банк: tasksPage.href.
 */
export const ZADANIYA = '/zadaniya';

/**
 * Ссылка на страницу из кусков пути: href(ZADANIYA, 4, 'trenazher') →
 * /zadaniya/4/trenazher/. Лишние и повторные «/» между кусками убираются,
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
  const clean = `/${path.split('/').filter(Boolean).join('/')}`;
  const last = clean.slice(clean.lastIndexOf('/') + 1);
  if (/\.[a-z0-9]{1,5}$/i.test(last)) {
    return clean + rest;
  }
  return (clean === '/' ? '/' : `${clean}/`) + rest;
}

/**
 * Вкладка «Теория» раздела задания — хвост адреса без «/»:
 * href(ZADANIYA, 4, TEORIYA_TAIL) → /zadaniya/4/teoriya/.
 */
export const TEORIYA_TAIL = 'teoriya';

/**
 * Якорь раздела теории на странице (id блока): раздел «metod-kubiki» →
 * «teoriya-metod-kubiki». По нему прокручивает содержание
 * (TeoriyaShell) и на него ведут ссылки снаружи.
 */
export function teoriyaYakor(razdel: string): string {
  return `teoriya-${razdel}`;
}

/**
 * Раздел теории с главой метода: метод «kubiki» → раздел «metod-kubiki».
 * Префикс отделяет главы методов от прежних разделов («klassicheskaya»
 * у №4 есть и раздел, и метод).
 */
export function glavaMetoda(metod: string): string {
  return `metod-${metod}`;
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
