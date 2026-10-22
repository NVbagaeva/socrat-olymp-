'use client';

/**
 * Лёгкое чтение сессии — без SDK.
 *
 * Шапка стоит на каждой странице и должна знать, вошёл ли человек.
 * Тащить ради этого SDK (≈45 КБ gz) в первую загрузку нельзя: бюджет
 * scripts/check-first-load.mjs. Поэтому здесь читается то, что SDK
 * сам кладёт в хранилище под ключом SESSION_KEY: токены и объект
 * пользователя. Имя и роль берутся из user_metadata — их туда пишет
 * регистрация и правка профиля (lib/auth/profile.ts).
 *
 * Сессия может оказаться просроченной: это не повод считать человека
 * вышедшим — у SDK есть refresh-токен, он обновит её при загрузке на
 * странице входа или кабинета. Если refresh-токен отозван (вышли на
 * другом устройстве), кабинет сам отправит на вход.
 */

import { useSyncExternalStore } from 'react';
import { REMEMBER_KEY, SESSION_EVENT, SESSION_KEY } from './config';

export type UserRole = 'student' | 'tutor';

export interface SessionUser {
  id: string;
  email: string;
  name: string;
  role: UserRole;
}

interface StoredSession {
  access_token?: string;
  user?: {
    id?: string;
    email?: string;
    user_metadata?: { name?: unknown; role?: unknown };
  };
}

export function roleOf(value: unknown): UserRole {
  return value === 'tutor' ? 'tutor' : 'student';
}

function area(kind: 'local' | 'session'): Storage | null {
  try {
    if (typeof window === 'undefined') return null;
    return kind === 'local' ? window.localStorage : window.sessionStorage;
  } catch {
    return null;
  }
}

/** Помнить ли сессию между сеансами браузера. По умолчанию — да. */
export function rememberMe(): boolean {
  try {
    return area('local')?.getItem(REMEMBER_KEY) !== '0';
  } catch {
    return true;
  }
}

export function setRememberMe(value: boolean): void {
  try {
    area('local')?.setItem(REMEMBER_KEY, value ? '1' : '0');
  } catch {
    /* Нет хранилища — сессия просто не переживёт закрытие вкладки. */
  }
}

/** Сырое значение сессии из любого из двух хранилищ. */
export function readStoredSession(key: string): string | null {
  try {
    return area('local')?.getItem(key) ?? area('session')?.getItem(key) ?? null;
  } catch {
    return null;
  }
}

export function writeStoredSession(key: string, value: string): void {
  try {
    const target = rememberMe() ? area('local') : area('session');
    target?.setItem(key, value);
    /* Второе хранилище очищается: сессия живёт в одном месте. */
    (rememberMe() ? area('session') : area('local'))?.removeItem(key);
  } catch {
    /* см. setRememberMe */
  }
}

export function removeStoredSession(key: string): void {
  try {
    area('local')?.removeItem(key);
    area('session')?.removeItem(key);
  } catch {
    /* см. setRememberMe */
  }
}

function parse(raw: string | null): SessionUser | null {
  if (raw === null) return null;
  try {
    const data = JSON.parse(raw) as StoredSession;
    const user = data.user;
    if (typeof data.access_token !== 'string' || user?.id === undefined) return null;
    const meta = user.user_metadata ?? {};
    return {
      id: user.id,
      email: user.email ?? '',
      name: typeof meta.name === 'string' ? meta.name : '',
      role: roleOf(meta.role),
    };
  } catch {
    return null;
  }
}

let cache: SessionUser | null | undefined;

/** Текущий пользователь по хранилищу; null — не вошёл. */
export function currentUser(): SessionUser | null {
  if (cache === undefined) {
    cache = parse(readStoredSession(SESSION_KEY));
  }
  return cache;
}

/** Сообщить всем подписчикам, что сессия изменилась. */
export function sessionChanged(): void {
  cache = undefined;
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new Event(SESSION_EVENT));
  }
}

function subscribe(onChange: () => void): () => void {
  const fromStorage = (event: StorageEvent) => {
    if (event.key === null || event.key === SESSION_KEY) {
      cache = undefined;
      onChange();
    }
  };
  window.addEventListener(SESSION_EVENT, onChange);
  window.addEventListener('storage', fromStorage);
  return () => {
    window.removeEventListener(SESSION_EVENT, onChange);
    window.removeEventListener('storage', fromStorage);
  };
}

/**
 * Пользователь в React. На сервере и при гидратации — null: разметка
 * сборки показывает «Войти», в браузере она сразу обновляется.
 */
export function useSessionUser(): SessionUser | null {
  return useSyncExternalStore(subscribe, currentUser, () => null);
}

/** Инициалы для кружка в шапке: «Наталья Багаева» → «НБ», без имени — первая буква почты. */
export function initialsOf(user: Pick<SessionUser, 'name' | 'email'>): string {
  const words = user.name.trim().split(/\s+/).filter(Boolean);
  if (words.length >= 2) {
    return (words[0]!.charAt(0) + words[1]!.charAt(0)).toUpperCase();
  }
  if (words.length === 1) {
    return words[0]!.slice(0, 2).toUpperCase();
  }
  return user.email.charAt(0).toUpperCase() || '?';
}
