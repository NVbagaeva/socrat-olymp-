import type { Metadata } from 'next';
import { AuthDisabled } from '@/components/auth/AuthDisabled';
import { AuthShell } from '@/components/auth/AuthShell';
import { ClassScreen } from '@/components/dz/ClassScreen';
import { AUTH_ENABLED } from '@/lib/auth/config';

export const metadata: Metadata = {
  title: 'Класс — Будет на ЕГЭ',
  robots: { index: false },
};

/** Класс репетитора: код, ссылка-приглашение, ученики. Класс — в ?id=. */
export default function KlassPage() {
  if (!AUTH_ENABLED) return <AuthDisabled />;
  return (
    <AuthShell wide>
      <ClassScreen />
    </AuthShell>
  );
}
