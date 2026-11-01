/**
 * Поисковые настройки сайта в одном месте: главное зеркало, год
 * экзамена в заголовках, имя сайта, коды подтверждения.
 *
 * Главное зеркало — https://budetege.ru без www. С www, с http и с
 * /index.html хостинг уводит сюда 301-м редиректом (public/.htaccess),
 * а canonical каждой страницы собирается от этого адреса.
 */

/** Главное зеркало: схема и хост без «/» на конце. */
export const SITE_URL = 'https://budetege.ru';

/** Имя сайта: og:site_name, микроразметка, хвост заголовков. */
export const SITE_NAME = 'Будет на ЕГЭ';

/**
 * Год экзамена в заголовках разделов («Задание 13 ЕГЭ профиль 2027: …»).
 * Меняется здесь одной строкой — каждый август, когда выходит проект
 * демоверсии следующего года.
 */
export const EGE_GOD = 2027;

/** Полный адрес страницы по пути: '/zadaniya/13/' → 'https://budetege.ru/zadaniya/13/'. */
export function absUrl(path: string): string {
  return `${SITE_URL}${path.startsWith('/') ? path : `/${path}`}`;
}

/**
 * Коды подтверждения прав на сайт — из переменных окружения сборки
 * (Settings → Secrets and variables → Actions → Variables):
 * NEXT_PUBLIC_YANDEX_VERIFICATION — Яндекс Вебмастер,
 * NEXT_PUBLIC_GOOGLE_VERIFICATION — Google Search Console.
 * Пусто — метатега нет.
 */
export const VERIFICATION = {
  yandex: process.env.NEXT_PUBLIC_YANDEX_VERIFICATION ?? '',
  google: process.env.NEXT_PUBLIC_GOOGLE_VERIFICATION ?? '',
};

/** Картинка ссылки в соцсетях (scripts/build-og.mjs): 1200×630. */
export interface OgKartinka {
  /** Путь в public: /og/zadanie-13.png. */
  path: string;
  alt: string;
}

/**
 * Open Graph и Twitter с картинкой. Next.js заменяет openGraph страницы
 * целиком, а не дополняет, поэтому имя сайта, язык и адрес повторены
 * здесь; заголовок и описание подставляются из title и description.
 * Версия файла (?v=…) — та же, что у остальных картинок public/:
 * перерисовали картинку — соцсети получат новый адрес.
 */
export function ogMeta(k: OgKartinka, url: (path: string) => string) {
  const image = { url: url(k.path), width: 1200, height: 630, alt: k.alt };
  return {
    openGraph: {
      siteName: SITE_NAME,
      locale: 'ru_RU',
      type: 'website' as const,
      url: './',
      images: [image],
    },
    twitter: { card: 'summary_large_image' as const, images: [image] },
  };
}
