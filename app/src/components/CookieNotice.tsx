'use client';

import { useSyncExternalStore } from 'react';
import { cookieNotice } from '@/content/legal/cookies';
import { cookieNoticeSnapshot, saveCookieChoice, subscribeCookieChoice } from '@/lib/legal/cookies';

/**
 * Баннер о cookie внизу экрана. Показывается один раз: «Понятно»
 * запоминается в браузере. На сервере не рисуется — что ответил
 * посетитель, известно только в браузере.
 */
export function CookieNotice() {
  const open = useSyncExternalStore(subscribeCookieChoice, cookieNoticeSnapshot, () => false);
  const { analytics } = cookieNotice;

  if (!open) return null;

  const answer = (choice: { analytics?: boolean }) => saveCookieChoice({ seen: true, ...choice });

  return (
    <section className="cookie-notice" aria-label="Cookie">
      <p className="cookie-notice__t">
        {cookieNotice.text} {cookieNotice.more}{' '}
        <a href={cookieNotice.moreLink.href}>{cookieNotice.moreLink.label}</a>.
        {analytics.enabled ? ` ${analytics.text}` : null}
      </p>
      <div className="cookie-notice__a">
        {analytics.enabled ? (
          <>
            <button
              type="button"
              className="btn btn--secondary btn--sm"
              onClick={() => answer({ analytics: false })}
            >
              {analytics.decline}
            </button>
            <button
              type="button"
              className="btn btn--primary btn--sm"
              onClick={() => answer({ analytics: true })}
            >
              {analytics.accept}
            </button>
          </>
        ) : (
          <button type="button" className="btn btn--primary btn--sm" onClick={() => answer({})}>
            {cookieNotice.ok}
          </button>
        )}
      </div>
    </section>
  );
}
