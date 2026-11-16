'use client';

import Link from 'next/link';
import { useCallback, useEffect, useRef, useState, useSyncExternalStore } from 'react';
import {
  SNIMKI_VECHERA,
  TEKSTY_VECHERA,
  type KartochkaVechera,
  type SnimokLista,
} from '@/content/vecher';
import { assetUrl } from '@/lib/assetUrl';
import './vecher.css';

const kadr = (imya: string) =>
  `${assetUrl(`/images/glavnaya/vecher-${imya}-520.webp`)} 520w, ${assetUrl(`/images/glavnaya/vecher-${imya}-1040.webp`)} 1040w`;
const list = (imya: string) =>
  `${assetUrl(`/images/glavnaya/vecher-${imya}-list-1200.webp`)} 1200w, ${assetUrl(`/images/glavnaya/vecher-${imya}-list-1588.webp`)} 1588w`;

const bezPodpiski = () => () => {};

interface Slayd extends SnimokLista {
  kartochka: KartochkaVechera['id'];
}

/**
 * Блок «Мы взяли на себя то, что обычно забирает ваш вечер» для главной с
 * синей сценой. Настоящие снимки листов сайта
 * (scripts/glavnaya/snimki-vecher.mjs): в карточке листы лежат веером,
 * нажатие открывает просмотр — лист крупно, стрелки листают все листы
 * блока, есть кнопка «на весь экран». Тексты — content/vecher.ts (два
 * варианта на выбор, tekst). Снимки и просмотр грузятся лениво.
 */
export function VecherKartochki({ tekst = 'a' }: { tekst?: 'a' | 'b' }) {
  const t = TEKSTY_VECHERA[tekst];
  const slaydy: Slayd[] = t.kartochki.flatMap((k) =>
    SNIMKI_VECHERA[k.id].map((s) => ({ ...s, kartochka: k.id })),
  );
  const [otkryt, setOtkryt] = useState<number | null>(null);

  return (
    <section className="band band--soft vk" id="how" aria-labelledby="vk-z">
      <div className="wrap">
        <div className="band__head vk__head">
          <h2 id="vk-z">{t.zagolovok}</h2>
          <p>{t.lid}</p>
        </div>
        <ol className="vk__spisok">
          {t.kartochki.map((k) => {
            const snimki = SNIMKI_VECHERA[k.id];
            const nachalo = slaydy.findIndex((s) => s.kartochka === k.id);
            return (
              <li className={`vk-karta vk-karta--${k.id}`} key={k.id}>
                <button
                  type="button"
                  className="vk-scena"
                  onClick={() => setOtkryt(nachalo)}
                  aria-label={`Рассмотреть листы: ${k.metka}`}
                >
                  {snimki
                    .slice(0, 3)
                    .map((s, i) => ({ s, i }))
                    .reverse()
                    .map(({ s, i }) => (
                      <img
                        key={`${s.imya}-${i}`}
                        className={`vk-list vk-list--${i}`}
                        srcSet={kadr(s.imya)}
                        sizes="(max-width: 767.98px) 78vw, (max-width: 1199.98px) 44vw, 460px"
                        src={assetUrl(`/images/glavnaya/vecher-${s.imya}-520.webp`)}
                        alt=""
                        width={520}
                        height={409}
                        loading="lazy"
                        decoding="async"
                        draggable={false}
                      />
                    ))}
                  {k.id === 'materialy' ? (
                    <span className="vk-pdf" aria-hidden="true">
                      PDF
                    </span>
                  ) : null}
                  <span className="vk-scena__lupa" aria-hidden="true">
                    <svg viewBox="0 0 24 24" focusable="false">
                      <circle cx="10.5" cy="10.5" r="6.5" />
                      <path d="M15.5 15.5L20 20M8 10.5h5M10.5 8v5" />
                    </svg>
                    Рассмотреть
                  </span>
                </button>
                <div className="vk-karta__tekst">
                  <p className="vk-karta__metka">
                    <span>{k.nomer}</span>
                    {k.metka}
                  </p>
                  <h3>{k.zagolovok}</h3>
                  <p className="vk-karta__opis">{k.tekst}</p>
                  <Link className="vk-karta__ssylka" href={k.ssylka.href}>
                    {k.ssylka.tekst}
                    <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
                      <path d="M5 12h13M12 6l6 6-6 6" />
                    </svg>
                  </Link>
                </div>
              </li>
            );
          })}
        </ol>
      </div>
      <Prosmotr slaydy={slaydy} nomer={otkryt} onNomer={setOtkryt} />
    </section>
  );
}

/**
 * Просмотр листов: родной <dialog> (фокус внутри, Esc закрывает), лист
 * крупно с прокруткой по вертикали, стрелки и клавиши ← →, свайп на
 * телефоне, «на весь экран» — где браузер это умеет.
 */
function Prosmotr({
  slaydy,
  nomer,
  onNomer,
}: {
  slaydy: Slayd[];
  nomer: number | null;
  onNomer: (n: number | null) => void;
}) {
  const dialog = useRef<HTMLDialogElement>(null);
  const scena = useRef<HTMLDivElement>(null);
  const [ekran, setEkran] = useState(false);
  /* Полный экран есть не везде (iPhone — нет): тогда кнопки нет. */
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

  /* Открыть и закрыть — вместе с номером. */
  useEffect(() => {
    const d = dialog.current;
    if (d === null) return;
    if (nomer !== null && !d.open) d.showModal();
    if (nomer === null && d.open) d.close();
  }, [nomer]);

  /* Новый лист — с начала страницы; соседние подгружаются заранее. */
  useEffect(() => {
    if (nomer === null) return;
    scena.current?.scrollTo({ top: 0 });
    for (const d of [1, -1]) {
      const s = slaydy[(nomer + d + n) % n];
      if (s === undefined) continue;
      const img = new Image();
      img.sizes = '(max-width: 900px) 94vw, 860px';
      img.srcset = list(s.imya);
    }
  }, [nomer, n, slaydy]);

  const zakryt = () => {
    if (document.fullscreenElement !== null) void document.exitFullscreen();
    onNomer(null);
  };

  /* Свайп вбок листает; вертикальный жест — прокрутка листа. */
  const start = useRef<{ x: number; y: number } | null>(null);
  const tekushchiy = nomer === null ? null : slaydy[nomer];

  return (
    <dialog
      ref={dialog}
      className="vk-prosmotr"
      aria-label="Листы сайта"
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
          <div className="vk-prosmotr__verh">
            <p className="vk-prosmotr__podpis" aria-live="polite">
              <span>
                {(nomer ?? 0) + 1} / {n}
              </span>
              {tekushchiy.podpis}
            </p>
            <div className="vk-prosmotr__knopki">
              {mozhnoEkran ? (
                <button
                  type="button"
                  className="vk-prosmotr__knopka"
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
                className="vk-prosmotr__knopka"
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
            className="vk-prosmotr__scena"
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
              className="vk-prosmotr__list"
              srcSet={list(tekushchiy.imya)}
              sizes="(max-width: 900px) 94vw, 860px"
              src={assetUrl(`/images/glavnaya/vecher-${tekushchiy.imya}-list-1200.webp`)}
              alt={tekushchiy.podpis}
              width={1200}
              height={1686}
              decoding="async"
              draggable={false}
            />
          </div>
          <button
            type="button"
            className="vk-prosmotr__strelka vk-prosmotr__strelka--nazad"
            aria-label="Предыдущий лист"
            onClick={() => listat(-1)}
          >
            <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
              <path d="M15 5l-7 7 7 7" />
            </svg>
          </button>
          <button
            type="button"
            className="vk-prosmotr__strelka vk-prosmotr__strelka--vpered"
            aria-label="Следующий лист"
            onClick={() => listat(1)}
          >
            <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
              <path d="M9 5l7 7-7 7" />
            </svg>
          </button>
        </>
      ) : null}
    </dialog>
  );
}
