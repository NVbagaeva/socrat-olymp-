'use client';

import clsx from 'clsx';
import { ErrorState } from '@/components/ui/ErrorState';

export interface ErrorFallbackProps {
  /** Что случилось: показывается свёрнутым, для сообщения о проблеме. */
  error?: unknown;
  /**
   * page — вместо всей страницы; block — вместо одного блока
   * (рисунок, формула, подсказка), остальная страница работает.
   */
  variant?: 'page' | 'block';
  /** Что не удалось показать: «рисунок», «подсказку». Только для block. */
  what?: string;
}

/** Строка про ошибку для свёрнутого блока. Лишнего не раскрываем. */
function describe(error: unknown): string | null {
  if (error instanceof Error) {
    const digest = (error as Error & { digest?: string }).digest;
    return [`${error.name}: ${error.message}`, digest === undefined ? null : `код ${digest}`]
      .filter((part) => part !== null)
      .join(' · ');
  }
  return typeof error === 'string' ? error : null;
}

/**
 * Сообщение об ошибке для страницы и для отдельного блока.
 *
 * Обычные ссылки и кнопки, а не роутер Next: ошибка могла случиться
 * как раз в роутере, и переход через него не сработает. «Обновить
 * страницу» перезагружает её целиком, «На главную» — обычная ссылка.
 */
export function ErrorFallback({ error, variant = 'page', what }: ErrorFallbackProps) {
  const details = describe(error);
  const block = variant === 'block';

  return (
    <div className={clsx('errfb', block && 'errfb--block')}>
      <ErrorState
        title={block ? `Не удалось показать ${what ?? 'этот блок'}` : 'Не удалось открыть страницу'}
        description={
          block
            ? 'Остальная страница работает. Обновите страницу: обычно этого хватает.'
            : 'Обновите её: обычно этого хватает. Если не помогло, вернитесь на главную.'
        }
        action={
          <div className="errfb__actions">
            <button
              type="button"
              className="btn btn--primary"
              onClick={() => window.location.reload()}
            >
              Обновить страницу
            </button>
            {/* Обычная ссылка, не Link: ошибка могла быть в самом роутере, жёсткий переход надёжнее. */}
            {/* eslint-disable-next-line @next/next/no-html-link-for-pages */}
            <a className="btn btn--secondary" href="/">
              На главную
            </a>
          </div>
        }
      />
      {details === null ? null : (
        <details className="errfb__details">
          <summary>Подробности для разработчика</summary>
          <pre>{details}</pre>
        </details>
      )}
    </div>
  );
}
