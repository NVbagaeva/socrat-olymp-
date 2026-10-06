'use client';

import { useEffect } from 'react';
import { reloadOnceForChunkError } from '@/lib/chunkReload';

/**
 * Последняя линия: ошибка в самой оболочке (в корневом layout). Тогда
 * замены у страницы нет, поэтому здесь свои <html> и <body>.
 *
 * Стили сайта при такой ошибке могут не загрузиться, поэтому вёрстка
 * простая и со своими запасными цветами, а переменные дизайн-системы —
 * если они всё же есть.
 */
export default function GlobalError({ error }: { error: Error & { digest?: string } }) {
  useEffect(() => {
    if (!reloadOnceForChunkError(error)) {
      console.error('Оболочка сайта не отрисовалась', error);
    }
  }, [error]);

  const button = {
    font: 'inherit',
    fontWeight: 600,
    padding: '12px 20px',
    borderRadius: 12,
    border: '1px solid var(--color-primary, #1f5fd1)',
    textDecoration: 'none',
    cursor: 'pointer',
  } as const;

  return (
    <html lang="ru">
      <body
        style={{
          margin: 0,
          fontFamily: 'system-ui, -apple-system, "Segoe UI", sans-serif',
          background: 'var(--color-bg, #f4f7fd)',
          color: 'var(--color-text, #1a2233)',
        }}
      >
        <main
          style={{ maxWidth: 420, margin: '0 auto', padding: '96px 24px', textAlign: 'center' }}
        >
          <h1 style={{ fontSize: 22, margin: '0 0 12px' }}>Что-то пошло не так</h1>
          <p style={{ margin: '0 0 24px', lineHeight: 1.5 }}>
            Сайт не открылся. Обновите страницу: обычно этого хватает. Если не помогло, зайдите на
            главную чуть позже.
          </p>
          <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
            <button
              type="button"
              onClick={() => window.location.reload()}
              style={{ ...button, background: 'var(--color-primary, #1f5fd1)', color: '#fff' }}
            >
              Обновить страницу
            </button>
            {/* Обычная ссылка, не Link: роутер мог сломаться, жёсткий переход надёжнее. */}
            {/* eslint-disable-next-line @next/next/no-html-link-for-pages */}
            <a
              href="/"
              style={{
                ...button,
                background: 'transparent',
                color: 'var(--color-primary, #1f5fd1)',
              }}
            >
              На главную
            </a>
          </div>
        </main>
      </body>
    </html>
  );
}
