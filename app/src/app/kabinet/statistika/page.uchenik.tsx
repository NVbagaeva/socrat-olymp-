import type { Metadata } from 'next';
import { AuthDisabled } from '@/components/auth/AuthDisabled';
import { AuthShell } from '@/components/auth/AuthShell';
import { MoyaStatistika } from '@/components/progress2/MoyaStatistika';
import { AUTH_ENABLED } from '@/lib/auth/config';

export const metadata: Metadata = {
  title: 'Моя статистика — Будет на ЕГЭ',
  robots: { index: false },
};

/**
 * Статистика ученика о себе, без пометок для учителя.
 * Страница есть только в сборке с флагом экранов прогресса
 * (next.config.ts, расширение uchenik.tsx; docs/kabinet-progress.md).
 */
export default function Page() {
  if (!AUTH_ENABLED) return <AuthDisabled />;
  return (
    <AuthShell wide>
      <MoyaStatistika />
    </AuthShell>
  );
}
