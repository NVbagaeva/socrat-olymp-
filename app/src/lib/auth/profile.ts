'use client';

/**
 * Профиль в базе (таблица profiles) и его связь с сессией.
 *
 * Имя и роль живут в двух местах нарочно: в profiles — как источник
 * истины для базы и правил доступа, и в user_metadata сессии — чтобы
 * шапка показывала инициалы без похода в базу. Правка имени меняет оба.
 * Роль из user_metadata ничего не решает: человек может править эти
 * данные сам, а права считает база по profiles.role.
 */

import { storage } from '@/lib/storage';
import { getClient, signOut } from './client';
import { SESSION_KEY } from './config';
import { roleOf, removeStoredSession, sessionChanged, type UserRole } from './session';

/** Роль в базе. Администратор назначается только на сервере (grant_admin). */
export type AccountRole = UserRole | 'admin';

export interface Profile {
  id: string;
  name: string;
  role: AccountRole;
  /** Класс школы ученика (9–11), если указан. */
  grade: number | null;
  /** Когда окно «Впервые здесь?» было отмечено просмотренным. null — не было. */
  welcomeSeenAt: string | null;
  /** Тур, который начинали или прошли на этом аккаунте. */
  tourId: string | null;
  tourDone: boolean;
  createdAt: string;
}

interface ProfileRow {
  user_id: string;
  display_name: string;
  role: string;
  grade: number | null;
  welcome_seen_at: string | null;
  tour_id: string | null;
  tour_done: boolean;
  created_at: string;
}

const COLUMNS =
  'user_id, display_name, role, grade, welcome_seen_at, tour_id, tour_done, created_at';

function accountRole(value: unknown): AccountRole {
  return value === 'admin' ? 'admin' : roleOf(value);
}

function fromRow(row: ProfileRow): Profile {
  return {
    id: row.user_id,
    name: row.display_name,
    role: accountRole(row.role),
    grade: row.grade,
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
    .select(COLUMNS)
    .eq('user_id', user.id)
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
      grade: null,
      welcomeSeenAt: null,
      tourId: null,
      tourDone: false,
      createdAt: user.created_at,
    };
  }
  return fromRow(data);
}

/**
 * Сменить имя. Роль здесь не меняется: её выбирают при регистрации, и
 * база не даёт править её из браузера — от роли зависит, чьи данные
 * человек видит.
 */
export async function updateProfile(patch: { name: string }): Promise<Profile> {
  const supabase = await getClient();
  const name = patch.name.trim().slice(0, 80);
  if (name === '') throw new ProfileError('empty name', 'name_required');
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();
  if (userError || user === null) throw new ProfileError('no session', 'session_not_found', 401);
  const { data, error } = await supabase
    .from('profiles')
    .update({ display_name: name })
    .eq('user_id', user.id)
    .select(COLUMNS)
    .single<ProfileRow>();
  if (error) throw new ProfileError(error.message, error.code);
  /* Сессия — следом: шапка читает имя оттуда. */
  const { error: metaError } = await supabase.auth.updateUser({ data: { name } });
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
      .eq('user_id', profile.id)
      .select(COLUMNS)
      .single<ProfileRow>();
    if (error || data === null) return profile;
    return fromRow(data);
  } catch {
    return profile;
  }
}

/* ── Согласия и родитель ───────────────────────────────────────── */

export interface AccountConsents {
  /** Редакция документов, с которой человек согласился последней: ГГГГ-ММ-ДД. */
  version: string | null;
  acceptedAt: string | null;
  /** Ученик младше 18: почта родителя и подтвердил ли он согласие. */
  parent: { email: string; confirmedAt: string | null } | null;
}

/** Что база знает о согласиях вошедшего. Ошибка чтения — «ничего не знаем». */
export async function loadConsents(): Promise<AccountConsents> {
  const empty: AccountConsents = { version: null, acceptedAt: null, parent: null };
  try {
    const supabase = await getClient();
    const [consents, parent] = await Promise.all([
      supabase
        .from('consents')
        .select('version, accepted_at')
        .eq('kind', 'soglasie')
        .order('accepted_at', { ascending: false })
        .limit(1)
        .returns<{ version: string; accepted_at: string }[]>(),
      supabase
        .from('parent_consents')
        .select('parent_email, confirmed_at')
        .returns<{ parent_email: string; confirmed_at: string | null }[]>(),
    ]);
    const last = consents.data?.[0];
    const row = parent.data?.[0];
    return {
      version: last?.version ?? null,
      acceptedAt: last?.accepted_at ?? null,
      parent: row ? { email: row.parent_email, confirmedAt: row.confirmed_at } : null,
    };
  } catch {
    return empty;
  }
}

/** «Выгрузить мои данные»: всё, что хранит аккаунт, одним JSON (export_my_data). */
export async function exportMyData(): Promise<unknown> {
  const supabase = await getClient();
  const { data, error } = await supabase.rpc('export_my_data');
  if (error) throw new ProfileError(error.message, error.code);
  return data;
}

/* ── Удаление ─────────────────────────────────────────────────── */

/**
 * Удалить аккаунт целиком: функция базы delete_my_account удаляет
 * пользователя, профиль и всё сохранённое уходят каскадом; остаётся
 * только запись о данном согласии (по закону — три года). Потом —
 * выход и чистое хранилище сессии. Прогресс тренажёра в браузере не
 * трогается.
 */
export async function deleteAccount(): Promise<void> {
  const supabase = await getClient();
  const { error } = await supabase.rpc('delete_my_account');
  if (error) throw new ProfileError(error.message, error.code);
  try {
    await signOut();
  } catch {
    /* Пользователя уже нет — серверу отзывать нечего. */
  }
  removeStoredSession(SESSION_KEY);
  sessionChanged();
}
