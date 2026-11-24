import type { Metadata } from 'next';
import Link from 'next/link';
import { AuthDisabled } from '@/components/auth/AuthDisabled';
import { AuthShell } from '@/components/auth/AuthShell';
import { EmptyState } from '@/components/ui';
import { CentrLazy } from '@/components/uvedomleniya/CentrLazy';
import { UVED } from '@/content/uvedomleniya';
import { AUTH_ENABLED } from '@/lib/auth/config';
import { UVEDOMLENIYA_ON } from '@/lib/uvedomleniya/config';

export const metadata: Metadata = {
  title: 'Уведомления — Будет на ЕГЭ',
  robots: { index: false },
};

/** Уведомления и их настройки (docs/kabinet-uvedomleniya.md, PR 3б). */
export default function Page() {
  if (!AUTH_ENABLED) return <AuthDisabled />;
  return (
    <AuthShell wide>
      {UVEDOMLENIYA_ON ? (
        <CentrLazy />
      ) : (
        <EmptyState
          title={UVED.vykl}
          description={UVED.vyklLead}
          action={
            <Link className="btn btn--primary" href="/kabinet/">
              {UVED.vKabinet}
            </Link>
          }
        />
      )}
    </AuthShell>
  );
}
