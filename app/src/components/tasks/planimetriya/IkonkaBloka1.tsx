import { clsx } from 'clsx';

/**
 * Значок блока задания №1 в кружке значка раздела №11 (z11-ikonka):
 * вместо пиктограммы — римский номер блока I–X, как на плашках
 * «О задании» и в «Опорных задачах».
 */
export function IkonkaBloka1({ blok, className }: { blok: string; className?: string }) {
  return (
    <span className={clsx('z11-ikonka z1-ikonka', className)} aria-hidden="true">
      {blok}
    </span>
  );
}
