import type { ReactNode } from 'react';
import { AlertIcon } from '@/components/ui';

/** Плашка под сводкой: голубая подложка, значок слева. */
export function Note({ children }: { children: ReactNode }) {
  return (
    <p className="cfg-note">
      <span className="cfg-note__ico" aria-hidden="true">
        <AlertIcon />
      </span>
      {children}
    </p>
  );
}
