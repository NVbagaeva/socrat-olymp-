import { clsx } from 'clsx';
import type { ComponentPropsWithRef } from 'react';
import { FIELD_STATE, type FieldState } from './Input';

export interface SelectProps extends ComponentPropsWithRef<'select'> {
  state?: FieldState;
}

export function Select({ state = 'default', className, children, ...rest }: SelectProps) {
  return (
    <select
      className={clsx('input', FIELD_STATE[state], className)}
      aria-invalid={state === 'error' || undefined}
      {...rest}
    >
      {children}
    </select>
  );
}
