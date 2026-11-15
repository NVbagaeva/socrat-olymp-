'use client';

import { clsx } from 'clsx';
import { useEffect, useRef, useState } from 'react';
import { taymerKadr, vspyshka, VSPYSHKA_MS } from '@/lib/ustnyySchet/taymer';
import type { Kolco3d } from './taymer3d/scena';
import { KolcoSvg, type TaymerProps } from './Taymer2d';
import { TaymerCifry } from './TaymerCifry';

/**
 * 3D-таймер: стеклянное кольцо на three.js под цифрами-текстом.
 * Сцена грузится динамическим import() только здесь, на экране
 * тренировки; пока она грузится — то же кольцо на SVG. Не создался
 * контекст WebGL или он потерян — onOtkaz, и таймер насовсем становится
 * SVG-кольцом.
 */
export function Taymer3d({
  ms,
  limitMs,
  naPauze = false,
  onOtkaz,
}: TaymerProps & { onOtkaz: () => void }) {
  const host = useRef<HTMLDivElement>(null);
  const kolco = useRef<Kolco3d | null>(null);
  const otkaz = useRef(onOtkaz);
  const [gotov, setGotov] = useState(false);
  const k = taymerKadr(ms, limitMs);

  useEffect(() => {
    otkaz.current = onOtkaz;
  }, [onOtkaz]);

  /* Сцена — один раз; размер — по блоку таймера. */
  useEffect(() => {
    let otmena = false;
    let nablyudatel: ResizeObserver | null = null;
    import('./taymer3d/scena')
      .then(({ sozdatKolco }) => {
        const el = host.current;
        if (otmena || el === null) return;
        const kol = sozdatKolco(el, () => otkaz.current());
        kolco.current = kol;
        kol.razmer(el.clientWidth);
        nablyudatel = new ResizeObserver(() => kol.razmer(el.clientWidth));
        nablyudatel.observe(el);
        setGotov(true);
      })
      .catch(() => {
        if (!otmena) otkaz.current();
      });
    return () => {
      otmena = true;
      nablyudatel?.disconnect();
      kolco.current?.ubrat();
      kolco.current = null;
    };
  }, []);

  /* Кадр — на каждое новое время. */
  useEffect(() => {
    if (!gotov) return;
    kolco.current?.kadr(taymerKadr(ms, limitMs), 0);
  }, [gotov, ms, limitMs]);

  /* Вспышка на нуле: короткая анимация своими кадрами (время — из
     performance.now(), часы тренировки к этому моменту уже стоят). */
  const nol = k.nol;
  useEffect(() => {
    if (!gotov || !nol) return;
    const t0 = performance.now();
    let raf = 0;
    const tick = () => {
      const t = performance.now() - t0;
      kolco.current?.kadr(taymerKadr(limitMs ?? 0, limitMs), vspyshka(t));
      if (t < VSPYSHKA_MS) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [gotov, nol, limitMs]);

  return (
    <div
      className={clsx(
        'us-taymer',
        'us-taymer--3d',
        k.poslednie && 'is-poslednie',
        k.nol && 'is-nol',
        naPauze && 'is-pauza',
        gotov && 'is-gotov',
      )}
      data-taymer={gotov ? '3d' : '2d'}
      data-ms={Math.round(k.vniz ? k.ostalos : ms)}
    >
      <div ref={host} className="us-taymer__3d" aria-hidden="true" />
      {!gotov && <KolcoSvg k={k} />}
      <TaymerCifry k={k} />
    </div>
  );
}
