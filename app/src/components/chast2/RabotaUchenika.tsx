'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { Button } from '@/components/ui';
import { CHAST2_TEXT as T } from '@/content/variantOnline/chast2Text';
import { AUTH_HREF } from '@/lib/auth/config';
import { createOchered } from '@/lib/chast2/ochered';
import { KabinetError } from '@/lib/kabinet/api';
import { rabotyApi } from '@/lib/raboty/client';
import type { Photo, StudentWork } from '@/lib/raboty/types';
import type { WorkLink } from '@/lib/variant/online/link';
import { buildWork, type WorkPayload } from '@/lib/variant/online/sessionUi';
import { OshibkiRun, WorkRun } from '@/components/variant/online/WorkRun';
import { RabotaItog } from './RabotaItog';
import type { RabotaCtx } from './rabotaCtx';

type Load =
  | { kind: 'loading' }
  | { kind: 'nologin' }
  | { kind: 'notfound' }
  | { kind: 'ready'; sw: StudentWork };

/**
 * Работа, выданная в кабинете, — у ученика. Решение — тот же экран, что
 * у «Собрать вариант» (WorkRun): ответы сохраняются в работу, к 14–20 —
 * фото. После отправки — статус, баллы и разбор (RabotaItog).
 */
export function RabotaUchenika({ id, link }: { id: string; link: WorkLink }) {
  const api = rabotyApi();
  const [load, setLoad] = useState<Load>({ kind: 'loading' });
  const [payload, setPayload] = useState<WorkPayload | null>(null);
  const [view, setView] = useState<'auto' | 'rabota' | 'oshibki'>('auto');
  const [tick, setTick] = useState(0);
  const reload = useCallback(() => setTick((n) => n + 1), []);

  useEffect(() => api.subscribe(reload), [api, reload]);

  useEffect(() => {
    let alive = true;
    api.studentWork(id).then(
      (sw) => alive && setLoad(sw === null ? { kind: 'notfound' } : { kind: 'ready', sw }),
      (e: unknown) =>
        alive &&
        setLoad(
          e instanceof KabinetError && e.code === 'not_authenticated'
            ? { kind: 'nologin' }
            : { kind: 'notfound' },
        ),
    );
    return () => {
      alive = false;
    };
  }, [api, id, tick]);

  useEffect(() => {
    let alive = true;
    void buildWork(
      {
        code: link.code,
        variant: link.variant,
        mode: 'kontrol',
        timer: { kind: 'none' },
        kind: link.kind,
        title: link.title,
      },
      null,
    ).then((p) => alive && setPayload(p));
    return () => {
      alive = false;
    };
  }, [link]);

  /* Очередь фото — одна на страницу. Ушло фото-замена — встаёт на место старого. */
  const ochered = useMemo(
    () =>
      createOchered({
        send: (item, onProgress) =>
          api.uploadPhoto(
            item.workId,
            item.taskNo,
            item.blob,
            { width: item.width, height: item.height },
            onProgress,
          ),
        onSent: (item, res) => {
          const photo = res as Photo;
          void (async () => {
            if (item.zamena !== undefined) {
              const sw = await api.studentWork(item.workId);
              const order = (sw?.photos ?? [])
                .filter((p) => p.taskNo === item.taskNo && p.id !== photo.id)
                .map((p) => (p.id === item.zamena ? photo.id : p.id));
              await api.deletePhoto(item.zamena).catch(() => undefined);
              await api.orderPhotos(item.workId, item.taskNo, order).catch(() => undefined);
            }
            reload();
          })();
        },
      }),
    [api, reload],
  );

  if (load.kind === 'loading' || (load.kind === 'ready' && payload === null)) {
    return (
      <p className="vo-status" role="status" aria-busy="true">
        {T.rabota.loading}
      </p>
    );
  }
  if (load.kind !== 'ready' || payload === null) {
    return (
      <div className="vo-start">
        <p className="vo-warn">{load.kind === 'nologin' ? T.rabota.noLogin : T.rabota.notFound}</p>
        <a className="vo-link" href={AUTH_HREF.kabinet}>
          {T.rabota.toKabinet}
        </a>
      </div>
    );
  }

  const { sw } = load;
  const status = sw.submission?.status ?? 'draft';
  const ctx: RabotaCtx = { id, sw, api, ochered, reload };
  const wrong1 = payload.tasks
    .map((t, i) => ({ i, g: sw.grades.find((g) => g.taskNo === t.egeNumber) }))
    .filter(({ g }) => g !== undefined && g.ball === 0)
    .map(({ i }) => i);

  if (view === 'oshibki' && wrong1.length > 0) {
    return (
      <OshibkiRun link={link} wrong={wrong1} title={sw.work.title} onBack={() => setView('auto')} />
    );
  }
  if (status === 'draft' || (status === 'returned' && view === 'rabota')) {
    return <WorkRun link={link} initial={payload} outdated={false} series={false} rabota={ctx} />;
  }
  return (
    <RabotaItog
      sw={sw}
      tasks={payload.tasks}
      part2={payload.part2 ?? []}
      api={api}
      actions={
        <>
          {status === 'returned' ? (
            <Button onClick={() => setView('rabota')} data-testid="c2-dorabotat">
              {T.itog.dorabotat}
            </Button>
          ) : null}
          {status === 'checked' && wrong1.length > 0 ? (
            <Button variant="secondary" onClick={() => setView('oshibki')} data-testid="c2-oshibki">
              {T.itog.oshibki}
            </Button>
          ) : null}
          <a className="vo-link" href={AUTH_HREF.kabinet}>
            {T.itog.toKabinet}
          </a>
        </>
      }
    />
  );
}
