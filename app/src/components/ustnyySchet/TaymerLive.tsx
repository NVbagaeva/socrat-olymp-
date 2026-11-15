'use client';

import { useEffect, useRef, useState } from 'react';
import type { Chasy } from '@/lib/ustnyySchet/chasy';
import { Taymer, type TaymerVid } from './Taymer';

export interface TaymerLiveProps {
  chasy: Chasy;
  limitMs: number | null;
  naPauze: boolean;
  /** Время на время вышло. */
  onVyshlo: () => void;
  vid?: TaymerVid;
}

/**
 * Живой таймер: перерисовка по кадрам, но время — из часов
 * (performance.now()), а не из числа кадров. На скрытой вкладке кадры
 * не идут — и рендер стоит; конец лимита ловит и обычный таймер, на
 * случай если кадры остановлены (фоновая вкладка в рейтинговом режиме).
 */
export function TaymerLive({ chasy, limitMs, naPauze, onVyshlo, vid }: TaymerLiveProps) {
  const [ms, setMs] = useState(() => chasy.proshlo());
  const vyshlo = useRef(onVyshlo);
  useEffect(() => {
    vyshlo.current = onVyshlo;
  }, [onVyshlo]);

  useEffect(() => {
    let raf = 0;
    let done = false;
    const tick = () => {
      raf = 0;
      const t = chasy.proshlo();
      setMs(t);
      if (limitMs !== null && t >= limitMs && !done) {
        done = true;
        vyshlo.current();
        return;
      }
      /* Скрытая вкладка — кадров не просим, рендер стоит. */
      if (!document.hidden) raf = window.requestAnimationFrame(tick);
    };
    raf = window.requestAnimationFrame(tick);
    const onVis = () => {
      if (!document.hidden && raf === 0 && !done) raf = window.requestAnimationFrame(tick);
    };
    document.addEventListener('visibilitychange', onVis);
    /* Подстраховка без кадров: проверка лимита раз в 250 мс. */
    const iv = window.setInterval(() => {
      if (limitMs !== null && chasy.proshlo() >= limitMs && !done) {
        done = true;
        setMs(limitMs);
        vyshlo.current();
      }
    }, 250);
    return () => {
      document.removeEventListener('visibilitychange', onVis);
      window.cancelAnimationFrame(raf);
      window.clearInterval(iv);
    };
  }, [chasy, limitMs]);

  return (
    <Taymer
      ms={limitMs !== null ? Math.min(ms, limitMs) : ms}
      limitMs={limitMs}
      naPauze={naPauze}
      {...(vid ? { vid } : {})}
    />
  );
}
