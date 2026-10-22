/**
 * Что посетитель ответил на баннер о cookie. Хранится в localStorage:
 * сам баннер относится к необходимым настройкам.
 *
 * { seen: true }                   — прочитал баннер «Понятно»;
 * { seen: true, analytics: bool }  — ответил на вопрос об аналитике.
 *
 * Пока аналитики нет, хватает seen. Когда в content/legal/cookies.ts
 * включат analytics.enabled, запись без поля analytics снова покажет
 * баннер — уже с вопросом.
 */

import { cookieNotice } from '@/content/legal/cookies';

export const COOKIE_NOTICE_KEY = 'budetege:cookie-notice:v1';

export interface CookieChoice {
  seen: boolean;
  analytics?: boolean;
}

export function readCookieChoice(): CookieChoice | null {
  try {
    const raw = window.localStorage.getItem(COOKIE_NOTICE_KEY) ?? memory;
    return raw ? (JSON.parse(raw) as CookieChoice) : null;
  } catch {
    return memory ? (JSON.parse(memory) as CookieChoice) : null;
  }
}

const listeners = new Set<() => void>();
/* Ответ, сохранённый в этой вкладке, — на случай закрытого хранилища. */
let memory: string | null = null;

export function saveCookieChoice(choice: CookieChoice): void {
  memory = JSON.stringify(choice);
  try {
    window.localStorage.setItem(COOKIE_NOTICE_KEY, memory);
  } catch {
    /* Хранилище закрыто (приватный режим) — в другой вкладке баннер покажется снова, это не страшно. */
  }
  listeners.forEach((l) => l());
}

/** Для useSyncExternalStore: изменения в этой и в соседних вкладках. */
export function subscribeCookieChoice(listener: () => void): () => void {
  listeners.add(listener);
  window.addEventListener('storage', listener);
  return () => {
    listeners.delete(listener);
    window.removeEventListener('storage', listener);
  };
}

/** Показывать ли баннер сейчас — снимок для useSyncExternalStore. */
export function cookieNoticeSnapshot(): boolean {
  return needsCookieNotice(readCookieChoice());
}

/** Показывать ли баннер при таком ответе. */
export function needsCookieNotice(
  choice: CookieChoice | null,
  analyticsEnabled: boolean = cookieNotice.analytics.enabled,
): boolean {
  if (!choice?.seen) return true;
  return analyticsEnabled && typeof choice.analytics !== 'boolean';
}

/** Можно ли загружать счётчик аналитики. Пока аналитики нет — всегда false. */
export function hasAnalyticsConsent(): boolean {
  return cookieNotice.analytics.enabled && readCookieChoice()?.analytics === true;
}
