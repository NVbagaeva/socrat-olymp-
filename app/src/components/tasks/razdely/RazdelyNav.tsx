'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useCallback, useEffect, useId, useRef, useState } from 'react';
import type { CSSProperties, MouseEvent as ReactMouseEvent } from 'react';
import { createPortal } from 'react-dom';
import { CheckIcon } from '@/components/ui';
import { MetkaTrenirovki, RazdelKartochka, StrelkaVpravo } from './RazdelKartochka';
import { RazdelIkonka } from './RazdelIkonka';
import { useNezavershennye } from './trenirovki';
import { RAZDELY_OPEN_EVENT, type RazdelKarta, type RazdelyData } from './types';
import { adresVkladki, zapomnitVkladku } from './vkladka';
import './razdely.css';

/** Пометка своей записи в истории: «Назад» закрывает меню, а не уводит. */
const STATE_KEY = 'razdelyMenu';
/** Насколько стянуть панель вниз, чтобы она закрылась. */
const SWIPE_CLOSE = 72;
/** Запас на случай, если конец анимации не придёт (вкладка в фоне). */
const CLOSE_FALLBACK_MS = 400;
const FOCUSABLE = 'a[href], button:not([disabled]), [tabindex]:not([tabindex="-1"])';

function menuVIstorii(): boolean {
  const state: unknown = window.history.state;
  return (
    typeof state === 'object' &&
    state !== null &&
    (state as Record<string, unknown>)[STATE_KEY] === true
  );
}

function bezAnimatsii(): boolean {
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

/** Обычный щелчок: без клавиш и не средней кнопкой — его ведём сами. */
function prostoyShchelchok(event: ReactMouseEvent): boolean {
  return (
    !event.defaultPrevented &&
    event.button === 0 &&
    !event.metaKey &&
    !event.ctrlKey &&
    !event.shiftKey &&
    !event.altKey
  );
}

export interface RazdelyNavProps extends RazdelyData {
  /** Вкладка, открытая сейчас: в другом разделе откроется она же. */
  vkladka: string;
}

type Faza = 'closed' | 'open' | 'closing';

/**
 * Плашка «текущий раздел ▾» над вкладками и выезжающее по ней меню
 * со всеми разделами задания.
 *
 * Плашка стоит в одной строке-обёртке с лентой вкладок и прилипает
 * вместе с ней. Меню — панель снизу с затемнением (на широком экране —
 * окно по центру). Закрывается крестиком, свайпом вниз, тапом по
 * затемнению, Escape и кнопкой «Назад»: открытие кладёт в историю
 * свою запись, и «Назад» снимает её, а не уводит со страницы.
 *
 * Переход в другой раздел — обычная навигация Next.js на ту же
 * вкладку. Запись меню при этом заменяется страницей раздела, поэтому
 * «Назад» из нового раздела ведёт прямо в прежний, на ту вкладку,
 * с которой ушли.
 */
export function RazdelyNav({ no, razdely, current, vkladka }: RazdelyNavProps) {
  const router = useRouter();
  const [faza, setFaza] = useState<Faza>('closed');
  /* Панель потянули вниз: на сколько пикселей. */
  const [drag, setDrag] = useState(0);
  const plashka = useRef<HTMLButtonElement>(null);
  const panel = useRef<HTMLDivElement>(null);
  const list = useRef<HTMLUListElement>(null);
  /* Кто открыл меню: плашка или кнопка «Все разделы» в шапке. */
  const opener = useRef<HTMLElement | null>(null);
  const titleId = useId();
  const nezavershena = useNezavershennye();
  const tekushchiy = razdely.find((razdel) => razdel.id === current);

  /* Убрать с экрана: с анимацией ухода или сразу. */
  const hide = useCallback(() => {
    setFaza((now) => (now !== 'open' ? now : bezAnimatsii() ? 'closed' : 'closing'));
  }, []);

  /* Закрыть по действию ученика. Своя запись в истории — снимаем её
     «Назадом», меню закроет обработчик popstate. */
  const close = useCallback(() => {
    if (menuVIstorii()) {
      window.history.back();
    } else {
      hide();
    }
  }, [hide]);

  const open = useCallback(
    (from: HTMLElement | null) => {
      if (faza !== 'closed') {
        return;
      }
      opener.current = from;
      /* Вкладка запоминается в адресе текущей записи до того, как
         поверх неё ляжет запись меню. */
      zapomnitVkladku(vkladka);
      /* Служебные поля Next.js обёртка над history перенесёт сама
         (см. vkladka.ts) — передаём только свою пометку. */
      window.history.pushState({ [STATE_KEY]: true }, '', window.location.href);
      setDrag(0);
      setFaza('open');
    },
    [faza, vkladka],
  );

  /* Кнопка «‹ Все разделы» в шапке открывает это же меню. */
  useEffect(() => {
    const onOpen = (event: Event) => {
      const from = (event as CustomEvent<HTMLElement | null>).detail;
      open(from instanceof HTMLElement ? from : null);
    };
    window.addEventListener(RAZDELY_OPEN_EVENT, onOpen);
    return () => window.removeEventListener(RAZDELY_OPEN_EVENT, onOpen);
  }, [open]);

  /* «Назад» браузера: запись меню снята — меню закрывается. */
  useEffect(() => {
    if (faza !== 'open') {
      return undefined;
    }
    const onPop = () => {
      if (!menuVIstorii()) {
        hide();
      }
    };
    window.addEventListener('popstate', onPop);
    return () => window.removeEventListener('popstate', onPop);
  }, [faza, hide]);

  /* Пока меню на экране: страница под ним не прокручивается, фокус
     внутри, Escape закрывает. */
  useEffect(() => {
    if (faza === 'closed') {
      return undefined;
    }
    const before = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = before;
    };
  }, [faza]);

  useEffect(() => {
    if (faza !== 'open') {
      return undefined;
    }
    const node = panel.current;
    node?.querySelector<HTMLElement>('.razdely-menu__x')?.focus({ preventScroll: true });

    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.preventDefault();
        close();
        return;
      }
      if (event.key !== 'Tab' || node === null) {
        return;
      }
      const nodes = Array.from(node.querySelectorAll<HTMLElement>(FOCUSABLE));
      const first = nodes[0];
      const last = nodes[nodes.length - 1];
      if (first === undefined || last === undefined) {
        return;
      }
      if (event.shiftKey && (document.activeElement === first || document.activeElement === node)) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [faza, close]);

  /* Меню закрылось — фокус возвращается туда, откуда его открыли. */
  const was = useRef<Faza>('closed');
  useEffect(() => {
    if (faza === 'closed' && was.current !== 'closed') {
      const back = opener.current?.isConnected === true ? opener.current : plashka.current;
      opener.current = null;
      back?.focus({ preventScroll: true });
    }
    was.current = faza;
  }, [faza]);

  /* Анимация ухода кончилась — снимаем меню. Запас по таймеру: в
     фоновой вкладке конец анимации может и не прийти. */
  useEffect(() => {
    if (faza !== 'closing') {
      return undefined;
    }
    const timer = window.setTimeout(() => setFaza('closed'), CLOSE_FALLBACK_MS);
    return () => window.clearTimeout(timer);
  }, [faza]);

  /* Свайп вниз. Тянуть можно за любое место панели, но список —
     только когда он прокручен к началу: иначе жест прокручивает его. */
  useEffect(() => {
    const node = panel.current;
    if (faza !== 'open' || node === null) {
      return undefined;
    }
    let startY = 0;
    let active = false;
    let dy = 0;
    const onStart = (event: TouchEvent) => {
      const touch = event.touches[0];
      if (touch === undefined || event.touches.length > 1) {
        active = false;
        return;
      }
      startY = touch.clientY;
      dy = 0;
      const inList = list.current?.contains(event.target as Node) ?? false;
      active = !inList || (list.current?.scrollTop ?? 0) <= 0;
    };
    const onMove = (event: TouchEvent) => {
      const touch = event.touches[0];
      if (!active || touch === undefined) {
        return;
      }
      dy = touch.clientY - startY;
      if (dy > 0) {
        event.preventDefault();
        setDrag(dy);
      } else {
        /* Жест вверх — это прокрутка списка, а не закрытие. */
        active = false;
        setDrag(0);
      }
    };
    const onEnd = () => {
      if (!active) {
        return;
      }
      active = false;
      if (dy > SWIPE_CLOSE) {
        close();
      } else {
        setDrag(0);
      }
    };
    node.addEventListener('touchstart', onStart, { passive: true });
    node.addEventListener('touchmove', onMove, { passive: false });
    node.addEventListener('touchend', onEnd);
    node.addEventListener('touchcancel', onEnd);
    return () => {
      node.removeEventListener('touchstart', onStart);
      node.removeEventListener('touchmove', onMove);
      node.removeEventListener('touchend', onEnd);
      node.removeEventListener('touchcancel', onEnd);
    };
  }, [faza, close]);

  /* Переход в раздел. Запись меню заменяется страницей раздела:
     «Назад» оттуда ведёт в прежний раздел, а не в открытое меню. */
  function go(event: ReactMouseEvent<HTMLAnchorElement>, href: string) {
    if (!prostoyShchelchok(event)) {
      return;
    }
    event.preventDefault();
    if (menuVIstorii()) {
      router.replace(href);
    } else {
      zapomnitVkladku(vkladka);
      router.push(href);
    }
  }

  function karta(razdel: RazdelKarta) {
    const trenirovka = nezavershena(razdel.scope) ? <MetkaTrenirovki /> : null;

    if (razdel.id === current) {
      return (
        <button
          type="button"
          className="razdel-karta is-current"
          aria-current="page"
          onClick={close}
        >
          <RazdelKartochka
            razdel={razdel}
            sizes="88px"
            metki={
              <>
                <span className="razdel-metka razdel-metka--zdes">
                  <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
                    <path d="m5 12 5 5L20 7" />
                  </svg>
                  Сейчас здесь
                </span>
                {trenirovka}
              </>
            }
            end={
              <span className="razdel-karta__check" aria-hidden="true">
                <CheckIcon />
              </span>
            }
          />
        </button>
      );
    }

    if (razdel.soon) {
      return (
        <div className="razdel-karta is-soon" aria-disabled="true">
          <RazdelKartochka
            razdel={razdel}
            sizes="88px"
            end={<span className="razdel-metka razdel-metka--skoro">Скоро</span>}
          />
        </div>
      );
    }

    const href = adresVkladki(razdel, vkladka);
    return (
      <Link className="razdel-karta" href={href} onClick={(event) => go(event, href)}>
        <RazdelKartochka
          razdel={razdel}
          sizes="88px"
          {...(trenirovka === null ? {} : { metki: trenirovka })}
          end={<StrelkaVpravo />}
        />
      </Link>
    );
  }

  const shown = faza !== 'closed';
  const style = drag > 0 ? ({ '--razdely-drag': `${drag}px` } as CSSProperties) : undefined;

  return (
    <>
      <button
        ref={plashka}
        type="button"
        className="razdely-plashka"
        aria-haspopup="dialog"
        aria-expanded={faza === 'open'}
        onClick={() => open(plashka.current)}
      >
        {tekushchiy === undefined ? null : (
          <RazdelIkonka
            icon={tekushchiy.icon}
            sizes="48px"
            eager
            className="razdely-plashka__ico"
          />
        )}
        <span className="razdely-plashka__text">
          <span className="sr-only">Раздел задания №{no}: </span>
          {tekushchiy?.title}
        </span>
        <svg
          className="razdely-plashka__arrow"
          viewBox="0 0 24 24"
          aria-hidden="true"
          focusable="false"
        >
          <path d="M6 9l6 6 6-6" />
        </svg>
      </button>

      {shown
        ? createPortal(
            <div className={`razdely-layer is-${faza}`}>
              <div className="razdely-fon" onClick={close} aria-hidden="true" />
              <div
                ref={panel}
                className={drag > 0 ? 'razdely-menu is-dragging' : 'razdely-menu'}
                style={style}
                role="dialog"
                aria-modal="true"
                aria-labelledby={titleId}
                tabIndex={-1}
                onAnimationEnd={(event) => {
                  if (event.target === event.currentTarget && faza === 'closing') {
                    setFaza('closed');
                  }
                }}
              >
                <div className="razdely-menu__head">
                  <span className="razdely-menu__grip" aria-hidden="true" />
                  <h2 className="razdely-menu__title" id={titleId}>
                    Все разделы задания №{no}
                  </h2>
                  <button
                    type="button"
                    className="razdely-menu__x"
                    onClick={close}
                    aria-label="Закрыть меню разделов"
                  >
                    <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
                      <path d="m6 6 12 12M18 6 6 18" />
                    </svg>
                  </button>
                </div>
                <ul className="razdely-menu__list" ref={list}>
                  {razdely.map((razdel) => (
                    <li key={razdel.id}>{karta(razdel)}</li>
                  ))}
                </ul>
              </div>
            </div>,
            document.body,
          )
        : null}
    </>
  );
}
