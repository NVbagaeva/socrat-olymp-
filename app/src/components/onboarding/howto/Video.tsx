'use client';

import { clsx } from 'clsx';
import { useRef, useState } from 'react';
import { HOWTO } from '@/content/kakPolzovatsya';
import { assetUrl } from '@/lib/assetUrl';

const V = HOWTO.video;

/**
 * Видео о сайте: заставка из начала ролика (иначе Safari до нажатия
 * показывает чёрный прямоугольник), большая стеклянная кнопка поверх
 * неё и главы под видео. Глава перематывает и запускает ролик; пока
 * он идёт, подсвечена текущая.
 */
export function Video({ children }: { children?: React.ReactNode }) {
  const ref = useRef<HTMLVideoElement>(null);
  const [nachato, setNachato] = useState(false);
  const [t, setT] = useState(0);

  const glava = V.glavy.reduce((acc, g, i) => (t + 0.05 >= g.t ? i : acc), 0);

  const igrat = (start?: number) => {
    const v = ref.current;
    if (v === null) return;
    if (start !== undefined) {
      v.currentTime = start;
      setT(start);
    }
    setNachato(true);
    void v.play().catch(() => {
      /* Браузер не дал запустить — остаётся кнопка у самого плеера. */
    });
  };

  return (
    <section className="howto__video" aria-labelledby="howto-video">
      <h2 className="howto__h" id="howto-video">
        {V.title}
      </h2>
      <div className="vid">
        <video
          ref={ref}
          className="vid__player"
          controls={nachato}
          playsInline
          preload="metadata"
          poster={assetUrl('/video/budetege-tour-poster.webp')}
          aria-label={V.label}
          width={1920}
          height={1080}
          onPlay={() => setNachato(true)}
          onTimeUpdate={(e) => setT(e.currentTarget.currentTime)}
          onSeeked={(e) => setT(e.currentTarget.currentTime)}
        >
          <source src={assetUrl('/video/budetege-tour-20261124.mp4')} type="video/mp4" />
          Ваш браузер не поддерживает воспроизведение видео.
        </video>
        {nachato ? null : (
          <button type="button" className="vid__start" onClick={() => igrat()}>
            <span className="vid__krug" aria-hidden="true">
              <svg viewBox="0 0 24 24">
                <path d="M8 5.5v13l10.5-6.5z" />
              </svg>
            </span>
            <span className="vid__smotret">{V.smotret(V.sekund)}</span>
          </button>
        )}
      </div>
      <div className="vid__glavy" role="group" aria-label={V.glavyLabel}>
        {V.glavy.map((g, i) => (
          <button
            key={g.label}
            type="button"
            className={clsx('vid__glava', nachato && i === glava && 'is-active')}
            aria-pressed={nachato && i === glava}
            onClick={() => igrat(g.t)}
          >
            <span className="vid__vremya">{vremya(g.t)}</span>
            {g.label}
          </button>
        ))}
      </div>
      {children}
    </section>
  );
}

function vremya(sek: number): string {
  const s = Math.floor(sek);
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;
}
