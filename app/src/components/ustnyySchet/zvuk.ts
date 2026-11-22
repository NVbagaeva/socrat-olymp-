'use client';

import { useCallback, useRef } from 'react';

/**
 * Короткий звук ответа (по умолчанию выключен). WebAudio создаётся
 * только при первом звуке: без включённого звука ничего не грузится.
 */
export function useZvuk(vkl: boolean): (verno: boolean) => void {
  const ctx = useRef<AudioContext | null>(null);
  return useCallback(
    (verno: boolean) => {
      if (!vkl || typeof window === 'undefined') return;
      try {
        ctx.current ??= new AudioContext();
        const c = ctx.current;
        const osc = c.createOscillator();
        const gain = c.createGain();
        osc.type = 'sine';
        osc.frequency.value = verno ? 880 : 220;
        gain.gain.setValueAtTime(0.0001, c.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.15, c.currentTime + 0.01);
        gain.gain.exponentialRampToValueAtTime(0.0001, c.currentTime + (verno ? 0.12 : 0.25));
        osc.connect(gain).connect(c.destination);
        osc.start();
        osc.stop(c.currentTime + 0.3);
      } catch {
        /* Нет звука — не беда. */
      }
    },
    [vkl],
  );
}
