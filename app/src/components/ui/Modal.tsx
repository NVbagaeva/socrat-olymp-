'use client';

import { clsx } from 'clsx';
import { useCallback, useEffect, useId, useRef } from 'react';
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
  preview = false,
  className,
}: ModalProps) {
  const panel = useRef<HTMLDivElement>(null);
  const restoreTo = useRef<HTMLElement | null>(null);
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
    <div className="modal-backdrop" onMouseDown={onClose} role="presentation">
      <div onMouseDown={(event) => event.stopPropagation()} role="presentation">
        {panelNode}
      </div>
    </div>
  );
}
