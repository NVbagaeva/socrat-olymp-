'use client';

import { useState } from 'react';
import { Button, Card, ErrorState, FieldMessage } from '@/components/ui';
import { kabinetApi } from '@/lib/kabinet/client';
import type { KabinetApi } from '@/lib/kabinet/api';
import type { Me } from '@/lib/kabinet/types';
import { KabinetLoading } from './KabinetGate';
import { DocumentsBlock, InvitationList, InviteLink } from './parts';
import { kabinetText, roleName } from './text';
import { errorText, formatDate, useKabinet } from './useKabinet';

const loadAdmin = (api: KabinetApi) => api.adminHome();

/** Администратор: приглашения репетиторов и учеников, все пользователи. */
export function AdminHome({ me }: { me: Me }) {
  const home = useKabinet(loadAdmin);
  const t = kabinetText.invites;
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
  const invite = (role: 'student' | 'tutor') => {
    setProblem(null);
    kabinetApi()
      .createInvitation(role)
      .then(setCode, (e: unknown) => setProblem(errorText(e)));
  };

  return (
    <div className="kab-stack">
      <div className="kab-title-row">
        <h1 className="t-h1">{me.name}</h1>
        <span className="kab-actions">
          <Button onClick={() => invite('tutor')} data-testid="invite-tutor">
            {t.tutor}
          </Button>
          <Button variant="secondary" onClick={() => invite('student')}>
            {t.student}
          </Button>
        </span>
      </div>
      {problem !== null ? <FieldMessage tone="error">{problem}</FieldMessage> : null}
      {code !== null ? <InviteLink code={code} /> : null}

      <Card title={t.title}>
        <InvitationList
          items={home.data.invitations}
          onRevoke={(id) =>
            void kabinetApi()
              .revokeInvitation(id)
              .catch((e: unknown) => setProblem(errorText(e)))
          }
        />
      </Card>

      <Card title={t.users}>
        <ul className="kab-list" data-testid="users">
          {home.data.users.map((u) => (
            <li key={u.id} className="kab-list__row kab-list__row--wrap">
              <span>
                {u.name} <span className="dim">· {roleName[u.role]}</span>
                <span className="t-caption muted kab-block">{u.email}</span>
              </span>
              <span className="t-caption dim">{formatDate(u.createdAt, false)}</span>
            </li>
          ))}
        </ul>
      </Card>

      <DocumentsBlock me={me} />
    </div>
  );
}
