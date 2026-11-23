'use client';

import Link from 'next/link';
import { useCallback, useState } from 'react';
import { RegistrationForm } from '@/components/account/RegistrationForm';
import { EmptyState, SuccessState } from '@/components/ui';
import { legalDocs } from '@/content/legal/documents';
import { kabinetApi } from '@/lib/kabinet/client';
import { KabinetLoading } from './KabinetGate';
import { formFromRegistration } from './registration';
import { kabinetText, roleName } from './text';
import { useKabinet, useQueryParam } from './useKabinet';
import './kabinet.css';

/**
 * Регистрация по приглашению: роль — из приглашения, галочки согласий
 * со ссылками на тексты. Без действующего кода форма не показывается.
 */
export function InvitePage() {
  const code = useQueryParam('kod');
  const preview = useKabinet(
    useCallback(
      () => (code === null ? Promise.resolve(null) : kabinetApi().previewInvite(code)),
      [code],
    ),
  );
  const [done, setDone] = useState(false);
  const t = kabinetText.register;

  if (done) {
    return (
      <SuccessState
        title="Готово"
        description="Аккаунт создан."
        action={
          <Link className="btn btn--primary" href="/kabinet/proba/">
            {kabinetText.toHome}
          </Link>
        }
      />
    );
  }
  if (preview.status === 'loading') return <KabinetLoading />;
  if (preview.status === 'error' || preview.data === null || code === null) {
    return <EmptyState title={t.bad} description={t.badBody} />;
  }
  const inv = preview.data;
  return (
    <section className="card kab-narrow">
      <h1 className="t-h2">{t.title}</h1>
      <div className="kab-invite-banner" role="status">
        <p className="t-body">{t.invited(inv.tutorName, inv.className)}</p>
        <p className="t-caption muted">{t.as(roleName[inv.role])}</p>
      </div>
      {/* fixedRole skips role selection; this invite form keeps its existing API and checks. */}
      <RegistrationForm
        fixedRole={inv.role}
        api={{ register: (form) => kabinetApi().register(code, formFromRegistration(form)) }}
        onRegistered={() => setDone(true)}
      />
      <p className="t-caption dim kab-privacy">
        {t.privacy}{' '}
        <a href={legalDocs.politika.href} target="_blank" rel="noopener">
          {t.privacyLink}
        </a>
      </p>
    </section>
  );
}
