'use client';

import { clsx } from 'clsx';
import type { ComponentPropsWithoutRef } from 'react';
import { Input, type FieldState } from '@/components/ui';
import { useCoarsePointer } from '@/components/ui';
import './otvet.css';

export interface AnswerInputProps extends Omit<
  ComponentPropsWithoutRef<'input'>,
  'value' | 'onChange' | 'type'
> {
  value: string;
  onChange: (value: string) => void;
  state?: FieldState;
  /** Подпись кнопки смены знака для скринридера. */
  minusLabel?: string;
}

/**
 * Поле числового ответа ЕГЭ — общее для тренажёров.
 *
 * inputmode="decimal": на телефоне открывается цифровая клавиатура с
 * запятой. Минуса на ней у iPhone нет, а ответы бывают отрицательными,
 * поэтому рядом с полем на сенсорном экране — кнопка «−»: она ставит
 * или убирает минус перед числом. На компьютере кнопки нет: минус есть
 * на клавиатуре.
 */
export function AnswerInput({
  value,
  onChange,
  state = 'default',
  minusLabel = 'Поставить или убрать минус',
  className,
  readOnly,
  disabled,
  ...rest
}: AnswerInputProps) {
  const coarse = useCoarsePointer();
  const toggleMinus = () => {
    const trimmed = value.replace(/^\s+/, '');
    const minus = /^[-−‐‑‒–—]/.test(trimmed);
    onChange(minus ? trimmed.slice(1) : `−${trimmed}`);
  };
  return (
    <span className={clsx('otvet-input', coarse && 'otvet-input--touch', className)}>
      {coarse ? (
        <button
          type="button"
          className="otvet-input__minus"
          aria-label={minusLabel}
          onClick={toggleMinus}
          disabled={readOnly === true || disabled === true}
        >
          −
        </button>
      ) : null}
      <Input
        {...rest}
        className="otvet-input__field"
        value={value}
        state={state}
        type="text"
        inputMode="decimal"
        autoComplete="off"
        autoCorrect="off"
        autoCapitalize="off"
        spellCheck={false}
        enterKeyHint="done"
        readOnly={readOnly}
        disabled={disabled}
        onChange={(event) => onChange(event.target.value)}
      />
    </span>
  );
}

/** Подсказка о формате под полем: попытка не тратится, это не ошибка. */
export function FormatHint({ text }: { text: string }) {
  return (
    <p className="otvet-hint" role="status">
      {text}
    </p>
  );
}
