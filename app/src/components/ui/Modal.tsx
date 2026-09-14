'use client';

import { clsx } from 'clsx';
import { useCallback, useEffect, useId, useRef, useState } from 'react';
import type { ReactNode } from 'react';

export interface ModalProps {
  open: boolean;
  onClose: () => void;
  title: ReactNode;
  description?: ReactNode;
  /** Кнопки в подвале: отмена слева, необратимое действие справа. */
  footer?: ReactNode;
  children?: ReactNode;
  /**
   * Точка, рядом с которой встаёт окно: координаты в системе окна
   * просмотра. Не задана — окно по центру экрана, как было. Учитывается
   * только от 1024px: на узком экране окно занимает почти весь экран,
   * и привязывать его не к чему.
   */
  anchor?: { top: number; left: number } | null;
  /**
   * Подпись кнопки закрытия. Задана — в углу появляется крестик;
   * не задана — окно закрывается только Escape, кликом вне и
   * кнопками подвала, как было.
   */
  closeLabel?: string;
  /**
   * Показать только панель, без затемнения и перехвата фокуса.
   * Нужно стайлгайду, чтобы окно было видно на странице целиком.
   */
  preview?: boolean;
  className?: string;
}

const FOCUSABLE =
  'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';

/** Модальное окно — только для необратимых действий. */
export function Modal({
  open,
  onClose,
  title,
  description,
  footer,
  children,
  anchor,
  closeLabel,
  preview = false,
  className,
}: ModalProps) {
  const panel = useRef<HTMLDivElement>(null);
  const restoreTo = useRef<HTMLElement | null>(null);
  /* Итоговое место окна: считается после отрисовки, когда известны
     его размеры. null — окно по центру. */
  const [placed, setPlaced] = useState<{ top: number; left: number } | null>(null);
  const titleId = useId();
  const descriptionId = useId();

  const trapFocus = useCallback(
    (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.preventDefault();
        onClose();
        return;
      }
      if (event.key !== 'Tab' || !panel.current) return;

      const nodes = Array.from(panel.current.querySelectorAll<HTMLElement>(FOCUSABLE));
      const first = nodes[0];
      const last = nodes[nodes.length - 1];
      if (!first || !last) return;

      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    },
    [onClose],
  );

  useEffect(() => {
    if (!open || preview) return undefined;

    restoreTo.current = document.activeElement as HTMLElement | null;
    const nodes = panel.current?.querySelectorAll<HTMLElement>(FOCUSABLE);
    (nodes?.[0] ?? panel.current)?.focus();

    document.addEventListener('keydown', trapFocus);
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    return () => {
      document.removeEventListener('keydown', trapFocus);
      document.body.style.overflow = previousOverflow;
      restoreTo.current?.focus();
    };
  }, [open, preview, trapFocus]);

  /* Привязка к элементу. Окно сначала рисуется, потом сдвигается: до
     отрисовки его высота неизвестна, а без неё не удержать его в
     пределах экрана. Отступ от краёв — одна величина на обе оси. */
  useEffect(() => {
    if (!open || preview || anchor === undefined || anchor === null) {
      setPlaced(null);
      return undefined;
    }

    const GAP = 24;
    const WIDE = window.matchMedia('(min-width: 1024px)');

    const place = () => {
      const node = panel.current;
      if (!node || !WIDE.matches) {
        setPlaced(null);
        return;
      }
      const box = node.getBoundingClientRect();
      const top = Math.min(
        Math.max(GAP, anchor.top - box.height / 2),
        Math.max(GAP, window.innerHeight - box.height - GAP),
      );
      const left = Math.min(
        Math.max(GAP, anchor.left),
        Math.max(GAP, window.innerWidth - box.width - GAP),
      );
      setPlaced({ top, left });
    };

    place();
    window.addEventListener('resize', place);
    return () => window.removeEventListener('resize', place);
  }, [open, preview, anchor]);

  if (!open) return null;

  const panelNode = (
    <div
      ref={panel}
      className={clsx('modal', className)}
      role="dialog"
      aria-modal={preview ? undefined : true}
      aria-labelledby={titleId}
      aria-describedby={description === undefined ? undefined : descriptionId}
      tabIndex={-1}
    >
      {closeLabel !== undefined ? (
        <button type="button" className="modal__x" onClick={onClose} aria-label={closeLabel}>
          <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
            <path d="m6 6 12 12M18 6 6 18" />
          </svg>
        </button>
      ) : null}
      <div className="modal__b">
        <h4 className="modal__t" id={titleId}>
          {title}
        </h4>
        {description !== undefined ? (
          <p className="modal__d" id={descriptionId}>
            {description}
          </p>
        ) : null}
        {children}
      </div>
      {footer !== undefined ? <div className="modal__f">{footer}</div> : null}
    </div>
  );

  if (preview) return panelNode;

  return (
    <div
      className={clsx('modal-backdrop', placed !== null && 'modal-backdrop--anchored')}
      onMouseDown={onClose}
      role="presentation"
    >
      <div
        className={clsx(placed !== null && 'modal-anchor')}
        style={placed === null ? undefined : { top: placed.top, left: placed.left }}
        onMouseDown={(event) => event.stopPropagation()}
        role="presentation"
      >
        {panelNode}
      </div>
    </div>
  );
}
