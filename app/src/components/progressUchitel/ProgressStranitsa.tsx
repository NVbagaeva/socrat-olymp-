import type { ReactNode } from 'react';
import Link from 'next/link';
import { AuthDisabled } from '@/components/auth/AuthDisabled';
import { AuthShell } from '@/components/auth/AuthShell';
import { EmptyState } from '@/components/ui';
import { PROGRESS } from '@/content/progressUchitel';
import { AUTH_ENABLED } from '@/lib/auth/config';

/**
 * Обёртка страниц прогресса: без входа — «Вход пока недоступен», без
 * флага экрана — честное «Статистика пока выключена» (статический экспорт
 * собирает страницы всегда).
 */
export function ProgressStranitsa({ vkl, children }: { vkl: boolean; children: ReactNode }) {
  if (!AUTH_ENABLED) return <AuthDisabled />;
  return (
    <AuthShell wide>
      {vkl ? (
        children
      ) : (
        <EmptyState
          title={PROGRESS.vykl}
          description={PROGRESS.vyklLead}
          action={
            <Link className="btn btn--primary" href="/kabinet/">
              {PROGRESS.vKabinet}
            </Link>
          }
        />
      )}
    </AuthShell>
  );
}
