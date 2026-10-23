import type { Metadata } from 'next';
import { Suspense } from 'react';
import { AuthDisabled } from '@/components/auth/AuthDisabled';
import { AuthShell } from '@/components/auth/AuthShell';
import { VoytiScreen } from '@/components/auth/VoytiScreen';
import { AUTH_UI } from '@/content/auth';
import { AUTH_ENABLED } from '@/lib/auth/config';

export const metadata: Metadata = {
  title: `${AUTH_UI.pageTitle} — Будет на ЕГЭ`,
  robots: { index: false },
};

/** Вход и регистрация. Вкладка — из адреса: /voyti/?vkladka=registraciya. */
export default function VoytiPage() {
  if (!AUTH_ENABLED) return <AuthDisabled />;
  return (
    <AuthShell>
      <Suspense fallback={null}>
        <VoytiScreen />
      </Suspense>
    </AuthShell>
  );
}
