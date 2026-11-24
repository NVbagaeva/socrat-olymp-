'use client';

import { useEffect, useRef } from 'react';
import { HOWTO, SNIMOK_RAZMER } from '@/content/kakPolzovatsya';

/**
 * Окно на весь экран с крупным снимком страницы. Нативный <dialog>:
 * фокус внутри окна, Esc закрывает. Закрывают ещё крестик и нажатие
 * мимо снимка; фокус возвращается на кнопку, которая окно открыла.
 */
export default function SnimokOkno({
  src,
  alt,
  onClose,
  vozvrat,
}: {
  src: string;
  alt: string;
  onClose: () => void;
  /** Кнопка, на которую вернуть фокус. */
  vozvrat: HTMLElement | null;
}) {
  const ref = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const d = ref.current;
    if (d === null) return undefined;
    if (!d.open) d.showModal();
    return () => {
      if (d.open) d.close();
      vozvrat?.focus();
    };
  }, [vozvrat]);

  return (
    <dialog
      ref={ref}
      className="okno"
      aria-label={alt}
      onClose={onClose}
      onCancel={(e) => {
        e.preventDefault();
        onClose();
      }}
      onClick={(e) => {
        /* Нажатие мимо снимка: по самому окну или его полю. */
        if (e.target === e.currentTarget || (e.target as HTMLElement).classList.contains('okno__pole')) {
          onClose();
        }
      }}
    >
      <div className="okno__pole">
        <button type="button" className="okno__zakryt" onClick={onClose} aria-label={HOWTO.snimok.zakryt}>
          <svg viewBox="0 0 24 24" aria-hidden="true">
            <path d="M6 6l12 12M18 6 6 18" />
          </svg>
        </button>
        <img
          className="okno__img"
          src={src}
          alt={alt}
          width={SNIMOK_RAZMER.width}
          height={SNIMOK_RAZMER.height}
          decoding="async"
        />
      </div>
    </dialog>
  );
}
