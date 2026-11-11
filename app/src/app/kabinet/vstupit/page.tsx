import type { Metadata } from 'next';
import { AuthDisabled } from '@/components/auth/AuthDisabled';
import { AuthShell } from '@/components/auth/AuthShell';
import { JoinScreen } from '@/components/dz/JoinScreen';
import { AUTH_ENABLED } from '@/lib/auth/config';

export const metadata: Metadata = {
  title: 'Приглашение в класс — Будет на ЕГЭ',
  robots: { index: false },
};

/** Ссылка-приглашение в класс: код — в ?kod=. */
export default function VstupitPage() {
  if (!AUTH_ENABLED) return <AuthDisabled />;
  return (
    <AuthShell>
      <JoinScreen />
    </AuthShell>
  );
}
