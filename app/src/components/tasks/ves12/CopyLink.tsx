'use client';

import { useState, useSyncExternalStore } from 'react';
import { Button } from '@/components/ui';
import { zachyotText } from '@/content/ves12';

export interface CopyLinkProps {
  label: string;
  /** Адрес от корня сайта: /zadaniya/12/zachyot/rabota/?… */
  path: string;
  testId?: string;
}

const noSubscribe = () => () => {};

/** Ссылка для учеников: полный адрес, «Копировать» и переход по ней. */
export function CopyLink({ label, path, testId }: CopyLinkProps) {
  const origin = useSyncExternalStore(
    noSubscribe,
    () => window.location.origin,
    () => '',
  );
  const [copied, setCopied] = useState(false);
  const local = path;
  const full = `${origin}${local}`;

  async function copy() {
    try {
      await navigator.clipboard.writeText(full);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      /* Буфер недоступен — адрес виден в поле, его можно выделить. */
    }
  }

  return (
    <div className="ves-link">
      <span className="ves-link__label">{label}</span>
      <a className="ves-link__url" href={local} target="_blank" rel="noopener" data-testid={testId}>
        {full}
      </a>
      <Button size="sm" variant="secondary" onClick={copy}>
        {copied ? zachyotText.copied : zachyotText.copy}
      </Button>
    </div>
  );
}
