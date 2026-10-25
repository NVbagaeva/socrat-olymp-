'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import { Badge, Button, Card, Modal } from '@/components/ui';
import { scopeTitle, trainerHref } from '@/lib/kabinet/catalog';
import {
  finishTrainerSession,
  openSession,
  pauseTrainerSession,
  type OpenSession,
} from '@/lib/kabinet/trainerSync';
import type { FinishedSession } from '@/lib/kabinet/types';
import { useActiveTrainerScopes } from '@/lib/trainerSession/store';
import { kabinetText } from './text';
import { formatDate, formatDuration } from './useKabinet';

/**
 * Тренировки ученика: незавершённые (из хранилища тренажёров) с
 * «Продолжить», «Поставить на паузу», «Завершить тренировку» и
 * завершённые (из кабинета).
 */
export function TrainingSessions({ finished }: { finished: FinishedSession[] }) {
  const t = kabinetText.sessions;
  const scopes = useActiveTrainerScopes();
  const [tick, setTick] = useState(0);
  const [confirm, setConfirm] = useState<string | null>(null);

  /* Записи тренажёров читаются при каждом изменении: начата или
     закончена тренировка (scopes), пауза отсюда или из вкладки
     тренажёра (tick). */
  const open = useMemo(
    () =>
      tick >= 0
        ? scopes
            .map(openSession)
            .filter((s): s is OpenSession => s !== null)
            .sort((a, b) => b.updatedAt - a.updatedAt)
        : [],
    [scopes, tick],
  );

  useEffect(() => {
    const onStorage = (e: StorageEvent) => {
      if (e.key === null || e.key.startsWith('budetege:trainer:')) setTick((n) => n + 1);
    };
    window.addEventListener('storage', onStorage);
    return () => window.removeEventListener('storage', onStorage);
  }, []);

  return (
    <Card title={kabinetText.student.trainings}>
      <h3 className="t-label muted kab-sub">{t.open}</h3>
      {open.length === 0 ? (
        <p className="t-caption muted">{t.none}</p>
      ) : (
        <ul className="kab-list" data-testid="open-sessions">
          {open.map((s) => (
            <li key={s.scope} className="kab-list__row kab-list__row--wrap">
              <span>
                <span className="kab-strong">{scopeTitle(s.scope)}</span>
                <span className="t-caption muted kab-block">
                  {t.solved(s.solved, s.total)} · {formatDuration(s.activeMs)}
                </span>
              </span>
              <span className="kab-list__end">
                {s.paused ? <Badge tone="warning">{t.paused}</Badge> : null}
                <Link className="btn btn--primary btn--sm" href={trainerHref(s.scope)}>
                  {t.resume}
                </Link>
                {!s.paused ? (
                  <Button
                    size="sm"
                    variant="secondary"
                    onClick={() => {
                      pauseTrainerSession(s.scope);
                      setTick((n) => n + 1);
                    }}
                  >
                    {t.pause}
                  </Button>
                ) : null}
                <Button size="sm" variant="ghost" onClick={() => setConfirm(s.scope)}>
                  {t.finish}
                </Button>
              </span>
            </li>
          ))}
        </ul>
      )}

      <h3 className="t-label muted kab-sub">{t.finished}</h3>
      {finished.length === 0 ? (
        <p className="t-caption muted">{t.noFinished}</p>
      ) : (
        <ul className="kab-list" data-testid="finished-sessions">
          {finished.slice(0, 10).map((s) => (
            <li key={s.id} className="kab-list__row kab-list__row--wrap">
              <span>
                <span className="kab-strong">{scopeTitle(s.scope)}</span>
                <span className="t-caption muted kab-block">
                  {t.result(s.right, s.solved, s.total)} · {formatDuration(s.activeMs)}
                  {s.homeworkId !== null ? ` · ${t.forHomework}` : ''}
                </span>
              </span>
              <span className="t-caption dim">{formatDate(s.finishedAt)}</span>
            </li>
          ))}
        </ul>
      )}

      <Modal
        open={confirm !== null}
        onClose={() => setConfirm(null)}
        title={t.finishTitle}
        description={t.finishText}
        footer={
          <>
            <Button variant="ghost" onClick={() => setConfirm(null)}>
              {t.cancel}
            </Button>
            <Button
              variant="danger"
              onClick={() => {
                if (confirm !== null) void finishTrainerSession(confirm);
                setConfirm(null);
              }}
            >
              {t.finish}
            </Button>
          </>
        }
      />
    </Card>
  );
}
