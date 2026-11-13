'use client';

/**
 * /kabinet/domashka/?id=… — одно ДЗ. Ученику — решение, репетитору —
 * результаты. Роль и права проверяет база: ученик получает только свои
 * задачи и ни одного ключа.
 */

import Link from 'next/link';
import { useCallback, useEffect, useState } from 'react';
import { EmptyState } from '@/components/ui';
import { DZ } from '@/content/dz';
import type { HwFull } from '@/lib/dz/api';
import { DZ_HREF } from '@/lib/dz/links';
import { RezultatyDz } from './rezultaty/RezultatyDz';
import '@/components/dz/reshenie/reshenie.css';
import { ReshenieDz } from './reshenie/ReshenieDz';
import { NeedLogin, dzApi, queryParam, useUser } from './common';
import './dz.css';

/**
 * Названия типов, «Запомни» и пример берутся из самого ДЗ (снимок при
 * выдаче, homework_tasks.view), а не со страницы.
 */
export function HomeworkScreen() {
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
    <RezultatyDz full={full} reload={load} />
  ) : (
    <ReshenieDz full={full} userId={user.id} reload={load} />
  );
}
