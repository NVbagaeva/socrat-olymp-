'use client';

import Link from 'next/link';
import { useCallback, useId, useState } from 'react';
import {
  Button,
  Card,
  EmptyState,
  ErrorState,
  FieldLabel,
  FieldMessage,
  Select,
} from '@/components/ui';
import { kabinetApi } from '@/lib/kabinet/client';
import { KabinetLoading } from './KabinetGate';
import { InvitationList, InviteLink } from './parts';
import { kabinetText } from './text';
import { errorText, useKabinet, useQueryParam } from './useKabinet';

/** Класс репетитора: ученики, добавить своего, пригласить нового сразу в класс. */
export function ClassPage() {
  const id = useQueryParam('id');
  const view = useKabinet(
    useCallback(() => (id === null ? Promise.resolve(null) : kabinetApi().classView(id)), [id]),
  );
  const t = kabinetText.klass;
  const fieldId = useId();
  const [pick, setPick] = useState('');
  const [code, setCode] = useState<string | null>(null);
  const [problem, setProblem] = useState<string | null>(null);

  if (view.status === 'loading') return <KabinetLoading />;
  if (view.status === 'error')
    return <ErrorState title={kabinetText.loadError} description={view.message} />;
  if (view.data === null || id === null) {
    return (
      <EmptyState
        title={t.notFound}
        description=""
        action={
          <Link className="btn btn--primary" href="/kabinet/proba/">
            {kabinetText.toHome}
          </Link>
        }
      />
    );
  }
  const { cls, candidates, invitations } = view.data;
  const act = (fn: () => Promise<unknown>) => {
    setProblem(null);
    fn().catch((e: unknown) => setProblem(errorText(e)));
  };

  return (
    <div className="kab-stack">
      <div className="kab-title-row">
        <h1 className="t-h1">{cls.name}</h1>
        <Link className="btn btn--primary" href={`/kabinet/vydat-dz/?klass=${cls.id}`}>
          {kabinetText.tutor.issue}
        </Link>
      </div>
      {problem !== null ? <FieldMessage tone="error">{problem}</FieldMessage> : null}

      <Card title={t.students}>
        {cls.students.length === 0 ? (
          <p className="t-caption muted">{t.empty}</p>
        ) : (
          <ul className="kab-list" data-testid="class-students">
            {cls.students.map((s) => (
              <li key={s.id} className="kab-list__row">
                {s.name}
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => act(() => kabinetApi().removeFromClass(cls.id, s.id))}
                >
                  {t.remove}
                </Button>
              </li>
            ))}
          </ul>
        )}
        {candidates.length > 0 ? (
          <form
            className="kab-inline-form"
            onSubmit={(e) => {
              e.preventDefault();
              if (pick !== '')
                act(() =>
                  kabinetApi()
                    .addToClass(cls.id, pick)
                    .then(() => setPick('')),
                );
            }}
          >
            <div className="field kab-grow">
              <FieldLabel htmlFor={fieldId}>{t.addLabel}</FieldLabel>
              <Select id={fieldId} value={pick} onChange={(e) => setPick(e.target.value)}>
                <option value="">—</option>
                {candidates.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name}
                  </option>
                ))}
              </Select>
            </div>
            <Button type="submit" variant="secondary" disabled={pick === ''}>
              {t.add}
            </Button>
          </form>
        ) : null}
      </Card>

      <Card
        title={kabinetText.invites.title}
        action={
          <Button
            size="sm"
            variant="secondary"
            onClick={() =>
              act(async () => setCode(await kabinetApi().createInvitation('student', cls.id)))
            }
          >
            {t.invite}
          </Button>
        }
      >
        {code !== null ? <InviteLink code={code} /> : null}
        <InvitationList
          items={invitations}
          onRevoke={(iid) => act(() => kabinetApi().revokeInvitation(iid))}
        />
      </Card>
    </div>
  );
}
