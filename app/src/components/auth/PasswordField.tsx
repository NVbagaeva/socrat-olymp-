'use client';

import { useId, useState } from 'react';
import { FieldLabel, FieldMessage, Input } from '@/components/ui';
import { PASSWORD_MIN, REGISTER_FORM } from '@/content/auth';

export interface PasswordFieldProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
  /** Новый пароль: подсказка про длину по мере ввода. */
  fresh?: boolean;
  autoComplete: 'current-password' | 'new-password';
  disabled?: boolean;
  /** Ошибка, пришедшая снаружи (например, пароли не совпали). */
  error?: string | null;
  name?: string;
}

/** Поле пароля с кнопкой «показать» и подсказкой о длине. */
export function PasswordField({
  label,
  value,
  onChange,
  fresh = false,
  autoComplete,
  disabled = false,
  error = null,
  name = 'password',
}: PasswordFieldProps) {
  const id = useId();
  const [shown, setShown] = useState(false);
  const left = PASSWORD_MIN - value.length;
  const hint =
    !fresh || value === ''
      ? fresh
        ? REGISTER_FORM.passwordHint
        : null
      : left > 0
        ? REGISTER_FORM.passwordShort(left)
        : REGISTER_FORM.passwordOk;
  const hintId = `${id}-hint`;

  return (
    <div className="field">
      <FieldLabel htmlFor={id}>{label}</FieldLabel>
      <div className="password">
        <Input
          id={id}
          name={name}
          type={shown ? 'text' : 'password'}
          value={value}
          onChange={(event) => onChange(event.target.value)}
          autoComplete={autoComplete}
          minLength={fresh ? PASSWORD_MIN : undefined}
          required
          disabled={disabled}
          state={error !== null ? 'error' : 'default'}
          aria-describedby={hint !== null ? hintId : undefined}
        />
        <button
          type="button"
          className="password__toggle"
          aria-pressed={shown}
          aria-label={shown ? 'Скрыть пароль' : 'Показать пароль'}
          onClick={() => setShown((state) => !state)}
          disabled={disabled}
        >
          {shown ? 'Скрыть' : 'Показать'}
        </button>
      </div>
      {error !== null ? (
        <FieldMessage tone="error">{error}</FieldMessage>
      ) : hint !== null ? (
        <FieldMessage id={hintId} tone={fresh && value !== '' && left <= 0 ? 'success' : 'neutral'}>
          {hint}
        </FieldMessage>
      ) : null}
    </div>
  );
}
