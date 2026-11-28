'use client';

import { useEffect, useState } from 'react';
import { useSessionUser } from '@/lib/auth/session';
import type { ArchivedWork } from '@/lib/variant/online/archive';
import type { SheetChoice } from '@/lib/variant/sheets';

export function usePovPrintAccess(code: string | null, works: readonly ArchivedWork[] | null) {
  const userId = useSessionUser()?.id;
  const [access, setAccess] = useState<{
    userId: string;
    code: string;
    tutor: boolean;
    finished: Set<number>;
  } | null>(null);

  useEffect(() => {
    if (!userId || !code) return;
    let active = true;
    async function load(id: string, setCode: string) {
      const { getClient } = await import('@/lib/auth/client');
      const db = await getClient();
      const { data: profile } = await db
        .from('profiles')
        .select('role')
        .eq('user_id', id)
        .maybeSingle();
      const tutor = profile?.role === 'tutor';
      const finished = new Set<number>();
      if (!tutor) {
        const { data } = await db
          .from('varianty_resheniya')
          .select('variant_no')
          .eq('user_id', id)
          .eq('source', 'povyshennye')
          .eq('set_code', setCode)
          .not('finished_at', 'is', null)
          .order('finished_at', { ascending: false });
        for (const row of data ?? []) finished.add(row.variant_no);
      }
      if (active) setAccess({ userId: id, code: setCode, tutor, finished });
    }
    void load(userId, code).catch(() => {
      if (active) setAccess(null);
    });
    return () => {
      active = false;
    };
  }, [userId, code]);

  const current = access?.userId === userId && access?.code === code ? access : null;
  return (choice: SheetChoice, version: number | null): boolean => {
    if (choice === 'uchenik' || current?.tutor) return true;
    if (!userId || !code || choice !== 'razbor' || version === null) return false;
    return (
      current?.finished.has(version) === true ||
      works?.some(
        (w) => w.ownerId === userId && w.code === code && w.variant === version && w.finishedAt > 0,
      ) === true
    );
  };
}
