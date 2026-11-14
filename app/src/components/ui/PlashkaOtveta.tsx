import { clsx } from 'clsx';
import type { ReactNode } from 'react';

/**
 * Плашка «Ответ: 5» под разобранным примером.
 *
 * Подпись и значение — два отдельных элемента в строчном flex по
 * базовой линии (styles/base.css, .otvet-plashka). Так «Ответ:» и
 * число никогда не расходятся по строкам: в Safari плашка в сетке
 * сжималась до самого длинного слова, и число уезжало под подпись.
 * Длинный ответ (несколько чисел, серия корней) переносится только
 * внутри значения — подпись остаётся в начале первой строки.
 *
 * Внешний вид (фон, поля, скругление) — у класса раздела в className.
 */
export function PlashkaOtveta({
  podpis = 'Ответ',
  children,
  className,
  podpisClassName,
}: {
  /** Подпись без двоеточия. */
  podpis?: ReactNode;
  children: ReactNode;
  className?: string;
  podpisClassName?: string;
}) {
  return (
    <p className={clsx('otvet-plashka', className)}>
      <span className={clsx('otvet-plashka__podpis', podpisClassName)}>{podpis}:</span>
      <span className="otvet-plashka__znach">{children}</span>
    </p>
  );
}
