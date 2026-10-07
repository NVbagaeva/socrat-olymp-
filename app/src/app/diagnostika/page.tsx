import type { Metadata } from 'next';
import { StubPage } from '@/components/layout/StubPage';
import { NOINDEX } from '@/lib/seo';

const TITLE = 'Диагностика';

/* Содержимого у раздела ещё нет — в поиске ему делать нечего. */
export const metadata: Metadata = { title: `${TITLE} — Будет на ЕГЭ`, robots: NOINDEX };

export default function Page() {
  return <StubPage title={TITLE} active="tasks" />;
}
