'use client';

import Link from 'next/link';
import { useCallback, useState } from 'react';
import {
  Badge,
  Button,
  Card,
  EmptyState,
  ErrorState,
  FieldMessage,
  ProgressBar,
} from '@/components/ui';
import { prototypeTitle, taskHrefByNo, taskLabel, catalogTask } from '@/lib/kabinet/catalog';
import { kabinetApi } from '@/lib/kabinet/client';
import { setHomeworkContext } from '@/lib/kabinet/trainerSync';
import type { Me } from '@/lib/kabinet/types';
import { KabinetLoading } from './KabinetGate';
import { homeworkStatus } from './StudentHome';
import { kabinetText } from './text';
import { errorText, formatDate, useKabinet, useQueryParam } from './useKabinet';

/** Карточка ДЗ: ученику — задачи и «Решать», репетитору — кто как выполнил. */
export function HomeworkPage({ me }: { me: Me }) {
  const id = useQueryParam('id');
  const view = useKabinet(
    useCallback(() => (id === null ? Promise.resolve(null) : kabinetApi().homework(id)), [id]),
  );
  const [problem, setProblem] = useState<string | null>(null);
  const t = kabinetText.homework;

  if (view.status === 'loading') return <KabinetLoading />;
  if (view.status === 'error')
    return <ErrorState title={kabinetText.loadError} description={view.message} />;
  if (view.data === null) {
    return (
      <EmptyState
        title={t.notFound}
        description=""
        action={
          <Link className="btn btn--primary" href="/kabinet/">
            {kabinetText.toHome}
          </Link>
        }
      />
    );
  }
  const { homework: h, progress } = view.data;
  const mine = me.role === 'student' ? progress[0] : undefined;

  const solve = (taskNo: number) => {
    setHomeworkContext(h.id, taskNo);
    void kabinetApi().startHomework(h.id);
  };

  return (
    <div className="kab-stack">
      <div>
        <h1 className="t-h1">{h.title}</h1>
        <p className="t-body muted">
          {h.tutor.name}
          {h.className !== null ? ` · ${h.className}` : ''} ·{' '}
          {h.dueAt === null ? t.noDue : t.due(formatDate(h.dueAt))}
        </p>
        {h.note !== null ? <p className="t-body kab-note">{h.note}</p> : null}
      </div>

      <Card title={t.tasks}>
        <ol className="kab-list" data-testid="hw-items">
          {h.items.map((item, i) => {
            const done = mine?.doneByItem[i] ?? 0;
            return (
              <li key={i} className="kab-list__row kab-list__row--wrap">
                <span>
                  <span className="kab-strong">
                    {taskLabel(item.taskNo)} · {catalogTask(item.taskNo)?.name}
                  </span>
                  <span className="t-caption muted kab-block">
                    {item.prototypeCode === null
                      ? t.anyPrototype
                      : `${item.prototypeCode.split(':')[1]} · ${prototypeTitle(item.prototypeCode)}`}{' '}
                    · {mine !== undefined ? t.done(done, item.count) : `${item.count} задач`}
                  </span>
                </span>
                {mine !== undefined && mine.submittedAt === null ? (
                  <Link
                    className="btn btn--secondary btn--sm"
                    href={taskHrefByNo(item.taskNo)}
                    onClick={() => solve(item.taskNo)}
                  >
                    {t.solve}
                  </Link>
                ) : null}
              </li>
            );
          })}
        </ol>
        <p className="t-caption dim">{t.howCounted}</p>
      </Card>

      {mine !== undefined ? (
        <div className="kab-actions">
          {mine.submittedAt === null ? (
            <Button
              data-testid="submit-homework"
              onClick={() =>
                void kabinetApi()
                  .submitHomework(h.id)
                  .catch((e: unknown) => setProblem(errorText(e)))
              }
            >
              {t.submit}
            </Button>
          ) : (
            <Badge tone="success">
              {t.submitted} · {formatDate(mine.submittedAt)}
            </Badge>
          )}
          <span className="t-caption muted">{t.done(mine.done, mine.total)}</span>
        </div>
      ) : (
        <Card title={t.byStudent}>
          <ul className="kab-list" data-testid="hw-students">
            {progress.map((p) => {
              const status = homeworkStatus(h, p);
              return (
                <li key={p.student.id} className="kab-list__row kab-list__row--wrap">
                  <span className="kab-grow">
                    <span className="kab-strong">{p.student.name}</span>
                    <ProgressBar
                      value={p.total > 0 ? (p.done / p.total) * 100 : 0}
                      label={`${p.student.name}: ${t.done(p.done, p.total)}`}
                    />
                    <span className="t-caption muted">
                      {h.items
                        .map(
                          (item, i) =>
                            `${taskLabel(item.taskNo)}: ${p.doneByItem[i] ?? 0}/${item.count}`,
                        )
                        .join(' · ')}
                    </span>
                  </span>
                  <Badge tone={status.tone}>{status.label}</Badge>
                </li>
              );
            })}
          </ul>
        </Card>
      )}
      {problem !== null ? <FieldMessage tone="error">{problem}</FieldMessage> : null}
    </div>
  );
}
