import Link from 'next/link';
import type { Metadata } from 'next';
import { EmptyState } from '@/components/ui';
import { AppShell } from './AppShell';

export interface RedirectProps {
  /** Новый адрес страницы. */
  href: string;
  /** Как называется новое место — подпись кнопки. */
  title: string;
}

/**
 * Прежний адрес страницы: уводит на новый.
 *
 * Сайт собирается статическим экспортом, сервера у него нет, и
 * настоящий 301 отдавать некому. Перенос делает сама страница:
 * `<meta http-equiv="refresh">` уводит браузер сразу, а видимая
 * кнопка остаётся для тех, у кого обновление не сработало. В поиске
 * такая страница не нужна — отсюда `REDIRECT_METADATA`.
 *
 * Появляется только там, откуда страница переехала: новых адресов
 * этим компонентом не заводят.
 */
export const REDIRECT_METADATA: Metadata = { robots: { index: false, follow: true } };

export function Redirect({ href, title }: RedirectProps) {
  return (
    <>
      <meta httpEquiv="refresh" content={`0; url=${href}`} />
      <EmptyState
        title="Страница переехала"
        description="Этот адрес больше не используется. Сейчас откроется новый."
        action={
          <Link className="btn btn--primary" href={href}>
            {title}
          </Link>
        }
      />
    </>
  );
}

/**
 * То же самое отдельной страницей — с оболочкой кабинета. Нужна там,
 * где прежний адрес лежит вне оболочки раздела: у заданий №4, №5, №8
 * и у страниц темы.
 */
export function RedirectPage({ href, title }: RedirectProps) {
  return (
    <AppShell active="tasks">
      <main className="app-main">
        <Redirect href={href} title={title} />
      </main>
    </AppShell>
  );
}
