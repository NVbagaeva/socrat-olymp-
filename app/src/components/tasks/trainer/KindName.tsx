'use client';

import { useEffect, useState } from 'react';

/**
 * Название типа задания в сводке тренажёра. В названиях бывают
 * формулы ($…$): их набирает KaTeX.
 *
 * KaTeX — около 75 КБ после сжатия, а сводка лежит на странице темы,
 * где он до этого не нужен. Поэтому он подгружается отдельно: пока
 * едет, название невидимо и занимает своё место (сырой TeX не
 * мелькает), а при сбое загрузки остаётся обычным текстом.
 */
export function KindName({ title, className }: { title: string; className?: string }) {
  const [html, setHtml] = useState<string | null>(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    let alive = true;
    import('@/lib/tex')
      .then(({ typeset }) => {
        if (alive) {
          setHtml(typeset(title));
        }
      })
      .catch(() => {
        if (alive) {
          setFailed(true);
        }
      });
    return () => {
      alive = false;
    };
  }, [title]);

  if (html === null) {
    return (
      <span
        {...(className === undefined ? {} : { className })}
        {...(failed ? {} : { style: { visibility: 'hidden' as const } })}
      >
        {title.replace(/\$/g, '')}
      </span>
    );
  }
  return (
    <span
      {...(className === undefined ? {} : { className })}
      dangerouslySetInnerHTML={{ __html: html }}
    />
  );
}
