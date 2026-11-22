import type { Metadata } from 'next';
import { AuthDisabled } from '@/components/auth/AuthDisabled';
import { AuthShell } from '@/components/auth/AuthShell';
import { VariantProsmotr } from '@/components/progress2/VariantProsmotr';
import { AUTH_ENABLED } from '@/lib/auth/config';

export const metadata: Metadata = {
  title: 'Вариант ученика — Будет на ЕГЭ',
  robots: { index: false },
};

/**
 * Вариант ученика по задачам: ответы, верные ответы, время.
 * Страница есть только в сборке с флагом экранов прогресса
 * (next.config.ts, расширение uchitel.tsx; docs/kabinet-progress.md).
 */
export default function Page() {
  if (!AUTH_ENABLED) return <AuthDisabled />;
  return (
    <AuthShell wide>
      <VariantProsmotr />
    </AuthShell>
  );
}
