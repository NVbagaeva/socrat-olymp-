import { clsx } from 'clsx';
import type { ComponentPropsWithRef } from 'react';

export type FieldLabelProps = ComponentPropsWithRef<'label'>;

/** Метка поля. Всегда сверху — плейсхолдер её не заменяет. */
export function FieldLabel({ className, children, ...rest }: FieldLabelProps) {
  return (
    <label className={clsx('field__label', className)} {...rest}>
      {children}
    </label>
  );
}
