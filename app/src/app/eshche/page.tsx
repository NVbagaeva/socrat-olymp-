import type { Metadata } from 'next';
import Link from 'next/link';
import { AppShell } from '@/components/layout/AppShell';
import { appNavMore, appNavMorePage } from '@/content/appNav';
import './eshche.css';

export const metadata: Metadata = {
  title: `${appNavMorePage.label} — Будет на ЕГЭ`,
};

/**
 * Экран «Ещё»: разделы, не поместившиеся в нижнюю панель.
 *
 * Обычная страница, а не модальное окно: у неё свой адрес, назад по
 * кнопке браузера работает как везде. Список считается из appNav —
 * второго перечня разделов в проекте нет.
 */
export default function MorePage() {
  return (
    <AppShell active={appNavMorePage.id}>
      <main className="app-main">
        <h1 className="t-h1">{appNavMorePage.label}</h1>

        <ul className="more-list">
          {appNavMore.map((item) => (
            <li key={item.id}>
              <Link className="more-link" href={item.href}>
                <span>{item.label}</span>
                <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
                  <path d="M5 12h13M12 6l6 6-6 6" />
                </svg>
              </Link>
            </li>
          ))}
        </ul>
      </main>
    </AppShell>
  );
}
