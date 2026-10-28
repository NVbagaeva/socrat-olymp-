'use client';

import { createElement, useEffect, type RefObject } from 'react';
import type { Root } from 'react-dom/client';

/**
 * Оживить чертежи внутри готового HTML (решение по пунктам): обёртки
 * .zh3d[data-zh3d] (lib/stereo/zhivoy.ts, obernut3d) становятся живыми
 * чертежами. Код чертежей грузится, только если такие обёртки есть.
 * deps — когда HTML внутри узла сменился.
 */
export function useOzhivit3d(ref: RefObject<HTMLElement | null>, deps: readonly unknown[]): void {
  useEffect(() => {
    const node = ref.current;
    if (node === null) return undefined;
    const uzly = [...node.querySelectorAll<HTMLElement>('.zh3d[data-zh3d]')];
    if (uzly.length === 0) return undefined;
    let zhiv = true;
    const roots: Root[] = [];
    void Promise.all([import('react-dom/client'), import('./Zhivoy3d')]).then(
      ([{ createRoot }, { Zhivoy3d, razobrat3d }]) => {
        if (!zhiv) return;
        for (const el of uzly) {
          const d = razobrat3d(el.dataset.zh3d);
          if (d === null) continue;
          el.removeAttribute('data-zh3d');
          const root = createRoot(el);
          root.render(createElement(Zhivoy3d, { d }));
          roots.push(root);
        }
      },
    );
    return () => {
      zhiv = false;
      /* Размонтировать после текущего рендера React. */
      window.setTimeout(() => roots.forEach((r) => r.unmount()), 0);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);
}
