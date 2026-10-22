/* scripts/lib/cookie-notice.mjs — баннер cookie в браузерных проверках.

   Баннер (components/CookieNotice.tsx) показывается при первом визите
   у нижнего края и на телефоне закрывает кнопки снизу экрана: клик
   проверки попадает в него. Проверкам, которые смотрят не баннер,
   браузер отдаётся с уже прочитанным баннером — как у посетителя,
   нажавшего «Понятно». Сам баннер проверяет check-soglasiya-site.mjs.

   Так же — с окном «Впервые здесь?» (components/onboarding): при первом
   визите оно закрывает страницу целиком, поэтому браузер проверки —
   посетитель, который это окно уже видел (как lib/onboarding.mjs).
   Само окно и тур проверяют сценарии онбординга. */

export const COOKIE_NOTICE_KEY = 'budetege:cookie-notice:v1';
export const ONBOARDING_KEY = 'budetege:onboarding:v1';

/** Каждая новая вкладка браузера — с прочитанным баннером. Возвращает тот же браузер. */
export function bezBanneraCookie(browser) {
  const newContext = browser.newContext.bind(browser);
  browser.newContext = async (options) => {
    const context = await newContext(options);
    await context.addInitScript(
      ([cookieKey, onboardingKey]) => {
        try {
          window.localStorage.setItem(cookieKey, JSON.stringify({ seen: true }));
          if (window.localStorage.getItem(onboardingKey) === null) {
            window.localStorage.setItem(onboardingKey, JSON.stringify({ welcomeSeen: true }));
          }
        } catch {
          /* about:blank и страницы без хранилища — баннера там нет. */
        }
      },
      [COOKIE_NOTICE_KEY, ONBOARDING_KEY],
    );
    return context;
  };
  /* browser.newPage создаёт свой контекст в обход newContext — повторяем
     его поведение: контекст закрывается вместе со страницей. */
  browser.newPage = async (options) => {
    const context = await browser.newContext(options);
    const page = await context.newPage();
    /* Закрытие не ждут: если следом закрывается весь браузер, обещание
       отклоняется с TargetClosedError — без catch это необработанный
       отказ, и процесс падает (так падали «Снимки страниц»). Контекст
       в этом случае и так уходит вместе с браузером. */
    page.on('close', () => {
      context.close().catch(() => {});
    });
    return page;
  };
  return browser;
}

/** То же для всех браузеров, которые запустит скрипт: chromium, webkit… */
export function bezBanneraCookieVsyudu(...types) {
  for (const type of types) {
    const launch = type.launch.bind(type);
    type.launch = async (options) => bezBanneraCookie(await launch(options));
  }
}
