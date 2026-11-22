/* scripts/lib/metka-skrytyh.mjs — метка администратора для скрытых разделов.

   Проверки, которые обходят страницы раздела целиком (липкая панель,
   прогресс, перенос прогресса), открывают и скрытый раздел — так, как
   его видит администратор: с cookie-меткой (lib/skrytye.ts), над
   разделом плашка причины. Что посетитель раздела не видит, проверяет
   pnpm test:skrytye. */

/** Имя cookie — то же, что METKA_SKRYTYH в src/lib/skrytye.ts. */
export const METKA_SKRYTYH = 'budetege_skrytye';

/**
 * Поставить метку во всех страницах контекста Playwright до их сценариев.
 * base — адрес сервера: тогда cookie уходит и с первым запросом (нужно,
 * когда сайт отдаёт Apache с правилами 404 из .htaccess сборки).
 */
export async function metkaAdministratora(context, base) {
  if (base !== undefined) {
    await context.addCookies([{ name: METKA_SKRYTYH, value: '1', url: base }]);
  }
  await context.addInitScript((imya) => {
    document.cookie = `${imya}=1; Path=/`;
  }, METKA_SKRYTYH);
}
