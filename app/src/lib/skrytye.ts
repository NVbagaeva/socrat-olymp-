/**
 * Метка администратора для скрытых разделов (content/struktura.js, skryt).
 *
 * Сайт — статический: страницы скрытого раздела лежат на хостинге, как
 * и все остальные. Закрывает их сервер: без метки адрес отвечает 404
 * (правила пишет scripts/build-skrytye.mjs в out/.htaccess). Метка —
 * cookie, а не запись в localStorage: её должен видеть сервер. Ставит
 * её кабинет администратора кнопкой «Открыть».
 *
 * Это скрытие, а не защита: поставить cookie может кто угодно, а
 * секретов в разделе нет — это обычные учебные материалы.
 */

/** Имя cookie. То же имя — в scripts/build-skrytye.mjs. */
export const METKA_SKRYTYH = 'budetege_skrytye';

/**
 * Пробная сборка с открытыми скрытыми разделами (SKRYTYE=1, как
 * GALEREYA=1): для превью pull request, где войти администратором
 * нельзя. На хостинг такая сборка не выкладывается.
 */
export const SKRYTYE_VSEM = process.env.SKRYTYE_VSEM === '1';

/** Стоит ли метка в этом браузере. На сервере (при сборке) — нет. */
export function estMetka(): boolean {
  if (typeof document === 'undefined') {
    return false;
  }
  return document.cookie.split(';').some((part) => part.trim() === `${METKA_SKRYTYH}=1`);
}

/** Поставить метку на полгода: администратору не нужно открывать кабинет каждый раз. */
export function postavitMetku(): void {
  const secure = window.location.protocol === 'https:' ? '; Secure' : '';
  document.cookie = `${METKA_SKRYTYH}=1; Path=/; Max-Age=${60 * 60 * 24 * 180}; SameSite=Lax${secure}`;
}

/** Снять метку: раздел в этом браузере снова закрыт. */
export function snyatMetku(): void {
  document.cookie = `${METKA_SKRYTYH}=; Path=/; Max-Age=0; SameSite=Lax`;
}
