import type { Metadata } from 'next';
import { AuthDisabled } from '@/components/auth/AuthDisabled';
import { KabinetRaskladka } from '@/components/karta/KabinetRaskladka';
import { KabinetScreen } from '@/components/auth/KabinetScreen';
import { KABINET } from '@/content/auth';
import { AUTH_ENABLED } from '@/lib/auth/config';
import '@/components/auth/auth.css';

export const metadata: Metadata = {
  title: `${KABINET.title} — Будет на ЕГЭ`,
  robots: { index: false },
};

/**
 * Личный кабинет: ученику — «Карта ЕГЭ» и домашнее задание, репетитору —
 * классы и ДЗ; на второй вкладке — профиль, сохранённое, документы.
 * Раскладка — меню кабинета слева, как у /karta/.
 */
export default function KabinetPage() {
  if (!AUTH_ENABLED) return <AuthDisabled />;
  return (
    <KabinetRaskladka>
      <main className="auth-page auth-page--kabinet">
        <div className="auth-page__in auth-page__in--kabinet">
          <KabinetScreen />
        </div>
      </main>
    </KabinetRaskladka>
  );
}
