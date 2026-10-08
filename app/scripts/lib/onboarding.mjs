/* scripts/lib/onboarding.mjs — окно «Впервые здесь?» в браузерных проверках.

   При первом визите окно появляется через 2,5 с и закрывает страницу,
   как и должно у живого человека. Проверки и снимки смотрят на саму
   страницу, поэтому отмечают окно показанным до загрузки: так сайт
   видит человек, который уже был здесь. Ключ и формат — как в
   src/lib/onboarding.ts (через lib/storage, префикс budetege:). */

export async function welcomeSeen(target) {
  await target.addInitScript(() => {
    try {
      localStorage.setItem('budetege:onboarding:v1', JSON.stringify({ welcomeSeen: true }));
    } catch {
      /* Хранилище недоступно — окно и так не покажется. */
    }
  });
}
