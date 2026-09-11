import { clsx } from 'clsx';
import type { ComponentPropsWithRef } from 'react';

export type FieldMessageTone = 'neutral' | 'error' | 'success';

export interface FieldMessageProps extends ComponentPropsWithRef<'p'> {
  tone?: FieldMessageTone;
}

const TONE: Record<FieldMessageTone, string | null> = {
  neutral: null,
  error: 'field__msg--error',
  success: 'field__msg--success',
};

/**
 * Подпись под полем. Ошибка озвучивается сразу: сообщение объясняет формат,
 * а не констатирует, что ввод неверный.
 */
export function FieldMessage({
  tone = 'neutral',
  className,
  children,
  ...rest
}: FieldMessageProps) {
  return (
    <p
      className={clsx('field__msg', TONE[tone], className)}
      role={tone === 'error' ? 'alert' : undefined}
      {...rest}
    >
      {children}
    </p>
  );
}
