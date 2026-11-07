'use client';

import { useLayoutEffect } from 'react';

/**
 * Перенос со старого адреса, когда страница-заглушка открылась
 * переходом внутри сайта: встроенный скрипт Redirect.tsx в этом
 * случае не выполняется. `location.replace` — до отрисовки, без записи
 * в историю; ?… и #… прежнего адреса сохраняются.
 */
export function RedirectNow({ href }: { href: string }) {
  useLayoutEffect(() => {
    const l = window.location;
    let target = href;
    if (!target.includes('?') && !target.includes('#')) target += l.search;
    if (!target.includes('#')) target += l.hash;
    l.replace(target);
  }, [href]);
  return null;
}
