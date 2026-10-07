import type { Metadata } from 'next';
import Link from 'next/link';
import { AppShell } from '@/components/layout/AppShell';
import { EmptyState } from '@/components/ui';
import { tasksPage } from '@/content/tasks';
import { NOINDEX, SITE_NAME } from '@/lib/seo';

export const metadata: Metadata = {
  title: `Страница не найдена — ${SITE_NAME}`,
  robots: NOINDEX,
};

/**
 * Страница 404 статического экспорта: out/404.html.
 *
 * Код ответа 404 отдаёт сервер (ErrorDocument в public/.htaccess),
 * а эта страница — то, что видит ученик: оболочка кабинета и два
 * выхода, на главную и в банк заданий. Поисковику страница не нужна.
 */
export default function NotFound() {
  return (
    <AppShell active="tasks">
      <main className="app-main">
        <EmptyState
          title="Страница не найдена"
          description="Такого адреса на сайте нет: возможно, страница переехала или в ссылке опечатка."
          action={
            <p>
              <Link className="btn btn--primary" href="/">
                На главную
              </Link>{' '}
              <Link className="btn btn--secondary" href={tasksPage.href}>
                К банку заданий
              </Link>
            </p>
          }
        />
      </main>
    </AppShell>
  );
}
