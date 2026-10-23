'use client';

/**
 * Профиль в базе (таблица profiles) и его связь с сессией.
 *
 * Имя и роль живут в двух местах нарочно: в profiles — как источник
 * истины для базы и правил доступа, и в user_metadata сессии — чтобы
 * шапка показывала инициалы без похода в базу. Правка меняет оба.
 */

import { storage } from '@/lib/storage';
import { getClient, signOut } from './client';
import { SESSION_KEY } from './config';
import { roleOf, removeStoredSession, sessionChanged, type UserRole } from './session';

export interface Profile {
  id: string;
  name: string;
  role: UserRole;
  /** Когда окно «Впервые здесь?» было отмечено просмотренным. null — не было. */
  welcomeSeenAt: string | null;
  /** Тур, который начинали или прошли на этом аккаунте. */
  tourId: string | null;
  tourDone: boolean;
  createdAt: string;
}

interface ProfileRow {
  id: string;
  name: string;
  role: string;
  welcome_seen_at: string | null;
  tour_id: string | null;
  tour_done: boolean;
  created_at: string;
}

function fromRow(row: ProfileRow): Profile {
  return {
    id: row.id,
    name: row.name,
    role: roleOf(row.role),
    welcomeSeenAt: row.welcome_seen_at,
    tourId: row.tour_id,
    tourDone: row.tour_done,
    createdAt: row.created_at,
  };
}

export class ProfileError extends Error {
  readonly code: string | undefined;
  readonly status: number | undefined;
  constructor(message: string, code?: string, status?: number) {
    super(message);
    this.code = code;
    this.status = status;
  }
}

/** Профиль вошедшего. null — сессии нет. */
export async function loadProfile(): Promise<Profile | null> {
  const supabase = await getClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (user === null) return null;
  const { data, error } = await supabase
    .from('profiles')
    .select('id, name, role, welcome_seen_at, tour_id, tour_done, created_at')
    .eq('id', user.id)
    .maybeSingle<ProfileRow>();
  if (error) throw new ProfileError(error.message, error.code);
  if (data === null) {
    /* Триггер ещё не создал строку (редко, сразу после регистрации):
       показываем то, что есть в сессии. */
    const meta = user.user_metadata as { name?: unknown; role?: unknown };
    return {
      id: user.id,
      name: typeof meta.name === 'string' ? meta.name : '',
      role: roleOf(meta.role),
      welcomeSeenAt: null,
      tourId: null,
      tourDone: false,
      createdAt: user.created_at,
    };
  }
  return fromRow(data);
}

export async function updateProfile(patch: { name: string; role: UserRole }): Promise<Profile> {
  const supabase = await getClient();
  const name = patch.name.trim().slice(0, 80);
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();
  if (userError || user === null) throw new ProfileError('no session', 'session_not_found', 401);
  const { data, error } = await supabase
    .from('profiles')
    .update({ name, role: patch.role })
    .eq('id', user.id)
    .select('id, name, role, welcome_seen_at, tour_id, tour_done, created_at')
    .single<ProfileRow>();
  if (error) throw new ProfileError(error.message, error.code);
  /* Сессия — следом: шапка читает имя и роль оттуда. */
  const { error: metaError } = await supabase.auth.updateUser({ data: { name, role: patch.role } });
  if (metaError) throw new ProfileError(metaError.message, metaError.code, metaError.status);
  sessionChanged();
  return fromRow(data);
}

/* ── Факты онбординга из браузера ─────────────────────────────── */

interface OnboardingLocal {
  welcomeSeen?: boolean;
  active?: string | null;
  tours?: Record<string, { step?: number; done?: boolean } | undefined>;
}

/**
 * Что онбординг (lib/onboarding.ts, ключ onboarding:v1) успел записать
 * в этом браузере. Модуля онбординга в сборке может не быть — читаем
 * хранилище напрямую, по его формату.
 */
export function localOnboarding(): {
  welcomeSeen: boolean;
  tourId: string | null;
  tourDone: boolean;
} {
  const raw = storage.get<OnboardingLocal>('onboarding:v1', {});
  const tours = raw.tours ?? {};
  const ids = Object.keys(tours);
  const done = ids.find((id) => tours[id]?.done === true) ?? null;
  const tourId = done ?? raw.active ?? ids[0] ?? null;
  return { welcomeSeen: raw.welcomeSeen === true, tourId, tourDone: done !== null };
}

/**
 * Перенести факты онбординга в профиль — только то, чего там ещё нет.
 * Ошибки глотаются: это фон, а не действие человека.
 */
export async function syncOnboarding(profile: Profile): Promise<Profile> {
  const local = localOnboarding();
  const patch: Partial<ProfileRow> = {};
  if (profile.welcomeSeenAt === null && local.welcomeSeen) {
    patch.welcome_seen_at = new Date().toISOString();
  }
  if (local.tourId !== null && (profile.tourId === null || (!profile.tourDone && local.tourDone))) {
    patch.tour_id = local.tourId;
    patch.tour_done = local.tourDone;
  }
  if (Object.keys(patch).length === 0) return profile;
  try {
    const supabase = await getClient();
    const { data, error } = await supabase
      .from('profiles')
      .update(patch)
      .eq('id', profile.id)
      .select('id, name, role, welcome_seen_at, tour_id, tour_done, created_at')
      .single<ProfileRow>();
    if (error || data === null) return profile;
    return fromRow(data);
  } catch {
    return profile;
  }
}

/* ── Удаление ─────────────────────────────────────────────────── */

/**
 * Удалить аккаунт целиком: функция базы delete_own_account удаляет
 * пользователя, профиль и комплекты уходят каскадом. Потом — выход
 * и чистое хранилище сессии. Прогресс тренажёра в браузере не трогается.
 */
export async function deleteAccount(): Promise<void> {
  const supabase = await getClient();
  const { error } = await supabase.rpc('delete_own_account');
  if (error) throw new ProfileError(error.message, error.code);
  try {
    await signOut();
  } catch {
    /* Пользователя уже нет — серверу отзывать нечего. */
  }
  removeStoredSession(SESSION_KEY);
  sessionChanged();
}
