import type { Metadata } from 'next';
import { AuthDisabled } from '@/components/auth/AuthDisabled';
import { AuthShell } from '@/components/auth/AuthShell';
import { ZadachaProsmotr } from '@/components/progress2/ZadachaProsmotr';
import { AUTH_ENABLED } from '@/lib/auth/config';

export const metadata: Metadata = {
  title: 'Задача ученика — Будет на ЕГЭ',
  robots: { index: false },
};

/**
 * Задача, как её видел ученик: условие, ответы, подсказки, время.
 * Страница есть только в сборке с флагом экранов прогресса
 * (next.config.ts, расширение uchitel.tsx; docs/kabinet-progress.md).
 */
export default function Page() {
  if (!AUTH_ENABLED) return <AuthDisabled />;
  return (
    <AuthShell wide>
      <ZadachaProsmotr />
    </AuthShell>
  );
}
