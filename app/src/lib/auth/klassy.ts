'use client';

/**
 * Классы в кабинете — только чтение.
 *
 * Создание класса, код и ссылка-приглашение появятся позже; пока класс
 * может появиться только из тестовых данных (кнопка «Сервер: тестовые
 * данные»). Кабинет показывает то, что действительно есть в базе, и
 * ровно то, что разрешают правила доступа: репетитор видит свои классы
 * и своих учеников, ученик — свой класс и своего репетитора.
 */

import { getClient } from './client';

export interface KlassView {
  id: string;
  name: string;
  /** Имя репетитора — для ученика. */
  tutorName: string | null;
  /** Имена учеников — для репетитора. */
  students: string[];
}

interface ClassRow {
  id: string;
  name: string;
  tutor_id: string;
}

/** Классы вошедшего. Ошибка чтения — пустой список: кабинет покажет пустое состояние. */
export async function loadKlassy(): Promise<KlassView[]> {
  try {
    const supabase = await getClient();
    const classes = await supabase
      .from('classes')
      .select('id, name, tutor_id')
      .is('archived_at', null)
      .order('created_at', { ascending: true })
      .returns<ClassRow[]>();
    if (classes.error || classes.data === null || classes.data.length === 0) return [];
    const [members, people] = await Promise.all([
      supabase
        .from('class_members')
        .select('class_id, user_id')
        .returns<{ class_id: string; user_id: string }[]>(),
      supabase
        .from('profiles')
        .select('user_id, display_name')
        .returns<{ user_id: string; display_name: string }[]>(),
    ]);
    const nameOf = new Map((people.data ?? []).map((row) => [row.user_id, row.display_name]));
    return classes.data.map((row) => ({
      id: row.id,
      name: row.name,
      tutorName: nameOf.get(row.tutor_id) ?? null,
      students: (members.data ?? [])
        .filter((member) => member.class_id === row.id)
        .map((member) => nameOf.get(member.user_id) ?? '')
        .filter((name) => name !== '')
        .sort((a, b) => a.localeCompare(b, 'ru')),
    }));
  } catch {
    return [];
  }
}
