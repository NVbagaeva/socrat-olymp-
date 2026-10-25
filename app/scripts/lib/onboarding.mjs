/* scripts/lib/onboarding.mjs — заставка первого визита в браузерных проверках.

   При первом визите через секунду поверх страницы идёт заставка с окном
   «Добро пожаловать», как и должно у живого человека. Проверки и снимки смотрят на саму
   страницу, поэтому отмечают приветствие показанным до загрузки: так сайт
   видит человек, который уже был здесь. Ключ и формат — как в
   src/lib/onboarding.ts (через lib/storage, префикс budetege:). */

export async function welcomeSeen(target) {
  await target.addInitScript(() => {
    try {
      localStorage.setItem('budetege:onboarding:v1', JSON.stringify({ welcomeSeen: true }));
    } catch {
      /* Хранилище недоступно — заставка и так не покажется. */
    }
  });
}
