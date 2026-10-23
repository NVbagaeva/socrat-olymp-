/**
 * Адрес страницы «Как пользоваться сайтом» и её вкладок. Отдельно от
 * content/onboarding.ts: адрес нужен шапке и меню на каждой странице, а
 * тексты туров и окна — только онбордингу, который грузится отдельным
 * куском.
 */

/** Адрес страницы «Как пользоваться сайтом». */
export const HOWTO_HREF = '/kak-polzovatsya/';

/** Вкладки страницы: адрес вкладки — ?dlya=… */
export type HowtoTab = 'uchenik' | 'repetitor';

export function howtoHref(tab: HowtoTab): string {
  return `${HOWTO_HREF}?dlya=${tab}`;
}
