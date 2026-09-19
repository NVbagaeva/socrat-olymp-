'use client';

import { clsx } from 'clsx';

export type VariantSostoyanie = 'correct' | 'incorrect' | 'answer' | null;

export interface VariantyOtvetaProps {
  /** Подписи вариантов: они же значения. */
  otvety: readonly string[];
  /** Что выбрал ученик. null — ещё не выбирал. */
  vybor: string | null;
  onPick: (variant: string) => void;
  /**
   * Что показать про каждый вариант после проверки. Пусто — проверки
   * ещё не было, кнопки живые и ничего не подсвечивают.
   */
  itog?: (variant: string) => VariantSostoyanie;
  /** После проверки кнопки замирают. */
  disabled?: boolean;
  label: string;
  className?: string;
}

/**
 * Ряд кнопок-вариантов с состояниями ответа.
 *
 * Поведение то же, что у выбора метода в тренажёре: до проверки
 * кнопки живые и запоминают выбор, после — замирают, выбранный
 * верный зелёный, выбранный неверный красный, а верный рядом
 * подсвечивается отдельно.
 *
 * Компонент ничего не знает ни про типы событий, ни про методы:
 * варианты приходят строками, вердикт — функцией. Поэтому его берут
 * и другие разделы теории, а не только «Виды событий».
 */
export function VariantyOtveta({
  otvety,
  vybor,
  onPick,
  itog,
  disabled = false,
  label,
  className,
}: VariantyOtvetaProps) {
  return (
    <div className={clsx('vvar', className)} role="group" aria-label={label}>
      {otvety.map((variant) => {
        const sostoyanie = itog?.(variant) ?? null;
        return (
          <button
            key={variant}
            type="button"
            className={clsx(
              'vvar__btn',
              variant === vybor && 'is-picked',
              sostoyanie !== null && `vvar__btn--${sostoyanie}`,
            )}
            aria-pressed={variant === vybor}
            disabled={disabled}
            onClick={() => onPick(variant)}
          >
            {variant}
          </button>
        );
      })}
    </div>
  );
}
