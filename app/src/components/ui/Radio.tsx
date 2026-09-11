import { clsx } from 'clsx';
import type { ComponentPropsWithRef, ReactNode } from 'react';

export interface RadioProps extends Omit<ComponentPropsWithRef<'input'>, 'type' | 'children'> {
  children: ReactNode;
}

export function Radio({ className, children, ...rest }: RadioProps) {
  return (
    <label className={clsx('check check--radio', className)}>
      <input type="radio" {...rest} />
      <span>{children}</span>
    </label>
  );
}
