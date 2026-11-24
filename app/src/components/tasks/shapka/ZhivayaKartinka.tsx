'use client';

import { clsx } from 'clsx';
import {
  useCallback,
  useEffect,
  useRef,
  useState,
  useSyncExternalStore,
  type ComponentType,
  type KeyboardEvent,
  type PointerEvent,
} from 'react';
import type { VidZhivogo } from '@/content/shapki';
import type { RazdelKod } from '@/content/struktura';
import { zagruzitZhivoy, type ZhivoyProps } from './zhivye/tip';

export interface ZhivayaKartinkaProps {
  /**
   * Раздел, чей живой чертёж встаёт на место картинки. Не задан —
   * чертежа нет: по нажатию картинка поворачивается и покачивается
   * (шапка страницы «Как пользоваться сайтом»).
   */
  kod?: RazdelKod;
  src560: string;
  src280: string;
  /** Подпись картинки для скринридера. */
  alt: string;
  /** Описание живого чертежа. */
  label: string;
  podskazka: string;
  vid: VidZhivogo;
  obyomnaya: boolean;
}

/** Наклон за курсором, градусы. */
const NAKLON = 6;
/** Пружина наклона: жёсткость и затухание за кадр. */
const ZHESTKOST = 0.12;
const ZATUHANIE = 0.72;

const UMENSHIT = '(prefers-reduced-motion: reduce)';

function podpisatsyaTiho(cb: () => void): () => void {
  const mq = window.matchMedia(UMENSHIT);
  mq.addEventListener('change', cb);
  return () => mq.removeEventListener('change', cb);
}

function tihoSeychas(): boolean {
  if (typeof window === 'undefined') return false;
  return (
    window.matchMedia(UMENSHIT).matches ||
    document.documentElement.getAttribute('data-motion-level') === 'reduce'
  );
}

/**
 * Картинка шапки, которая оживает. Сначала — стеклянная картинка:
 * быстро, без сдвига вёрстки, с лёгким наклоном за курсором (±6°, на
 * пружине) и чипом-подсказкой. Код живого чертежа подгружается после
 * первой отрисовки, в свободное время браузера. Первое нажатие, касание
 * или Enter убирает картинку за 250 мс, на её месте — живой чертёж той
 * же композиции. Картинка возвращается только после перезагрузки.
 *
 * Плоский чертёж наклоняется за курсором так же, как картинка; объёмный
 * крутится сам и не наклоняется.
 */
export function ZhivayaKartinka({
  kod,
  src560,
  src280,
  alt,
  label,
  podskazka,
  vid,
  obyomnaya,
}: ZhivayaKartinkaProps) {
  const [Zhivoy, setZhivoy] = useState<ComponentType<ZhivoyProps> | null>(null);
  const [nuzhen, setNuzhen] = useState(false);
  const [pokazan, setPokazan] = useState(false);
  const tiho = useSyncExternalStore(podpisatsyaTiho, tihoSeychas, () => false);
  const ramka = useRef<HTMLDivElement>(null);
  const modul = useRef<Promise<unknown> | null>(null);

  const zagruzit = useCallback(() => {
    if (modul.current !== null) return modul.current;
    const p = kod === undefined ? null : zagruzitZhivoy(kod);
    modul.current =
      p?.then((m) => {
        setZhivoy(() => m.default);
      }) ?? Promise.resolve();
    return modul.current;
  }, [kod]);

  /* Код чертежа — после первой отрисовки, когда браузер свободен. */
  useEffect(() => {
    if (kod === undefined) return undefined;
    const w = window as Window & {
      requestIdleCallback?: (cb: () => void, o?: { timeout: number }) => number;
      cancelIdleCallback?: (id: number) => void;
    };
    if (w.requestIdleCallback !== undefined) {
      const id = w.requestIdleCallback(() => void zagruzit(), { timeout: 2500 });
      return () => w.cancelIdleCallback?.(id);
    }
    const t = window.setTimeout(() => void zagruzit(), 1200);
    return () => window.clearTimeout(t);
  }, [kod, zagruzit]);

  /* Смена: живой чертёж смонтирован — через кадр картинка гаснет. */
  useEffect(() => {
    if (!nuzhen || Zhivoy === null) return;
    const id = window.requestAnimationFrame(() => setPokazan(true));
    return () => window.cancelAnimationFrame(id);
  }, [nuzhen, Zhivoy]);

  const [kach, setKach] = useState(0);
  const ozhivit = useCallback(() => {
    if (kod === undefined) {
      /* Без чертежа: поворот с покачиванием, на каждое нажатие заново. */
      setKach((k) => k + 1);
      return;
    }
    if (nuzhen) return;
    setNuzhen(true);
    /* На телефоне живой чертёж встаёт под текстом во всю ширину:
       в кольце 112 px его не потянуть пальцем. */
    ramka.current?.closest('.shapka')?.classList.add('shapka--zhivaya');
    void zagruzit();
  }, [kod, nuzhen, zagruzit]);

  /* ── Наклон за курсором на пружине ── */
  const tsel = useRef({ x: 0, y: 0 });
  const tek = useRef({ x: 0, y: 0, vx: 0, vy: 0 });
  const kadr = useRef(0);
  const shagRef = useRef<() => void>(() => {});
  const shag = useCallback(() => {
    const t = tek.current;
    const g = tsel.current;
    t.vx = (t.vx + (g.x - t.x) * ZHESTKOST) * ZATUHANIE;
    t.vy = (t.vy + (g.y - t.y) * ZHESTKOST) * ZATUHANIE;
    t.x += t.vx;
    t.y += t.vy;
    ramka.current?.style.setProperty('--naklon-x', `${t.x.toFixed(2)}deg`);
    ramka.current?.style.setProperty('--naklon-y', `${t.y.toFixed(2)}deg`);
    const pokoy =
      Math.abs(t.vx) < 0.01 &&
      Math.abs(t.vy) < 0.01 &&
      Math.abs(g.x - t.x) < 0.01 &&
      Math.abs(g.y - t.y) < 0.01;
    kadr.current = pokoy ? 0 : window.requestAnimationFrame(shagRef.current);
  }, []);
  useEffect(() => {
    shagRef.current = shag;
  }, [shag]);
  const tolknut = useCallback(() => {
    if (kadr.current === 0) kadr.current = window.requestAnimationFrame(shag);
  }, [shag]);
  useEffect(() => () => window.cancelAnimationFrame(kadr.current), []);

  const naklonyat = !tiho && !(obyomnaya && pokazan);
  const onMove = (e: PointerEvent<HTMLDivElement>) => {
    if (!naklonyat || e.pointerType !== 'mouse') return;
    /* Пока кнопка нажата — тянут точку: плитку не качаем. */
    if (e.buttons !== 0) {
      tsel.current = { x: 0, y: 0 };
    } else {
      const r = e.currentTarget.getBoundingClientRect();
      const dx = (e.clientX - r.left) / r.width - 0.5;
      const dy = (e.clientY - r.top) / r.height - 0.5;
      tsel.current = { x: -dy * 2 * NAKLON, y: dx * 2 * NAKLON };
    }
    tolknut();
  };
  const onLeave = () => {
    tsel.current = { x: 0, y: 0 };
    tolknut();
  };

  const onPosterKey = (e: KeyboardEvent<HTMLButtonElement>) => {
    if (e.key.startsWith('Arrow')) {
      e.preventDefault();
      ozhivit();
    }
  };

  return (
    <div
      ref={ramka}
      className={clsx('zhk', `zhk--${vid}`, pokazan && 'is-zhivoy', naklonyat && 'zhk--naklon')}
      data-kach={kach === 0 ? undefined : kach % 2}
      onPointerMove={onMove}
      onPointerLeave={onLeave}
    >
      <div className="zhk__plitka">
        {nuzhen && Zhivoy !== null ? (
          <div className="zhk__zhivoy">
            <Zhivoy label={label} tiho={tiho} avtofokus />
          </div>
        ) : null}
        <button
          type="button"
          className="zhk__poster"
          aria-label={`${label} ${podskazka}`}
          onPointerDown={(e) => {
            /* Мышью — сразу, чтобы жест продолжился уже по чертежу.
               Пальцем — только тапом (click): касание, с которого
               начинается прокрутка страницы, картинку не трогает. */
            if (e.pointerType === 'mouse' && kod !== undefined) ozhivit();
          }}
          onClick={ozhivit}
          onKeyDown={onPosterKey}
          tabIndex={pokazan ? -1 : 0}
          aria-hidden={pokazan || undefined}
        >
          <picture>
            <source media="(max-width: 1023.98px)" srcSet={src280} type="image/webp" />
            <img
              src={src560}
              alt={alt}
              width={260}
              height={260}
              loading="eager"
              decoding="async"
              fetchPriority="high"
              draggable={false}
            />
          </picture>
        </button>
      </div>
      <span className="zhk__chip" aria-hidden="true">
        <svg viewBox="0 0 24 24" focusable="false">
          {vid === 'krutit' ? (
            <path d="M4 12a8 8 0 0 1 14-5.3M20 12a8 8 0 0 1-14 5.3M18 3v4h-4M6 21v-4h4" />
          ) : vid === 'tyanut' ? (
            <path d="M9 11V5.5a1.5 1.5 0 0 1 3 0V11m0-1.5a1.5 1.5 0 0 1 3 0V11m0-.5a1.5 1.5 0 0 1 3 0v4.5a6 6 0 0 1-6 6h-.5a6 6 0 0 1-4.6-2.2L4.6 15.6a1.5 1.5 0 0 1 2.3-1.9L9 16" />
          ) : (
            <path d="M12 4v3M5.6 6.6l2.1 2.1M4 13h3M18.4 6.6l-2.1 2.1M20 13h-3M9 14l3 7 1.4-3.6L17 16z" />
          )}
        </svg>
        {podskazka}
      </span>
    </div>
  );
}
