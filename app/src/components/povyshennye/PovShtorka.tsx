'use client';

import { clsx } from 'clsx';
import { useCallback, useEffect, useId, useRef, useState } from 'react';
import type { ReactNode } from 'react';
import { createPortal } from 'react-dom';

const FOCUSABLE =
  'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])';

/** Насколько стянуть шторку вниз, чтобы она закрылась, px. */
const PROG_ZAKRYTIYA = 90;

export interface PovShtorkaProps {
  open: boolean;
  onClose: () => void;
  /** Заголовок шторки и всё, что стоит рядом с ним (бейдж). */
  title: ReactNode;
  closeLabel: string;
  children: ReactNode;
  /** Низ шторки, не прокручивается: кнопка «Печать». */
  footer?: ReactNode;
  testId?: string;
}

/**
 * Нижняя шторка экрана раздела: затемнение, ручка, заголовок с
 * крестиком, прокручиваемое тело. Закрывается крестиком, тапом по
 * затемнению, Escape и свайпом вниз — за ручку, заголовок или тело,
 * когда оно прокручено к началу. Фокус остаётся внутри, пока шторка
 * открыта, и возвращается туда, откуда её открыли.
 */
export function PovShtorka({
  open,
  onClose,
  title,
  closeLabel,
  children,
  footer,
  testId,
}: PovShtorkaProps) {
  const panel = useRef<HTMLDivElement>(null);
  const telo = useRef<HTMLDivElement>(null);
  const restoreTo = useRef<HTMLElement | null>(null);
  const titleId = useId();
  const [sdvig, setSdvig] = useState(0);
  const drag = useRef<{ y: number; id: number } | null>(null);

  const onKey = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        onClose();
        return;
      }
      if (e.key !== 'Tab' || panel.current === null) return;
      const nodes = Array.from(panel.current.querySelectorAll<HTMLElement>(FOCUSABLE));
      const first = nodes[0];
      const last = nodes[nodes.length - 1];
      if (first === undefined || last === undefined) return;
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    },
    [onClose],
  );

  useEffect(() => {
    if (!open) return undefined;
    restoreTo.current = document.activeElement as HTMLElement | null;
    panel.current?.focus();
    document.addEventListener('keydown', onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = prev;
      setSdvig(0);
      restoreTo.current?.focus();
    };
  }, [open, onKey]);

  if (!open || typeof document === 'undefined') return null;

  /* Свайп: тянем только вниз; тело шторки уступает жест, лишь когда
     прокручено к самому началу. */
  const start = (e: React.PointerEvent, izTela: boolean) => {
    if (e.pointerType === 'mouse' && e.button !== 0) return;
    if (izTela && (telo.current?.scrollTop ?? 0) > 0) return;
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
    <div className="pov-shtorka" data-testid={testId}>
      <div
        className="pov-shtorka__fon"
        aria-hidden="true"
        data-testid={testId === undefined ? undefined : `${testId}-fon`}
        onClick={onClose}
      />
      <div
        ref={panel}
        className={clsx('pov-shtorka__panel', sdvig > 0 && 'is-drag')}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        tabIndex={-1}
        style={sdvig > 0 ? { transform: `translateY(${sdvig}px)` } : undefined}
        onPointerMove={move}
        onPointerUp={end}
        onPointerCancel={end}
      >
        <div
          className="pov-shtorka__ruchka"
          onPointerDown={(e) => start(e, false)}
          aria-hidden="true"
        >
          <span />
        </div>
        <header className="pov-shtorka__head" onPointerDown={(e) => start(e, false)}>
          <h2 id={titleId} className="pov-shtorka__title">
            {title}
          </h2>
          <button
            type="button"
            className="pov-shtorka__close"
            aria-label={closeLabel}
            data-testid={testId === undefined ? undefined : `${testId}-close`}
            onClick={onClose}
          >
            <svg viewBox="0 0 24 24" aria-hidden="true">
              <path d="M6 6l12 12M18 6L6 18" />
            </svg>
          </button>
        </header>
        <div ref={telo} className="pov-shtorka__telo" onPointerDown={(e) => start(e, true)}>
          {children}
        </div>
        {footer === undefined ? null : <div className="pov-shtorka__niz">{footer}</div>}
      </div>
    </div>,
    document.body,
  );
}
