'use client';

import { clsx } from 'clsx';
import { useRef, type KeyboardEvent, type ReactNode } from 'react';
import './proverka.css';

/**
 * Состояние варианта после проверки:
 * correct — выбран и верен; incorrect — выбран и неверен; answer —
 * верный, которого ученик не выбрал; priglushen — неверный, уже
 * испробованный или погашенный после верного ответа.
 */
export type VariantSostoyanie = 'correct' | 'incorrect' | 'answer' | 'priglushen' | null;

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
  /**
   * Чем нарисовать вариант, если подпись — не просто строка. Пусто —
   * на кнопке стоит само значение. Так блок с дробями отдаёт готовую
   * вёрстку формулы, а блок с одним словом ничего не передаёт.
   */
  vid?: (variant: string) => ReactNode;
  /** После проверки кнопки замирают. */
  disabled?: boolean;
  /** Отдельные варианты, которые больше не выбираются (испробованная ошибка). */
  zakryt?: (variant: string) => boolean;
  label: string;
  className?: string;
  /**
   * Выбор одного ответа как группа radio: стрелки переводят выбор,
   * Enter — onEnter (обычно «Проверить»). Без флага — ряд кнопок
   * с aria-pressed, как в теории вероятности.
   */
  radio?: boolean;
  onEnter?: () => void;
}

/**
 * Ряд кнопок-вариантов с состояниями ответа — общий для теории сайта:
 * «Проверь себя» и «Проверь понимание» в №4/№5, «Проверь себя» в
 * теории единиц №10/№11.
 *
 * Поведение то же, что у выбора метода в тренажёре: до проверки
 * кнопки живые и запоминают выбор, после — замирают, выбранный
 * верный зелёный, выбранный неверный красный (в теории единиц —
 * терракотовый), а верный рядом подсвечивается отдельно.
 *
 * Компонент ничего не знает ни про задачи, ни про ответы: варианты
 * приходят строками, вердикт — функцией. Стили — proverka.css.
 */
export function VariantyOtveta({
  otvety,
  vybor,
  onPick,
  itog,
  vid,
  disabled = false,
  zakryt,
  label,
  className,
  radio = false,
  onEnter,
}: VariantyOtvetaProps) {
  const knopki = useRef<(HTMLButtonElement | null)[]>([]);
  const dostupny = (variant: string): boolean => !disabled && !(zakryt?.(variant) ?? false);

  /* Фокус в группе radio — один: на выбранном или на первом живом. */
  const sFokusom = vybor !== null && dostupny(vybor) ? vybor : (otvety.find(dostupny) ?? null);

  function klavisha(e: KeyboardEvent<HTMLButtonElement>, i: number): void {
    if (e.key === 'Enter' && onEnter !== undefined) {
      e.preventDefault();
      onEnter();
      return;
    }
    const shag =
      e.key === 'ArrowDown' || e.key === 'ArrowRight'
        ? 1
        : e.key === 'ArrowUp' || e.key === 'ArrowLeft'
          ? -1
          : 0;
    if (shag === 0) {
      return;
    }
    e.preventDefault();
    for (let k = 1; k <= otvety.length; k += 1) {
      const j = (i + shag * k + otvety.length * k) % otvety.length;
      const variant = otvety[j];
      if (variant !== undefined && dostupny(variant)) {
        onPick(variant);
        knopki.current[j]?.focus();
        return;
      }
    }
  }

  return (
    <div
      className={clsx('vvar', className)}
      role={radio ? 'radiogroup' : 'group'}
      aria-label={label}
    >
      {otvety.map((variant, i) => {
        const sostoyanie = itog?.(variant) ?? null;
        const vybran = variant === vybor;
        return (
          <button
            key={variant}
            ref={(el) => {
              knopki.current[i] = el;
            }}
            type="button"
            className={clsx(
              'vvar__btn',
              vybran && 'is-picked',
              sostoyanie !== null && `vvar__btn--${sostoyanie}`,
            )}
            {...(radio
              ? {
                  role: 'radio',
                  'aria-checked': vybran,
                  tabIndex: variant === sFokusom ? 0 : -1,
                  onKeyDown: (e: KeyboardEvent<HTMLButtonElement>) => klavisha(e, i),
                }
              : { 'aria-pressed': vybran })}
            disabled={!dostupny(variant)}
            onClick={() => onPick(variant)}
          >
            {vid === undefined ? variant : vid(variant)}
          </button>
        );
      })}
    </div>
  );
}
