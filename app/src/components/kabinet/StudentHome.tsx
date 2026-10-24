'use client';

import Link from 'next/link';
import { Avatar, Badge, Button, Card, ErrorState, ProgressBar } from '@/components/ui';
import { catalogTasks, taskLabel } from '@/lib/kabinet/catalog';
import type { KabinetApi } from '@/lib/kabinet/api';
import type { HomeworkProgress, HomeworkSummary, Me, TaskProgressRow } from '@/lib/kabinet/types';
import { KabinetLoading } from './KabinetGate';
import { DocumentsBlock, initialsOf } from './parts';
import { kabinetText } from './text';
import { TrainingSessions } from './TrainingSessions';
import { formatDate, useKabinet } from './useKabinet';

const loadStudent = (api: KabinetApi) => api.studentHome();

/** Статус ДЗ у ученика: бейдж и его цвет. */
export function homeworkStatus(h: HomeworkSummary, p: HomeworkProgress) {
  const t = kabinetText.homework;
  if (p.submittedAt !== null) return { label: t.submitted, tone: 'success' as const };
  if (h.dueAt !== null && h.dueAt < new Date().toISOString())
    return { label: t.overdue, tone: 'error' as const };
  if (p.startedAt !== null) return { label: t.started, tone: 'info' as const };
  return { label: t.notStarted, tone: 'neutral' as const };
}

/** Сетка №1–20: решено, доля верных; нерешённые — честное «ещё не решали». */
function ProgressGrid({ rows }: { rows: TaskProgressRow[] }) {
  const t = kabinetText.student;
  return (
    <Card title={t.progress}>
      <p className="t-caption muted kab-lead">{t.progressHint}</p>
      <ol className="kab-progress" data-testid="progress-grid">
        {catalogTasks.map((task) => {
          const row = rows.find((r) => r.taskNo === task.no);
          const percent = row && row.solved > 0 ? Math.round((row.right / row.solved) * 100) : null;
          return (
            <li key={task.no} className="kab-progress__cell">
              <span className="kab-progress__no">{taskLabel(task.no)}</span>
              <span className="t-caption kab-progress__name">{task.name}</span>
              {percent === null ? (
                <span className="t-caption dim">{task.ready ? t.notSolved : t.soon}</span>
              ) : (
                <>
                  <ProgressBar value={percent} label={`${taskLabel(task.no)}: верно ${percent}%`} />
                  <span className="t-caption muted">
                    верно {row?.right} из {row?.solved} · {percent}%
                  </span>
                </>
              )}
            </li>
          );
        })}
      </ol>
    </Card>
  );
}

export function StudentHome({ me }: { me: Me }) {
  const home = useKabinet(loadStudent);
  const t = kabinetText.student;
  if (home.status === 'loading') return <KabinetLoading />;
  if (home.status === 'error') {
    return (
      <ErrorState
        title={kabinetText.loadError}
        description={home.message}
        action={<Button onClick={home.reload}>{kabinetText.retry}</Button>}
      />
    );
  }
  const { tutors, classes, homework, progress, finished } = home.data;

  return (
    <div className="kab-stack">
      <div className="kab-title-row">
        <h1 className="t-h1">{me.name}</h1>
        <Link className="btn btn--primary" href="/kabinet/raboty/" data-testid="raboty-link">
          Мои работы
        </Link>
      </div>

      <div className="kab-grid">
        <Card title={t.tutors} compact>
          {tutors.length === 0 ? (
            <p className="t-caption muted">{t.noTutors}</p>
          ) : (
            <ul className="kab-list" data-testid="tutors">
              {tutors.map((tutor) => (
                <li key={tutor.id} className="kab-list__row">
                  <span className="kab-person">
                    <Avatar initials={initialsOf(tutor.name)} name={tutor.name} size="sm" />
                    {tutor.name}
                  </span>
                </li>
              ))}
            </ul>
          )}
          {classes.length > 0 ? (
            <p className="t-caption muted">{t.classes(classes.map((c) => c.name).join(', '))}</p>
          ) : null}
        </Card>
        <DocumentsBlock me={me} />
      </div>

      <Card title={t.homework}>
        {homework.length === 0 ? (
          <p className="t-caption muted">{t.noHomework}</p>
        ) : (
          <ul className="kab-list" data-testid="homework">
            {homework.map((h) => {
              const status = homeworkStatus(h, h.progress);
              const percent =
                h.progress.total > 0 ? Math.round((h.progress.done / h.progress.total) * 100) : 0;
              return (
                <li key={h.id} className="kab-hw">
                  <div className="kab-hw__head">
                    <Link href={`/kabinet/dz/?id=${h.id}`} className="kab-hw__title">
                      {h.title}
                    </Link>
                    <Badge tone={status.tone}>{status.label}</Badge>
                  </div>
                  <p className="t-caption muted">
                    {h.tutor.name}
                    {h.className !== null ? ` · ${h.className}` : ''} ·{' '}
                    {h.dueAt === null
                      ? kabinetText.homework.noDue
                      : kabinetText.homework.due(formatDate(h.dueAt))}
                  </p>
                  <ProgressBar
                    value={percent}
                    label={kabinetText.homework.done(h.progress.done, h.progress.total)}
                  />
                  <p className="t-caption dim">
                    {kabinetText.homework.done(h.progress.done, h.progress.total)}
                  </p>
                </li>
              );
            })}
          </ul>
        )}
      </Card>

      <ProgressGrid rows={progress} />
      <TrainingSessions finished={finished} />
    </div>
  );
}
