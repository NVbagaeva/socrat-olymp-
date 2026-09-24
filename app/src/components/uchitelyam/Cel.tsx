'use client';

import { useEffect, useRef } from 'react';
import { cel } from '@/lib/metrika';

/**
 * Невидимая отметка: когда она попадает в окно, в Метрику уходит цель.
 * Так считается «доскролл до цен» и «до формы» (§7.2). Один раз за визит.
 */
export function Cel({ name }: { name: string }) {
  const ref = useRef<HTMLSpanElement>(null);
  useEffect(() => {
    const el = ref.current;
    if (!el || !('IntersectionObserver' in window)) return;
    const io = new IntersectionObserver((entries) => {
      if (entries.some((e) => e.isIntersecting)) {
        cel(name);
        io.disconnect();
      }
    });
    io.observe(el);
    return () => io.disconnect();
  }, [name]);
  return <span ref={ref} aria-hidden="true" />;
}
