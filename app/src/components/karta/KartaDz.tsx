'use client';

/**
 * Карточка текущего домашнего задания под картой: «Домашнее задание до
 * 15.11 · сделано 4 из 14», полоса, стрелка в ДЗ. Берётся ближайшее по
 * сроку незавершённое. Код ДЗ (с SDK) грузится только вошедшему.
 */

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { dueRu } from '@/content/dz';
import { useSessionUser } from '@/lib/auth/session';
import { homeworkHref } from '@/lib/dz/links';
import { statusOf } from '@/lib/dz/results';
import type { HwListItem } from '@/lib/dz/api';

const TEKST = {
  zagolovok: 'Домашнее задание',
  do: (kogda: string) => `до ${kogda}`,
  sdelano: (n: number, vsego: number) => `сделано ${n} из ${vsego}`,
  otkryt: 'Открыть домашнее задание',
};

export function KartaDz() {
  const user = useSessionUser();
  const [item, setItem] = useState<HwListItem | null | undefined>(undefined);

  useEffect(() => {
    let alive = true;
    void (async () => {
      if (user === null) {
        if (alive) setItem(null);
        return;
      }
      try {
        const { listHomework } = await import('@/lib/dz/api');
        const list = await listHomework('student');
        const aktivnye = list
          .filter(({ hw, recipients }) => {
            const s = statusOf(hw, recipients[0] ?? { startedAt: null, submittedAt: null });
            return s === 'new' || s === 'started' || s === 'late';
          })
          .sort((a, b) => (a.hw.dueAt ?? '9').localeCompare(b.hw.dueAt ?? '9'));
        if (alive) setItem(aktivnye[0] ?? null);
      } catch {
        if (alive) setItem(null);
      }
    })();
    return () => {
      alive = false;
    };
  }, [user]);

  if (item === null || item === undefined) return null;
  const { hw, tasks, done } = item;
  const dolya = tasks === 0 ? 0 : Math.round((100 * done) / tasks);
  return (
    <Link className="karta-dz stk-glass" href={homeworkHref(hw.id)} aria-label={TEKST.otkryt}>
      <span className="karta-dz__znak" aria-hidden="true">
        <svg viewBox="0 0 24 24">
          <rect x="3.5" y="5" width="17" height="15" rx="3" />
          <path d="M3.5 10h17M8 3v4M16 3v4" />
        </svg>
      </span>
      <span className="karta-dz__tekst">
        <b>
          {TEKST.zagolovok}
          {hw.dueAt === null ? '' : ` ${TEKST.do(dueRu(hw.dueAt))}`}
        </b>
        <span>
          {hw.title} · {TEKST.sdelano(done, tasks)}
        </span>
      </span>
      <span className="karta-dz__polosa" role="img" aria-label={TEKST.sdelano(done, tasks)}>
        <span style={{ width: `${dolya}%` }} />
      </span>
      <span className="karta-dz__schet">
        {done} / {tasks}
      </span>
      <span className="karta-dz__strelka" aria-hidden="true">
        →
      </span>
    </Link>
  );
}
