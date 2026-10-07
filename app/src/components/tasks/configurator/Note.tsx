import type { ReactNode } from 'react';
import { clsx } from 'clsx';
import { AlertIcon } from '@/components/ui';

/**
 * Плашка под сводкой: голубая подложка, значок слева. warning —
 * предупреждение генератора: тёплая подложка, читается сразу.
 */
export function Note({ children, tone = 'info' }: { children: ReactNode; tone?: 'info' | 'warning' }) {
  return (
    <p
      className={clsx('cfg-note', tone === 'warning' && 'cfg-note--warning')}
      role={tone === 'warning' ? 'status' : undefined}
    >
      <span className="cfg-note__ico" aria-hidden="true">
        <AlertIcon />
      </span>
      {children}
    </p>
  );
}
