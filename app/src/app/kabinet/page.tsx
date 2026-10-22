import type { Metadata } from 'next';
import { AuthDisabled } from '@/components/auth/AuthDisabled';
import { AuthShell } from '@/components/auth/AuthShell';
import { KabinetScreen } from '@/components/auth/KabinetScreen';
import { KABINET } from '@/content/auth';
import { AUTH_ENABLED } from '@/lib/auth/config';

export const metadata: Metadata = {
  title: `${KABINET.title} — Будет на ЕГЭ`,
  robots: { index: false },
};

/** Личный кабинет: профиль, что сохранено, выход и удаление аккаунта. */
export default function KabinetPage() {
  if (!AUTH_ENABLED) return <AuthDisabled />;
  return (
    <AuthShell wide>
      <KabinetScreen />
    </AuthShell>
  );
}
