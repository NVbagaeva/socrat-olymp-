import type { ReactNode } from 'react';
import Link from 'next/link';
import { AuthDisabled } from '@/components/auth/AuthDisabled';
import { AuthShell } from '@/components/auth/AuthShell';
import { EmptyState } from '@/components/ui';
import { DZ2 } from '@/content/dz2';
import { AUTH_ENABLED } from '@/lib/auth/config';
import { DZ2_ON } from '@/lib/dz2/config';

/** Обёртка страниц новой выдачи ДЗ: без входа или без флага — честная заглушка. */
export function Dz2Stranitsa({ children }: { children: ReactNode }) {
  if (!AUTH_ENABLED) return <AuthDisabled />;
  return (
    <AuthShell wide>
      {DZ2_ON ? (
        children
      ) : (
        <EmptyState
          title={DZ2.vykl}
          description={DZ2.vyklLead}
          action={
            <Link className="btn btn--primary" href="/kabinet/">
              {DZ2.vKabinet}
            </Link>
          }
        />
      )}
    </AuthShell>
  );
}
