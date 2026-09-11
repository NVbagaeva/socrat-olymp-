import { clsx } from 'clsx';
import type { ComponentPropsWithRef, ReactNode } from 'react';

export type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger';
export type ButtonSize = 'sm' | 'md' | 'lg';

export interface ButtonProps extends Omit<ComponentPropsWithRef<'button'>, 'children'> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  /** Показывает спиннер и блокирует нажатие, не приглушая кнопку. */
  loading?: boolean;
  fullWidth?: boolean;
  children: ReactNode;
}

const VARIANT: Record<ButtonVariant, string> = {
  primary: 'btn--primary',
  secondary: 'btn--secondary',
  ghost: 'btn--ghost',
  danger: 'btn--danger',
};

const SIZE: Record<ButtonSize, string | null> = {
  sm: 'btn--sm',
  md: null,
  lg: 'btn--lg',
};

export function Button({
  variant = 'primary',
  size = 'md',
  loading = false,
  fullWidth = false,
  type = 'button',
  className,
  children,
  onClick,
  ...rest
}: ButtonProps) {
  return (
    <button
      type={type}
      className={clsx(
        'btn',
        VARIANT[variant],
        SIZE[size],
        fullWidth && 'btn--block',
        loading && 'is-loading',
        className,
      )}
      aria-disabled={loading || undefined}
      aria-busy={loading || undefined}
      onClick={loading ? undefined : onClick}
      {...rest}
    >
      {children}
    </button>
  );
}
