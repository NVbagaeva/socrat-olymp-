'use client';

import { clsx } from 'clsx';
import { useCallback, useEffect, useId, useLayoutEffect, useRef, useState } from 'react';
import type { ReactNode } from 'react';
import { createPortal } from 'react-dom';
import './okno.css';

const FOCUSABLE =
  'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';

/** Насколько стянуть шторку вниз, чтобы она закрылась, px. */
const PROG_ZAKRYTIYA = 90;
/** Длительность ухода — та же, что у анимации в okno.css. */
const UKHOD_MS = 220;

export interface OknoProps {
  open: boolean;
  onClose: () => void;
  title: ReactNode;
  /** Строка под заголовком: «Выбрано 3 из 4». */
  subtitle?: ReactNode;
  closeLabel?: string;
  children: ReactNode;
  /** Низ окна, не прокручивается: «Готово», «Применить». */
  footer?: ReactNode;
  /** id элемента внутри окна: к нему окно прокручивается при открытии. */
  scrollTo?: string;
  /** Узкое окно: «Открыть по коду». */
  small?: boolean;
  testId?: string;
}

function reducedMotion(): boolean {
  return (
    typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches
  );
}

/**
 * Окно страницы «Собрать вариант» (по образцу PovShtorka): на телефоне —
 * нижняя шторка с ручкой, на планшете и компьютере (от 768px) — диалог по
 * центру шириной до 560px. Фон затемнён и размыт, страница под окном не
 * прокручивается. Закрывается крестиком, тапом по фону, Esc и свайпом
 * вниз — за ручку, заголовок или тело, когда оно прокручено к началу.
 * Фокус переходит в окно, не выходит из него и возвращается туда,
 * откуда окно открыли. Появление и уход — 220 мс, при reduced-motion —
 * без анимации. Экранная клавиатура поднимает шторку (visualViewport).
 */
export function Okno({
  open,
  onClose,
  title,
  subtitle,
  closeLabel = 'Закрыть',
  children,
  footer,
  scrollTo,
  small = false,
  testId,
}: OknoProps) {
  const panel = useRef<HTMLDivElement>(null);
  const telo = useRef<HTMLDivElement>(null);
  const restoreTo = useRef<HTMLElement | null>(null);
  const titleId = useId();
  const [shown, setShown] = useState(open);
  const [ukhod, setUkhod] = useState(false);
  const [sdvig, setSdvig] = useState(0);
  const [klava, setKlava] = useState(0);
  const drag = useRef<{ y: number; id: number } | null>(null);
  /* onClose приходит новой функцией на каждом рендере страницы: держим
     последнюю в ref, иначе эффект окна перезапускался бы на каждое
     нажатие клавиши и возвращал фокус на кнопку, открывшую окно. */
  const zakryt = useRef(onClose);
  useLayoutEffect(() => {
    zakryt.current = onClose;
  });

  /* Открыли — показать сразу; закрыли — доиграть уход и убрать. Смена
     open разбирается при рендере (без setState в эффекте), таймер ухода —
     в эффекте. */
  const [prevOpen, setPrevOpen] = useState(open);
  if (open !== prevOpen) {
    setPrevOpen(open);
    if (open) {
      setShown(true);
      setUkhod(false);
    } else if (shown) {
      if (reducedMotion()) setShown(false);
      else setUkhod(true);
    }
  }
  useEffect(() => {
    if (!ukhod) return undefined;
    const t = window.setTimeout(() => {
      setShown(false);
      setUkhod(false);
    }, UKHOD_MS);
    return () => window.clearTimeout(t);
  }, [ukhod]);

  const onKey = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        zakryt.current();
        return;
      }
      if (e.key !== 'Tab' || panel.current === null) return;
      const nodes = Array.from(panel.current.querySelectorAll<HTMLElement>(FOCUSABLE)).filter(
        (n) => n.offsetParent !== null,
      );
      const first = nodes[0];
      const last = nodes[nodes.length - 1];
      if (first === undefined || last === undefined) return;
      if (
        e.shiftKey &&
        (document.activeElement === first || document.activeElement === panel.current)
      ) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    },
    [],
  );

  /* Пока окно открыто: фокус внутри, клавиши, страница не прокручивается. */
  useEffect(() => {
    if (!open) return undefined;
    document.addEventListener('keydown', onKey);
    const html = document.documentElement;
    const prevHtml = html.style.overflow;
    const prevBody = document.body.style.overflow;
    html.style.overflow = 'hidden';
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKey);
      html.style.overflow = prevHtml;
      document.body.style.overflow = prevBody;
      setSdvig(0);
      restoreTo.current?.focus({ preventScroll: true });
      restoreTo.current = null;
    };
  }, [open, onKey]);

  /* Фокус и прокрутка к группе — когда панель уже в разметке. */
  useLayoutEffect(() => {
    if (!open || !shown) return;
    /* Откуда открыли — запомнить до того, как фокус уйдёт в окно. */
    if (restoreTo.current === null && !panel.current?.contains(document.activeElement)) {
      restoreTo.current = document.activeElement as HTMLElement | null;
    }
    panel.current?.focus({ preventScroll: true });
    if (scrollTo !== undefined) {
      const el = telo.current?.querySelector<HTMLElement>(`#${CSS.escape(scrollTo)}`);
      const box = telo.current;
      if (el && box) {
        box.scrollTop += el.getBoundingClientRect().top - box.getBoundingClientRect().top - 4;
      }
    }
  }, [open, shown, scrollTo]);

  /* Экранная клавиатура: шторка поднимается над ней. */
  useEffect(() => {
    if (!open) return undefined;
    const vv = window.visualViewport;
    if (!vv) return undefined;
    const upd = () => setKlava(Math.max(0, window.innerHeight - vv.height - vv.offsetTop));
    upd();
    vv.addEventListener('resize', upd);
    vv.addEventListener('scroll', upd);
    return () => {
      vv.removeEventListener('resize', upd);
      vv.removeEventListener('scroll', upd);
      setKlava(0);
    };
  }, [open]);

  if (!shown || typeof document === 'undefined') return null;

  const start = (e: React.PointerEvent, izTela: boolean) => {
    if (e.pointerType === 'mouse' && e.button !== 0) return;
    if (izTela && (telo.current?.scrollTop ?? 0) > 0) return;
    const t = e.target as HTMLElement;
    if (izTela && t.closest('input, textarea, select, button, a, label') !== null) return;
    drag.current = { y: e.clientY, id: e.pointerId };
  };
  const move = (e: React.PointerEvent) => {
    const d = drag.current;
    if (d === null || d.id !== e.pointerId) return;
    const dy = e.clientY - d.y;
    if (dy > 4 && !panel.current?.hasPointerCapture(e.pointerId))
      panel.current?.setPointerCapture(e.pointerId);
    setSdvig(Math.max(0, dy));
  };
  const end = (e: React.PointerEvent) => {
    const d = drag.current;
    if (d === null || d.id !== e.pointerId) return;
    drag.current = null;
    if (sdvig > PROG_ZAKRYTIYA) onClose();
    else setSdvig(0);
  };

  return createPortal(
    <div
      className={clsx('okno', small && 'okno--small')}
      data-state={ukhod ? 'closing' : 'open'}
      data-testid={testId}
      style={klava > 0 ? ({ '--okno-klava': `${klava}px` } as React.CSSProperties) : undefined}
    >
      <div className="okno__fon" aria-hidden="true" onClick={onClose} />
      <div
        ref={panel}
        className={clsx('okno__panel', sdvig > 0 && 'is-drag')}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        tabIndex={-1}
        style={sdvig > 0 ? { transform: `translateY(${sdvig}px)` } : undefined}
        onPointerMove={move}
        onPointerUp={end}
        onPointerCancel={end}
      >
        <div className="okno__ruchka" onPointerDown={(e) => start(e, false)} aria-hidden="true">
          <span />
        </div>
        <header className="okno__head" onPointerDown={(e) => start(e, false)}>
          <div>
            <h2 id={titleId} className="okno__title">
              {title}
            </h2>
            {subtitle === undefined ? null : <p className="okno__sub">{subtitle}</p>}
          </div>
          <button
            type="button"
            className="okno__close"
            aria-label={closeLabel}
            data-testid={testId === undefined ? undefined : `${testId}-close`}
            onClick={onClose}
          >
            <svg viewBox="0 0 24 24" aria-hidden="true">
              <path d="M6 6l12 12M18 6L6 18" />
            </svg>
          </button>
        </header>
        <div ref={telo} className="okno__telo" onPointerDown={(e) => start(e, true)}>
          {children}
        </div>
        {footer === undefined ? null : <div className="okno__niz">{footer}</div>}
      </div>
    </div>,
    document.body,
  );
}
