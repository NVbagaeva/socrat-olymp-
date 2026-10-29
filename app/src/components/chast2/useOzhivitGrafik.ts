'use client';

import { useEffect, type RefObject } from 'react';
import { ozhivitGrafiki } from '@/lib/povyshennye/chast2/grafikZhivoy';

/**
 * Оживить рисунки с подвижной прямой внутри готового HTML решения (№19,
 * lib/povyshennye/chast2/grafikZhivoy.ts). deps — когда HTML внутри узла
 * сменился.
 */
export function useOzhivitGrafik(
  ref: RefObject<HTMLElement | null>,
  deps: readonly unknown[],
): void {
  useEffect(() => {
    const node = ref.current;
    return node === null ? undefined : ozhivitGrafiki(node);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);
}
