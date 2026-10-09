import { VKLADKA_PARAM, VKLADKA_PO_UMOLCHANIYU, type RazdelKarta } from './types';

/**
 * Вкладки без своего адреса: они переключаются на месте, и в другой
 * раздел их несёт параметр ?vkladka=. У «Опорных задач» и «Тренажёра»
 * адреса свои — параметр им не нужен.
 */
const NA_MESTE = new Set(['theory', 'methods', 'generator']);

export function vkladkaNaMeste(id: string): boolean {
  return NA_MESTE.has(id);
}

/**
 * Куда вести в другом разделе: на ту же вкладку, а если такой у
 * раздела нет — на «О задании».
 */
export function adresVkladki(razdel: RazdelKarta, vkladka: string): string {
  return razdel.vkladki[vkladka] ?? razdel.vkladki[VKLADKA_PO_UMOLCHANIYU] ?? '';
}

/** Адрес этой страницы с открытой вкладкой (или без параметра). */
function sVkladkoy(vkladka: string | null): string {
  const url = new URL(window.location.href);
  if (vkladka !== null && vkladkaNaMeste(vkladka)) {
    url.searchParams.set(VKLADKA_PARAM, vkladka);
  } else {
    url.searchParams.delete(VKLADKA_PARAM);
  }
  return url.pathname + url.search + url.hash;
}

/**
 * Сменить адрес текущей записи истории. Состояние передаётся без
 * служебных полей Next.js: тогда его обёртка над history сама перенесёт
 * их и запомнит новый адрес у себя. С ними она пропустила бы вызов,
 * и следующая же отрисовка роутера вернула бы прежний адрес.
 */
function zamenitAdres(next: string): void {
  if (next !== window.location.pathname + window.location.search + window.location.hash) {
    window.history.replaceState(null, '', next);
  }
}

/**
 * Запомнить открытую вкладку в адресе текущей записи истории — перед
 * уходом в другой раздел. Тогда «Назад» вернёт не на «О задании», а
 * на ту вкладку, с которой ушли.
 */
export function zapomnitVkladku(vkladka: string): void {
  zamenitAdres(sVkladkoy(vkladka));
}

/** Вкладка из адреса: ?vkladka=theory → 'theory'; нет или чужая — null. */
export function vkladkaIzAdresa(): string | null {
  const value = new URLSearchParams(window.location.search).get(VKLADKA_PARAM);
  return value !== null && vkladkaNaMeste(value) ? value : null;
}

/**
 * Убрать параметр, когда открыта уже другая вкладка: адрес не должен
 * обещать «Теорию», если на экране «О задании».
 */
export function sbrositVkladku(open: string): void {
  const value = new URLSearchParams(window.location.search).get(VKLADKA_PARAM);
  if (value !== null && value !== open) {
    zamenitAdres(sVkladkoy(null));
  }
}
