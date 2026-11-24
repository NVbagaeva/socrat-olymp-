'use client';

import { useEffect, useRef, useState, type ReactNode } from 'react';

/**
 * Рисует детей, когда место подходит к экрану (за 400 px). Код тяжёлых
 * блоков (мини-задача, демо генератора) лежит за dynamic import и
 * грузится только тогда — первая загрузка страницы не растёт. До
 * появления — пустое место заданной высоты, вёрстка не прыгает.
 */
export function PriPoyavlenii({
  children,
  minHeight,
  className,
}: {
  children: ReactNode;
  minHeight: number;
  className?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [vidno, setVidno] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (el === null) return undefined;
    const io = new IntersectionObserver(
      (zapisi) => {
        if (zapisi.some((z) => z.isIntersecting)) {
          setVidno(true);
          io.disconnect();
        }
      },
      { rootMargin: '400px 0px' },
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);
  return (
    <div ref={ref} className={className} style={vidno ? undefined : { minHeight }}>
      {vidno ? children : null}
    </div>
  );
}
