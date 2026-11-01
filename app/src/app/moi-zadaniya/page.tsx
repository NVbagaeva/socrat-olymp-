import type { Metadata } from 'next';
import { StubPage } from '@/components/layout/StubPage';

const TITLE = 'Мои задания';

/* Раздел кабинета ещё не открыт: заглушка в поиске не нужна, ссылки с неё работают. */
export const metadata: Metadata = {
  title: `${TITLE} — Будет на ЕГЭ`,
  robots: { index: false, follow: true },
};

export default function Page() {
  return <StubPage title={TITLE} active="my-tasks" />;
}
