import type { Metadata } from 'next';
import { AuthDisabled } from '@/components/auth/AuthDisabled';
import { AuthShell } from '@/components/auth/AuthShell';
import { UchenikPechat } from '@/components/progress2/UchenikPechat';
import { AUTH_ENABLED } from '@/lib/auth/config';

export const metadata: Metadata = {
  title: 'Прогресс ученика — лист — Будет на ЕГЭ',
  robots: { index: false },
};

/**
 * Лист ученика для печати и сохранения в PDF.
 * Страница есть только в сборке с флагом экранов прогресса
 * (next.config.ts, расширение uchitel.tsx; docs/kabinet-progress.md).
 */
export default function Page() {
  if (!AUTH_ENABLED) return <AuthDisabled />;
  return (
    <AuthShell wide>
      <UchenikPechat />
    </AuthShell>
  );
}
