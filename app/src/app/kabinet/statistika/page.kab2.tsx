import type { Metadata } from 'next';
import { AuthDisabled } from '@/components/auth/AuthDisabled';
import { AuthShell } from '@/components/auth/AuthShell';
import { MoyaStatistika } from '@/components/kabinet2/MoyaStatistika';
import { AUTH_ENABLED } from '@/lib/auth/config';

export const metadata: Metadata = {
  title: 'Моя статистика — Будет на ЕГЭ',
  robots: { index: false },
};

/**
 * Статистика ученика по журналу решения. Страница есть только в сборке
 * с флагом журнала (next.config.ts, расширение kab2.tsx).
 */
export default function MoyaStatistikaPage() {
  if (!AUTH_ENABLED) return <AuthDisabled />;
  return (
    <AuthShell wide>
      <MoyaStatistika />
    </AuthShell>
  );
}
