import type { Metadata } from 'next';
import { AuthDisabled } from '@/components/auth/AuthDisabled';
import { AuthShell } from '@/components/auth/AuthShell';
import { PodtverzhdenieScreen } from '@/components/auth/PodtverzhdenieScreen';
import { CONFIRM_SCREEN } from '@/content/auth';
import { AUTH_ENABLED } from '@/lib/auth/config';

export const metadata: Metadata = {
  title: `${CONFIRM_SCREEN.signup.title} — Будет на ЕГЭ`,
  robots: { index: false },
};

/** Сюда ведёт ссылка из письма подтверждения почты. */
export default function PodtverzhdeniePage() {
  if (!AUTH_ENABLED) return <AuthDisabled />;
  return (
    <AuthShell>
      <PodtverzhdenieScreen />
    </AuthShell>
  );
}
