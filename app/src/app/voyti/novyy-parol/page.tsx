import type { Metadata } from 'next';
import { AuthDisabled } from '@/components/auth/AuthDisabled';
import { AuthShell } from '@/components/auth/AuthShell';
import { NovyyParolScreen } from '@/components/auth/NovyyParolScreen';
import { NEW_PASSWORD_SCREEN } from '@/content/auth';
import { AUTH_ENABLED } from '@/lib/auth/config';

export const metadata: Metadata = {
  title: `${NEW_PASSWORD_SCREEN.title} — Будет на ЕГЭ`,
  robots: { index: false },
};

/** Сюда ведёт ссылка из письма «Забыли пароль?». */
export default function NovyyParolPage() {
  if (!AUTH_ENABLED) return <AuthDisabled />;
  return (
    <AuthShell>
      <NovyyParolScreen />
    </AuthShell>
  );
}
