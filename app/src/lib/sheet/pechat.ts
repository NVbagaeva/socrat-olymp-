/**
 * Печать листа — одна на все разделы.
 *
 * Окно печати открывается, только когда шрифты листа загружены, вместе
 * с начертаниями KaTeX (paginate.js, window.sheetShrifty), и раскладка
 * устоялась (два кадра). Иначе Safari печатал формулы запасным шрифтом:
 * числитель поверх знаменателя, строки списка уезжали вниз.
 */

declare global {
  interface Window {
    sheetShrifty?: () => Promise<unknown>;
  }
}

function dvaKadra(): Promise<void> {
  return new Promise((resolve) => {
    requestAnimationFrame(() => requestAnimationFrame(() => resolve()));
  });
}

/** Дождаться шрифтов листа. */
export async function shriftyLista(): Promise<void> {
  const zhdat = window.sheetShrifty?.() ?? document.fonts?.ready;
  await Promise.resolve(zhdat).catch(() => undefined);
}

/** Открыть окно печати, когда лист готов. */
export async function pechatat(): Promise<void> {
  await shriftyLista();
  await dvaKadra();
  window.print();
}
