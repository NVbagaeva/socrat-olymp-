import type { Metadata } from 'next';
import { StubPage } from '@/components/layout/StubPage';

const TITLE = 'Избранное';

export const metadata: Metadata = { title: `${TITLE} — Будет на ЕГЭ` };

export default function Page() {
  return <StubPage title={TITLE} active="favourites" />;
}
