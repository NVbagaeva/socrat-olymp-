'use client';

import { useEffect, useRef, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { GEN_UI } from '@/content/generatorUi';
import { GenIcon } from './GenIcons';
import './okno.css';

/**
 * Окно генератора: на телефоне — нижний лист во всю ширину, на
 * планшете и компьютере — диалог по центру. Esc и клик по фону
 * закрывают, фокус уходит внутрь и возвращается на кнопку.
 */
export function GenSheet({
  title,
  onClose,
  children,
  foot,
}: {
  title: string;
  onClose: () => void;
  children: ReactNode;
  foot?: ReactNode;
}) {
  const box = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const back = document.activeElement as HTMLElement | null;
    /* Фокус — на само окно: клавиатура дальше идёт по его кнопкам,
       а на экране нет рамки фокуса у крестика. */
    box.current?.focus();
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', onKey);
    const html = document.documentElement;
    const was = html.style.overflow;
    html.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKey);
      html.style.overflow = was;
      back?.focus?.();
    };
  }, [onClose]);
  /* В body, а не внутри страницы: у обёртки вкладки бывает transform,
     и тогда fixed отсчитывался бы от неё, а не от экрана. */
  return createPortal(
    <div className="gen-overlay">
      <div className="gen-overlay__scrim" onClick={onClose} aria-hidden="true" />
      <div
        className="gen-sheet"
        role="dialog"
        aria-modal="true"
        aria-label={title}
        ref={box}
        tabIndex={-1}
      >
        <div className="gen-sheet__grip" aria-hidden="true" />
        <div className="gen-sheet__head">
          <h2 className="gen-sheet__title">{title}</h2>
          <button
            type="button"
            className="gen-iconbtn"
            aria-label={GEN_UI.zakryt}
            onClick={onClose}
          >
            <GenIcon name="x" />
          </button>
        </div>
        <div className="gen-sheet__body">{children}</div>
        {foot === undefined ? null : <div className="gen-sheet__foot">{foot}</div>}
      </div>
    </div>,
    document.body,
  );
}

/** Короткое сообщение внизу экрана — тоже в body. */
export function GenToast({ text }: { text: string }) {
  return createPortal(
    <div className="gen-toast" role="status">
      {text}
    </div>,
    document.body,
  );
}
