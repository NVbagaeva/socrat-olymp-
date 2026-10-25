'use client';

import Link from 'next/link';
import { type ReactNode } from 'react';
import { RegistrationForm } from '@/components/account/RegistrationForm';
import { Button, EmptyState, ErrorState, Skeleton } from '@/components/ui';
import { kabinetApi } from '@/lib/kabinet/client';
import type { KabinetApi } from '@/lib/kabinet/api';
import type { KabinetRole, Me } from '@/lib/kabinet/types';
import { kabinetText, roleName } from './text';
import { formFromRegistration } from './registration';
import { useKabinet } from './useKabinet';
import './kabinet.css';

async function loadGate(api: KabinetApi) {
  const [hasAdmin, me] = await Promise.all([api.hasAdmin(), api.me()]);
  return { hasAdmin, me };
}

export function KabinetLoading() {
  return (
    <div className="kab-stack" aria-busy="true">
      <Skeleton height={28} width="40%" />
      <Skeleton height={120} radius="var(--radius-lg)" />
      <Skeleton height={120} radius="var(--radius-lg)" />
    </div>
  );
}

/** Полоса пробного режима: кто вошёл, сменить аккаунт, выйти. */
function TrialBar({ me }: { me: Me }) {
  const api = kabinetApi();
  return (
    <div className="kab-trial" role="note">
      <span>
        <strong>{kabinetText.trial.title}</strong> · {kabinetText.trial.note}
      </span>
      <span className="kab-trial__who">
        {me.name} · {roleName[me.role]}
        <Button variant="ghost" size="sm" onClick={() => void api.signOut()}>
          {kabinetText.trial.switch}
        </Button>
      </span>
    </div>
  );
}

function ParentPending({ me }: { me: Me }) {
  const t = kabinetText.parent;
  return (
    <div className="kab-parent" role="status">
      <div>
        <p className="kab-parent__t">{t.title}</p>
        <p className="t-caption muted">{t.body(me.parentEmail ?? '')}</p>
      </div>
      <Button variant="secondary" size="sm" onClick={() => kabinetApi().trial?.confirmParent()}>
        {t.trialConfirm}
      </Button>
    </div>
  );
}

function FirstRun() {
  const t = kabinetText.firstRun;
  return (
    <section className="card kab-narrow">
      <h1 className="t-h2">{t.title}</h1>
      <p className="t-body muted kab-lead">{t.lead}</p>
      <RegistrationForm
        fixedRole="tutor"
        submitLabel={t.submit}
        api={{ register: (form) => kabinetApi().bootstrapAdmin(formFromRegistration(form)) }}
        onRegistered={() => undefined}
      />
    </section>
  );
}

function SignIn() {
  const t = kabinetText.signIn;
  const accounts = kabinetApi().trial?.accounts() ?? [];
  return (
    <section className="card kab-narrow">
      <h1 className="t-h2">{t.title}</h1>
      <p className="t-body muted kab-lead">{t.lead}</p>
      <ul className="kab-list">
        {accounts.map((a) => (
          <li key={a.id} className="kab-list__row">
            <span>
              {a.name} <span className="dim">· {roleName[a.role]}</span>
            </span>
            <Button size="sm" variant="secondary" onClick={() => kabinetApi().trial?.signIn(a.id)}>
              {t.enter}
            </Button>
          </li>
        ))}
      </ul>
      <p className="t-caption dim">{t.invite}</p>
    </section>
  );
}

/**
 * Вход в кабинет: первый запуск (аккаунт администратора), вход, проверка
 * роли. Внутрь попадает только вошедший пользователь нужной роли.
 */
export function KabinetGate({
  roles,
  children,
}: {
  /** Кому открыт экран. Не задано — всем вошедшим. */
  roles?: readonly KabinetRole[];
  children: (me: Me) => ReactNode;
}) {
  const gate = useKabinet(loadGate);

  if (gate.status === 'loading') return <KabinetLoading />;
  if (gate.status === 'error') {
    return (
      <ErrorState
        title={kabinetText.loadError}
        description={gate.message}
        action={<Button onClick={gate.reload}>{kabinetText.retry}</Button>}
      />
    );
  }
  const { hasAdmin, me } = gate.data;
  if (!hasAdmin) return <FirstRun />;
  if (me === null) return <SignIn />;

  return (
    <>
      <TrialBar me={me} />
      {me.parentPending ? <ParentPending me={me} /> : null}
      {roles !== undefined && !roles.includes(me.role) ? (
        <EmptyState
          title={kabinetText.wrongRole.title}
          description={kabinetText.wrongRole.body(roles.map((r) => roleName[r]).join(', '))}
          action={
            <Link className="btn btn--primary" href="/kabinet/proba/">
              {kabinetText.toHome}
            </Link>
          }
        />
      ) : (
        children(me)
      )}
    </>
  );
}
