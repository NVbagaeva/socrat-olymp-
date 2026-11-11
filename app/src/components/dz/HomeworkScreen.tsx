'use client';

/**
 * /kabinet/domashka/?id=… — одно ДЗ. Ученику — решение, репетитору —
 * результаты. Роль и права проверяет база: ученик получает только свои
 * задачи и ни одного ключа.
 */

import Link from 'next/link';
import { useCallback, useEffect, useState } from 'react';
import { EmptyState } from '@/components/ui';
import type { Names8 } from '@/components/tasks/vychisleniya/Progress8';
import { DZ } from '@/content/dz';
import type { HwFull } from '@/lib/dz/api';
import { DZ_HREF } from '@/lib/dz/links';
import { HomeworkResults } from './HomeworkResults';
import { HomeworkSolve } from './HomeworkSolve';
import { NeedLogin, dzApi, queryParam, useUser } from './common';
import './dz.css';

export interface HomeworkTexts {
  /** Названия прототипов, набранные KaTeX на сборке. */
  names: Names8;
  /** «Запомни»: формула навыка, набранная на сборке, по id навыка. */
  memo: Readonly<Record<string, string>>;
}

export function HomeworkScreen({ names, memo }: HomeworkTexts) {
  const user = useUser();
  const [full, setFull] = useState<HwFull | null | undefined>(undefined);

  const load = useCallback(async () => {
    const id = queryParam('id') ?? '';
    try {
      setFull(id === '' ? null : await (await dzApi()).loadHomework(id));
    } catch {
      setFull(null);
    }
  }, []);

  useEffect(() => {
    if (user === null) return;
    let alive = true;
    void (async () => {
      const id = queryParam('id') ?? '';
      const loaded = id === '' ? null : await (await dzApi()).loadHomework(id).catch(() => null);
      if (alive) setFull(loaded);
    })();
    return () => {
      alive = false;
    };
  }, [user]);

  if (user === null) return <NeedLogin text="Войдите в кабинет, чтобы открыть задание." />;
  if (full === undefined) return <p className="auth-form__muted">…</p>;
  if (full === null) {
    return (
      <EmptyState
        title={user.role === 'tutor' ? DZ.results.notFound : DZ.solve.notFound}
        description="Список заданий — в кабинете."
        action={
          <Link className="btn btn--secondary" href={DZ_HREF.kabinet}>
            {DZ.solve.back}
          </Link>
        }
      />
    );
  }
  return full.hw.tutorId === user.id ? (
    <HomeworkResults full={full} names={names} reload={load} />
  ) : (
    <HomeworkSolve full={full} names={names} memo={memo} userId={user.id} reload={load} />
  );
}
