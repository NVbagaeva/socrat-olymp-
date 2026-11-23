'use client';

import { useId, useState } from 'react';
import type { FocusEventHandler, KeyboardEvent, ReactNode, Ref } from 'react';
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
  inputId?: string;
  inputRef?: Ref<HTMLInputElement>;
  help?: ReactNode;
  onFocus?: FocusEventHandler<HTMLInputElement>;
  onBlur?: FocusEventHandler<HTMLInputElement>;
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
  inputId,
  inputRef,
  help,
  onFocus,
  onBlur,
}: PasswordFieldProps) {
  const generatedId = useId();
  const id = inputId ?? generatedId;
  const [shown, setShown] = useState(false);
  const [capsLock, setCapsLock] = useState(false);
  const left = PASSWORD_MIN - value.length;
  const strength =
    value.length < PASSWORD_MIN
      ? 1
      : value.length >= 12 && /[A-ZА-Я]/.test(value) && /\d/.test(value)
        ? 3
        : value.length >= 10
          ? 2
          : 1;
  const strengthLabel =
    strength === 3
      ? REGISTER_FORM.passwordStrength.good
      : strength === 2
        ? REGISTER_FORM.passwordStrength.normal
        : REGISTER_FORM.passwordStrength.weak;
  const hint =
    !fresh || value === ''
      ? fresh
        ? REGISTER_FORM.passwordHint
        : null
      : left > 0
        ? REGISTER_FORM.passwordShort(left)
        : REGISTER_FORM.passwordOk;
  const hintId = `${id}-hint`;
  const strengthId = `${id}-strength`;
  const checkCaps = (event: KeyboardEvent<HTMLInputElement>) => {
    setCapsLock(event.getModifierState('CapsLock'));
  };

  return (
    <div className="field">
      <div className="password__label">
        <FieldLabel htmlFor={id}>{label}</FieldLabel>
        {help}
      </div>
      <div className="password">
        <Input
          id={id}
          ref={inputRef}
          name={name}
          type={shown ? 'text' : 'password'}
          value={value}
          onChange={(event) => onChange(event.target.value)}
          autoComplete={autoComplete}
          minLength={fresh ? PASSWORD_MIN : undefined}
          required
          disabled={disabled}
          state={
            error !== null ? 'error' : fresh && value.length >= PASSWORD_MIN ? 'success' : 'default'
          }
          aria-describedby={
            [
              error !== null ? `${id}-error` : null,
              hint !== null ? hintId : null,
              fresh && value ? strengthId : null,
            ]
              .filter(Boolean)
              .join(' ') || undefined
          }
          enterKeyHint="next"
          onKeyDown={checkCaps}
          onKeyUp={checkCaps}
          onFocus={onFocus}
          onBlur={onBlur}
        />
        <button
          type="button"
          className="password__toggle"
          aria-pressed={shown}
          aria-label={shown ? REGISTER_FORM.passwordHide : REGISTER_FORM.passwordShow}
          onClick={() => setShown((state) => !state)}
          disabled={disabled}
        >
          {shown ? REGISTER_FORM.passwordHideButton : REGISTER_FORM.passwordShowButton}
        </button>
      </div>
      {error !== null ? (
        <FieldMessage id={`${id}-error`} tone="error">
          {error}
        </FieldMessage>
      ) : hint !== null ? (
        <FieldMessage id={hintId} tone={fresh && value !== '' && left <= 0 ? 'success' : 'neutral'}>
          {hint}
        </FieldMessage>
      ) : null}
      {fresh && value !== '' ? (
        <div
          className={`password-strength password-strength--${strength}`}
          id={strengthId}
          role="meter"
          aria-label={REGISTER_FORM.passwordStrengthLabel}
          aria-valuemin={1}
          aria-valuemax={3}
          aria-valuenow={strength}
          aria-valuetext={strengthLabel}
        >
          <span className="password-strength__track" aria-hidden="true">
            <i />
          </span>
          <span>{strengthLabel}</span>
        </div>
      ) : null}
      {fresh && capsLock ? (
        <FieldMessage tone="neutral">{REGISTER_FORM.capsLock}</FieldMessage>
      ) : null}
    </div>
  );
}
