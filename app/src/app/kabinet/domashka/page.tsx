import type { Metadata } from 'next';
import { AuthDisabled } from '@/components/auth/AuthDisabled';
import { AuthShell } from '@/components/auth/AuthShell';
import { HomeworkScreen } from '@/components/dz/HomeworkScreen';
import { AUTH_ENABLED } from '@/lib/auth/config';
import { memo8Html, names8Html } from '@/lib/vychisleniya/names';

export const metadata: Metadata = {
  title: 'Домашнее задание — Будет на ЕГЭ',
  robots: { index: false },
};

/** Домашнее задание: ученику — решение, репетитору — результаты. ДЗ — в ?id=. */
export default function DomashkaPage() {
  if (!AUTH_ENABLED) return <AuthDisabled />;
  return (
    <AuthShell wide>
      {/* Названия типов и «Запомни» набраны KaTeX на сборке. */}
      <HomeworkScreen names={names8Html()} memo={memo8Html()} />
    </AuthShell>
  );
}
