import type { Metadata } from 'next';
import { AuthDisabled } from '@/components/auth/AuthDisabled';
import { AuthShell } from '@/components/auth/AuthShell';
import { HomeworkScreen } from '@/components/dz/HomeworkScreen';
import { AUTH_ENABLED } from '@/lib/auth/config';
import 'katex/dist/katex.min.css';

export const metadata: Metadata = {
  title: 'Домашнее задание — Будет на ЕГЭ',
  robots: { index: false },
};

/** Домашнее задание: ученику — решение, репетитору — результаты. ДЗ — в ?id=. */
export default function DomashkaPage() {
  if (!AUTH_ENABLED) return <AuthDisabled />;
  return (
    <AuthShell wide>
      <HomeworkScreen />
    </AuthShell>
  );
}
