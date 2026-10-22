/**
 * Настройки входа. Все три значения приходят из переменных сборки
 * (GitHub → Settings → Secrets and variables → Actions → Variables),
 * в репозитории их нет:
 *
 *   NEXT_PUBLIC_AUTH_ENABLED     «1» — на сайте есть вход;
 *   NEXT_PUBLIC_SUPABASE_URL     адрес проекта, https://xxxx.supabase.co;
 *   NEXT_PUBLIC_SUPABASE_ANON_KEY публичный ключ проекта (anon / publishable).
 *
 * Публичный ключ по замыслу Supabase уходит в браузер: сам он ничего
 * не открывает, доступ к строкам решают правила базы (RLS). Секретный
 * ключ service_role в сборку попадать не должен — это ловит
 * scripts/check-bundle-secrets.mjs.
 *
 * Флаг выключен или адреса нет — входа на сайте нет вообще: ни кнопки
 * в шапке, ни загрузки SDK. Сайт работает как раньше.
 */

export const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL ?? '';
export const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? '';

/* AUTH_ON считает next.config.ts из трёх переменных выше: «1» или «0»
   всегда, поэтому условие вычисляется на сборке. */
export const AUTH_ENABLED = process.env.AUTH_ON === '1';

/** Ключ сессии в хранилище браузера: его читает и SDK, и лёгкий модуль session.ts. */
export const SESSION_KEY = 'budetege-auth';

/** «Запомнить меня»: где держать сессию — localStorage («1») или sessionStorage. */
export const REMEMBER_KEY = 'budetege:auth:remember';

/** Событие в окне: сессия изменилась (вход, выход, обновление имени). */
export const SESSION_EVENT = 'budetege:auth';

/** Адреса страниц входа. */
export const AUTH_HREF = {
  voyti: '/voyti/',
  registraciya: '/voyti/?vkladka=registraciya',
  podtverzhdenie: '/voyti/podtverzhdenie/',
  novyyParol: '/voyti/novyy-parol/',
  kabinet: '/kabinet/',
} as const;
