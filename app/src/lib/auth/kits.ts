'use client';

/**
 * Коды комплектов репетитора в аккаунте.
 *
 * Комплект собирается и помнится в браузере (lib/komplekt.ts). Если
 * репетитор вошёл, тот же факт пишется и в таблицу kits — так в
 * кабинете виден список последних кодов, а не выдуманный «прогресс».
 * Задания комплекта в базу не идут: код и адреса листов восстанавливают
 * их детерминированно, как и в браузере.
 */

import { onKitRemembered, type Kit } from '@/lib/komplekt';
import { getClient } from './client';
import { currentUser } from './session';

export interface SavedKit {
  code: string;
  scope: string;
  section: string;
  studentHref: string;
  teacherHref: string;
  createdAt: string;
}

interface KitRow {
  code: string;
  scope: string;
  section: string;
  student_href: string;
  teacher_href: string;
  created_at: string;
}

/** Сколько кодов показывает кабинет. */
export const KITS_SHOWN = 10;

export async function saveKit(kit: Kit): Promise<void> {
  const user = currentUser();
  if (user === null) return;
  const supabase = await getClient();
  await supabase.from('kits').upsert(
    {
      user_id: user.id,
      code: kit.code,
      scope: kit.scope,
      section: kit.section,
      student_href: kit.studentHref,
      teacher_href: kit.teacherHref,
    },
    { onConflict: 'user_id,code' },
  );
}

export async function loadKits(): Promise<SavedKit[]> {
  const supabase = await getClient();
  const { data, error } = await supabase
    .from('kits')
    .select('code, scope, section, student_href, teacher_href, created_at')
    .order('created_at', { ascending: false })
    .limit(KITS_SHOWN)
    .returns<KitRow[]>();
  if (error || data === null) return [];
  return data.map((row) => ({
    code: row.code,
    scope: row.scope,
    section: row.section,
    studentHref: row.student_href,
    teacherHref: row.teacher_href,
    createdAt: row.created_at,
  }));
}

/**
 * Следить за комплектами, пока вошёл репетитор: каждый скачанный
 * комплект уходит в базу. SDK грузится в момент первой записи.
 */
export function watchKits(): () => void {
  return onKitRemembered((kit) => {
    const user = currentUser();
    if (user === null || user.role !== 'tutor') return;
    void saveKit(kit).catch(() => {
      /* Нет сети — комплект остаётся в браузере, как и раньше. */
    });
  });
}
