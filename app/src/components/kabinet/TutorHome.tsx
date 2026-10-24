'use client';

import Link from 'next/link';
import { useState } from 'react';
import { Avatar, Badge, Button, Card, ErrorState, FieldMessage, Input } from '@/components/ui';
import { kabinetApi } from '@/lib/kabinet/client';
import type { KabinetApi } from '@/lib/kabinet/api';
import type { Me } from '@/lib/kabinet/types';
import { KabinetLoading } from './KabinetGate';
import { DocumentsBlock, initialsOf, InvitationList, InviteLink } from './parts';
import { kabinetText } from './text';
import { errorText, formatDate, useKabinet } from './useKabinet';

const loadTutor = (api: KabinetApi) => api.tutorHome();

export function TutorHome({ me }: { me: Me }) {
  const home = useKabinet(loadTutor);
  const t = kabinetText.tutor;
  const [className, setClassName] = useState('');
  const [code, setCode] = useState<string | null>(null);
  const [problem, setProblem] = useState<string | null>(null);

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
  const { classes, students, homework, invitations } = home.data;
  const act = (fn: () => Promise<unknown>) => {
    setProblem(null);
    fn().catch((e: unknown) => setProblem(errorText(e)));
  };

  return (
    <div className="kab-stack">
      <div className="kab-title-row">
        <h1 className="t-h1">{me.name}</h1>
        <div className="kab-actions">
          <Link className="btn btn--secondary" href="/kabinet/raboty/" data-testid="raboty-link">
            Работы-варианты
          </Link>
          <Link className="btn btn--primary" href="/kabinet/vydat-dz/" data-testid="issue-homework">
            {t.issue}
          </Link>
        </div>
      </div>
      {problem !== null ? <FieldMessage tone="error">{problem}</FieldMessage> : null}

      <div className="kab-grid">
        <Card title={t.classes}>
          {classes.length === 0 ? (
            <p className="t-caption muted">{t.noClasses}</p>
          ) : (
            <ul className="kab-list" data-testid="classes">
              {classes.map((c) => (
                <li key={c.id} className="kab-list__row">
                  <Link href={`/kabinet/klass/?id=${c.id}`} className="kab-strong">
                    {c.name}
                  </Link>
                  <span className="t-caption muted">{t.pupils(c.students.length)}</span>
                </li>
              ))}
            </ul>
          )}
          <form
            className="kab-inline-form"
            onSubmit={(e) => {
              e.preventDefault();
              act(async () => {
                await kabinetApi().createClass(className);
                setClassName('');
              });
            }}
          >
            <Input
              aria-label={t.newClass}
              placeholder={t.newClass}
              value={className}
              onChange={(e) => setClassName(e.target.value)}
              maxLength={80}
            />
            <Button type="submit" variant="secondary" disabled={className.trim() === ''}>
              {t.createClass}
            </Button>
          </form>
        </Card>

        <Card
          title={t.students}
          action={
            <Button
              size="sm"
              variant="secondary"
              onClick={() =>
                act(async () => setCode(await kabinetApi().createInvitation('student')))
              }
            >
              {t.invite}
            </Button>
          }
        >
          {code !== null ? <InviteLink code={code} /> : null}
          {students.length === 0 ? (
            <p className="t-caption muted">{t.noStudents}</p>
          ) : (
            <ul className="kab-list" data-testid="students">
              {students.map((s) => (
                <li key={s.id} className="kab-list__row kab-list__row--wrap">
                  <span className="kab-person">
                    <Avatar initials={initialsOf(s.name)} name={s.name} size="sm" />
                    <span>
                      {s.name}
                      {s.classNames.length > 0 ? (
                        <span className="t-caption dim kab-block">{s.classNames.join(', ')}</span>
                      ) : null}
                    </span>
                  </span>
                  <span className="t-caption muted">{t.solvedWeek(s.solvedWeek)}</span>
                </li>
              ))}
            </ul>
          )}
        </Card>
      </div>

      <Card title={t.homework}>
        {homework.length === 0 ? (
          <p className="t-caption muted">{t.noHomework}</p>
        ) : (
          <ul className="kab-list" data-testid="tutor-homework">
            {homework.map((h) => (
              <li key={h.id} className="kab-list__row kab-list__row--wrap">
                <span>
                  <Link href={`/kabinet/dz/?id=${h.id}`} className="kab-strong">
                    {h.title}
                  </Link>
                  <span className="t-caption muted kab-block">
                    {h.className ?? t.pupils(h.recipients)} ·{' '}
                    {h.dueAt === null
                      ? kabinetText.homework.noDue
                      : kabinetText.homework.due(formatDate(h.dueAt))}
                  </span>
                </span>
                <Badge tone={h.submitted === h.recipients ? 'success' : 'neutral'}>
                  {t.submitted(h.submitted, h.recipients)}
                </Badge>
              </li>
            ))}
          </ul>
        )}
      </Card>

      <div className="kab-grid">
        <Card title={kabinetText.invites.title} compact>
          <InvitationList
            items={invitations}
            onRevoke={(id) => act(() => kabinetApi().revokeInvitation(id))}
          />
        </Card>
        <DocumentsBlock me={me} />
      </div>
    </div>
  );
}
