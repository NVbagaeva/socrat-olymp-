'use client';

import { useEffect } from 'react';
import type { RefObject } from 'react';

export interface DismissOptions {
  /** Раскрыто ли меню: пока закрыто, обработчиков нет. */
  open: boolean;
  /** Закрыть. Вызывается по Escape и по щелчку мимо. */
  onClose: () => void;
  /** Само меню: щелчок внутри него закрытием не считается. */
  menu: RefObject<HTMLElement | null>;
  /** Кнопка, которая меню открывает: она же забирает фокус по Escape. */
  trigger: RefObject<HTMLElement | null>;
}

/**
 * Закрытие раскрытого меню: Escape и щелчок мимо.
 *
 * Одна и та же пара правил нужна и меню «Для репетиторов», и выбору
 * типа заданий в тренажёре, поэтому живёт отдельно. Всё остальное —
 * где меню стоит и как считает своё место — у каждого своё.
 */
export function useDismiss({ open, onClose, menu, trigger }: DismissOptions): void {
  useEffect(() => {
    if (!open) {
      return undefined;
    }

    const byKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose();
        trigger.current?.focus();
      }
    };
    const byClick = (event: PointerEvent) => {
      const target = event.target;
      if (!(target instanceof Node)) {
        return;
      }
      if (menu.current?.contains(target) === true || trigger.current?.contains(target) === true) {
        return;
      }
      onClose();
    };

    document.addEventListener('keydown', byKey);
    document.addEventListener('pointerdown', byClick);
    return () => {
      document.removeEventListener('keydown', byKey);
      document.removeEventListener('pointerdown', byClick);
    };
  }, [open, onClose, menu, trigger]);
}
