import type { Metadata } from 'next';
import { EmptyState } from '@/components/ui';
import { RedirectNow } from './RedirectNow';

export interface RedirectProps {
  /** Новый адрес страницы. */
  href: string;
  /** Как называется новое место — подпись кнопки. */
  title: string;
}

/**
 * Прежний адрес страницы: уводит на новый.
 *
 * Главный перенос — серверный 301 в public/.htaccess: до этой
 * страницы браузер обычно не доходит. Она — страховка на случай,
 * когда правила сервера не сработали, и уводит сразу, ничего не
 * показывая:
 *
 * - `<meta http-equiv="refresh" content="0">` и `<link rel="canonical">`
 *   React поднимает в `<head>`;
 * - встроенный скрипт делает `location.replace()` (без записи в
 *   историю, «Назад» не возвращает на заглушку), сохраняя ?… и #…;
 * - при переходе внутри сайта (без перезагрузки) встроенный скрипт не
 *   выполняется — его делает `RedirectNow`;
 * - текст «Страница переехала» виден только без JavaScript (`<noscript>`).
 *
 * Внутренние ссылки сайта на такие адреса не ведут: их ловит
 * scripts/check-links.mjs. Новых адресов этим компонентом не заводят.
 */
export const REDIRECT_METADATA: Metadata = { robots: { index: false, follow: true } };

/** Скрипт переноса: новый адрес + прежние ?… и #…, если у нового своих нет. */
function redirectScript(href: string): string {
  const target = JSON.stringify(href).replace(/</g, '\\u003c');
  return (
    `(function(){var u=${target},l=window.location;` +
    `if(u.indexOf('?')<0&&u.indexOf('#')<0)u+=l.search;` +
    `if(u.indexOf('#')<0)u+=l.hash;` +
    `l.replace(u);})();`
  );
}

export function Redirect({ href, title }: RedirectProps) {
  return (
    <>
      <meta httpEquiv="refresh" content={`0; url=${href}`} />
      <link rel="canonical" href={href} />
      <script dangerouslySetInnerHTML={{ __html: redirectScript(href) }} />
      <RedirectNow href={href} />
      <noscript>
        <main className="app-main">
          <EmptyState
            title="Страница переехала"
            description="Этот адрес больше не используется."
            action={
              <a className="btn btn--primary" href={href}>
                {title}
              </a>
            }
          />
        </main>
      </noscript>
    </>
  );
}

/**
 * То же самое отдельной страницей. Оболочку кабинета (шапку, меню) не
 * рисуем: страница живёт долю секунды, и мелькать на ней нечему.
 */
export function RedirectPage(props: RedirectProps) {
  return <Redirect {...props} />;
}
