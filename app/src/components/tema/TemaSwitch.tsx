'use client';

import clsx from 'clsx';
import { useSyncExternalStore } from 'react';
import { postavitTemu, tekushchayaTema } from '@/lib/tema';
import './tema-switch.css';

function podpiska(cb: () => void): () => void {
  window.addEventListener('tema', cb);
  return () => window.removeEventListener('tema', cb);
}

/**
 * Переключатель «светлая / тёмная» в шапке: солнце и луна в стеклянной
 * таблетке. Тему до отрисовки ставит TEMA_SCRIPT (lib/tema.ts); здесь —
 * только смена. Пока виден лишь при html[data-tema-vidna] (?tema=dark).
 */
export function TemaSwitch({ className }: { className?: string }) {
  const tema = useSyncExternalStore(podpiska, tekushchayaTema, () => 'light' as const);

  const dark = tema === 'dark';
  const podskazka = dark ? 'Включить светлую тему' : 'Включить тёмную тему';

  return (
    <button
      type="button"
      role="switch"
      aria-checked={dark}
      aria-label="Тёмная тема"
      title={podskazka}
      className={clsx('tema-switch', className)}
      onClick={() => postavitTemu(dark ? 'light' : 'dark')}
    >
      <span className="tema-switch__plate" aria-hidden="true">
        <svg className="tema-switch__sun" viewBox="0 0 24 24" width="18" height="18">
          <circle cx="12" cy="12" r="4.2" />
          <g>
            <path d="M12 2.5v2.2M12 19.3v2.2M2.5 12h2.2M19.3 12h2.2M5.3 5.3l1.6 1.6M17.1 17.1l1.6 1.6M5.3 18.7l1.6-1.6M17.1 6.9l1.6-1.6" />
          </g>
        </svg>
        <svg className="tema-switch__moon" viewBox="0 0 24 24" width="18" height="18">
          <path d="M20 14.6A8.2 8.2 0 0 1 9.4 4a8.2 8.2 0 1 0 10.6 10.6Z" />
        </svg>
      </span>
    </button>
  );
}
