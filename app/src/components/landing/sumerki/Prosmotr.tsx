'use client';

import { useCallback, useEffect, useRef, useState, useSyncExternalStore } from 'react';
import { assetUrl } from '@/lib/assetUrl';
import './prosmotr.css';

export interface SlaydProsmotra {
  /** Имя файлов: public/images/glavnaya/vitrina-<imya>-polnyy-{1200,1588}.webp */
  imya: string;
  podpis: string;
}

const polnyy = (imya: string, w: number) =>
  assetUrl(`/images/glavnaya/vitrina-${imya}-polnyy-${w}.webp`);

const bezPodpiski = () => () => {};

/**
 * Просмотр снимков витрины: родной <dialog> (фокус внутри, Esc
 * закрывает), снимок крупно с прокруткой по вертикали, стрелки и
 * клавиши ← →, свайп на телефоне, «на весь экран» — где браузер это
 * умеет (на iPhone кнопки нет). Файлы грузятся только при открытии.
 */
export function Prosmotr({
  slaydy,
  nomer,
  onNomer,
}: {
  slaydy: readonly SlaydProsmotra[];
  nomer: number | null;
  onNomer: (n: number | null) => void;
}) {
  const dialog = useRef<HTMLDialogElement>(null);
  const scena = useRef<HTMLDivElement>(null);
  const start = useRef<{ x: number; y: number } | null>(null);
  const [ekran, setEkran] = useState(false);
  const mozhnoEkran = useSyncExternalStore(
    bezPodpiski,
    () => document.fullscreenEnabled === true,
    () => false,
  );
  const n = slaydy.length;

  const listat = useCallback(
    (shag: number) => {
      if (nomer === null) return;
      onNomer((nomer + shag + n) % n);
    },
    [nomer, n, onNomer],
  );

  useEffect(() => {
    const smena = () => setEkran(document.fullscreenElement !== null);
    document.addEventListener('fullscreenchange', smena);
    return () => document.removeEventListener('fullscreenchange', smena);
  }, []);

  useEffect(() => {
    const d = dialog.current;
    if (d === null) return;
    if (nomer !== null && !d.open) d.showModal();
    if (nomer === null && d.open) d.close();
  }, [nomer]);

  /* Новый снимок — с начала; соседние подгружаются заранее. */
  useEffect(() => {
    if (nomer === null) return;
    scena.current?.scrollTo({ top: 0 });
    for (const d of [1, -1]) {
      const s = slaydy[(nomer + d + n) % n];
      if (s === undefined) continue;
      const img = new Image();
      img.sizes = '(max-width: 900px) 94vw, 860px';
      img.srcset = `${polnyy(s.imya, 1200)} 1200w, ${polnyy(s.imya, 1588)} 1588w`;
    }
  }, [nomer, n, slaydy]);

  const zakryt = () => {
    if (document.fullscreenElement !== null) void document.exitFullscreen();
    onNomer(null);
  };

  const tekushchiy = nomer === null ? null : slaydy[nomer];

  return (
    <dialog
      ref={dialog}
      className="prosmotr"
      aria-label="Снимки сайта"
      onClose={() => onNomer(null)}
      onKeyDown={(e) => {
        if (e.key === 'ArrowRight') {
          e.preventDefault();
          listat(1);
        } else if (e.key === 'ArrowLeft') {
          e.preventDefault();
          listat(-1);
        }
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget) zakryt();
      }}
    >
      {tekushchiy ? (
        <>
          <div className="prosmotr__verh">
            <p className="prosmotr__podpis" aria-live="polite">
              <span>
                {(nomer ?? 0) + 1} / {n}
              </span>
              {tekushchiy.podpis}
            </p>
            <div className="prosmotr__knopki">
              {mozhnoEkran ? (
                <button
                  type="button"
                  className="prosmotr__knopka"
                  aria-label={ekran ? 'Выйти из полноэкранного режима' : 'На весь экран'}
                  onClick={() => {
                    if (document.fullscreenElement !== null) void document.exitFullscreen();
                    else void dialog.current?.requestFullscreen();
                  }}
                >
                  <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
                    {ekran ? (
                      <path d="M9 4v5H4M15 4v5h5M9 20v-5H4M15 20v-5h5" />
                    ) : (
                      <path d="M4 9V4h5M20 9V4h-5M4 15v5h5M20 15v5h-5" />
                    )}
                  </svg>
                </button>
              ) : null}
              <button
                type="button"
                className="prosmotr__knopka"
                aria-label="Закрыть"
                onClick={zakryt}
              >
                <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
                  <path d="M6 6l12 12M18 6L6 18" />
                </svg>
              </button>
            </div>
          </div>
          <div
            ref={scena}
            className="prosmotr__scena"
            onPointerDown={(e) => {
              start.current = { x: e.clientX, y: e.clientY };
            }}
            onPointerUp={(e) => {
              const s = start.current;
              start.current = null;
              if (s === null) return;
              const dx = e.clientX - s.x;
              if (Math.abs(dx) > 60 && Math.abs(dx) > Math.abs(e.clientY - s.y) * 1.5) {
                listat(dx < 0 ? 1 : -1);
              }
            }}
          >
            <img
              key={`${tekushchiy.imya}-${nomer}`}
              className="prosmotr__list"
              srcSet={`${polnyy(tekushchiy.imya, 1200)} 1200w, ${polnyy(tekushchiy.imya, 1588)} 1588w`}
              sizes="(max-width: 900px) 94vw, 860px"
              src={polnyy(tekushchiy.imya, 1200)}
              alt={tekushchiy.podpis}
              decoding="async"
              draggable={false}
            />
          </div>
          {n > 1 ? (
            <>
              <button
                type="button"
                className="prosmotr__strelka prosmotr__strelka--nazad"
                aria-label="Предыдущий снимок"
                onClick={() => listat(-1)}
              >
                <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
                  <path d="M15 5l-7 7 7 7" />
                </svg>
              </button>
              <button
                type="button"
                className="prosmotr__strelka prosmotr__strelka--vpered"
                aria-label="Следующий снимок"
                onClick={() => listat(1)}
              >
                <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
                  <path d="M9 5l7 7-7 7" />
                </svg>
              </button>
            </>
          ) : null}
        </>
      ) : null}
    </dialog>
  );
}
