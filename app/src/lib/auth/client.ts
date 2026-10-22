'use client';

/**
 * Клиент Supabase. Грузится динамически и только там, где нужен:
 * страницы входа, кабинет, кнопка «Выйти», запись комплекта. Шапка
 * обходится без него (session.ts).
 *
 * Поток входа — implicit: ссылка из письма приносит токены в якоре
 * адреса (#access_token=…), и они не уходят на сервер хостинга.
 * PKCE здесь не подошёл бы: его код проверки живёт в хранилище того
 * браузера, где начали регистрацию, а письмо на телефоне часто
 * открывается в другом.
 *
 * Хранилище — своё: сессия лежит в localStorage («Запомнить меня»)
 * или в sessionStorage, читается из обоих.
 */

import type { SupabaseClient, createClient as CreateClient } from '@supabase/supabase-js';
import { SESSION_KEY, SUPABASE_ANON_KEY, SUPABASE_URL } from './config';
import {
  readStoredSession,
  removeStoredSession,
  sessionChanged,
  writeStoredSession,
} from './session';

let client: Promise<SupabaseClient> | null = null;

/* Условие написано буквально, через process.env, а не через AUTH_ENABLED:
   webpack вычисляет его при сборке и без флага выбрасывает ветку вместе
   с import() — кусок SDK в сборку не попадает (scripts/check-auth.mjs
   --disabled это проверяет). */
function loadSdk(): Promise<{ createClient: typeof CreateClient }> {
  if (process.env.AUTH_ON === '1') {
    return import('@supabase/supabase-js');
  }
  return Promise.reject(new Error('auth disabled'));
}

export function getClient(): Promise<SupabaseClient> {
  if (client === null) {
    client = loadSdk().then(({ createClient }) => {
      const made = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
        auth: {
          storageKey: SESSION_KEY,
          storage: {
            getItem: (key) => readStoredSession(key),
            setItem: (key, value) => writeStoredSession(key, value),
            removeItem: (key) => removeStoredSession(key),
          },
          flowType: 'implicit',
          detectSessionInUrl: true,
          persistSession: true,
          autoRefreshToken: true,
        },
      });
      /* Любое изменение сессии — шапке: она читает хранилище сама. */
      made.auth.onAuthStateChange(() => {
        sessionChanged();
      });
      return made;
    });
  }
  return client;
}

/** Выход: сессия отзывается на сервере, хранилище очищается. */
export async function signOut(): Promise<void> {
  const supabase = await getClient();
  const { error } = await supabase.auth.signOut();
  if (error) {
    /* Сервер недоступен — всё равно забываем сессию у себя. */
    await supabase.auth.signOut({ scope: 'local' });
  }
  removeStoredSession(SESSION_KEY);
  sessionChanged();
}
