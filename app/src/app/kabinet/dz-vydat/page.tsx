import type { Metadata } from 'next';
import { AuthDisabled } from '@/components/auth/AuthDisabled';
import { AuthShell } from '@/components/auth/AuthShell';
import { IssueScreen } from '@/components/dz/IssueScreen';
import { AUTH_ENABLED } from '@/lib/auth/config';
import { names8Html } from '@/lib/vychisleniya/names';

export const metadata: Metadata = {
  title: 'Выдать домашнее задание — Будет на ЕГЭ',
  robots: { index: false },
};

/** «Выдать домашнее задание»: что выдать — в параметрах адреса (lib/dz/links.ts). */
export default function VydatPage() {
  if (!AUTH_ENABLED) return <AuthDisabled />;
  return (
    <AuthShell wide>
      {/* Названия типов набраны KaTeX на сборке. */}
      <IssueScreen names={names8Html()} />
    </AuthShell>
  );
}
