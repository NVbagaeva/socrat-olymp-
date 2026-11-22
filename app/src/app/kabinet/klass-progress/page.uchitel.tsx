import type { Metadata } from 'next';
import { AuthDisabled } from '@/components/auth/AuthDisabled';
import { AuthShell } from '@/components/auth/AuthShell';
import { KlassProgress } from '@/components/progress2/KlassProgress';
import { AUTH_ENABLED } from '@/lib/auth/config';

export const metadata: Metadata = {
  title: 'Прогресс класса — Будет на ЕГЭ',
  robots: { index: false },
};

/**
 * Прогресс класса учителя: тепловая карта, активность, отстающие. Класс — в ?id=.
 * Страница есть только в сборке с флагом экранов прогресса
 * (next.config.ts, расширение uchitel.tsx; docs/kabinet-progress.md).
 */
export default function Page() {
  if (!AUTH_ENABLED) return <AuthDisabled />;
  return (
    <AuthShell wide>
      <KlassProgress />
    </AuthShell>
  );
}
