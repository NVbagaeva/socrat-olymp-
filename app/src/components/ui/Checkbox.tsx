'use client';

import { clsx } from 'clsx';
import { useEffect, useRef } from 'react';
import type { ComponentPropsWithRef, ReactNode } from 'react';

export interface CheckboxProps extends Omit<ComponentPropsWithRef<'input'>, 'type' | 'children'> {
  /** Промежуточное состояние: часть вложенных пунктов выбрана. */
  indeterminate?: boolean;
  children: ReactNode;
}

export function Checkbox({
  indeterminate = false,
  className,
  children,
  ref,
  ...rest
}: CheckboxProps) {
  const inner = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (inner.current) inner.current.indeterminate = indeterminate;
  }, [indeterminate]);

  return (
    <label className={clsx('check check--box', className)}>
      <input
        type="checkbox"
        ref={(node) => {
          inner.current = node;
          if (typeof ref === 'function') ref(node);
          else if (ref) ref.current = node;
        }}
        aria-checked={indeterminate ? 'mixed' : undefined}
        {...rest}
      />
      <span>{children}</span>
    </label>
  );
}
