import { clsx } from 'clsx';
import type { ComponentPropsWithRef } from 'react';

export type FieldState = 'default' | 'error' | 'success';

export interface InputProps extends ComponentPropsWithRef<'input'> {
  state?: FieldState;
}

export const FIELD_STATE: Record<FieldState, string | null> = {
  default: null,
  error: 'is-error',
  success: 'is-success',
};

export function Input({ state = 'default', className, ...rest }: InputProps) {
  return (
    <input
      className={clsx('input', FIELD_STATE[state], className)}
      aria-invalid={state === 'error' || undefined}
      {...rest}
    />
  );
}
