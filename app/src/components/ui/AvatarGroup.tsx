import { clsx } from 'clsx';
import type { ComponentPropsWithRef, ReactNode } from 'react';
import { Avatar, type AvatarSize } from './Avatar';

export interface AvatarGroupProps extends Omit<ComponentPropsWithRef<'span'>, 'children'> {
  children: ReactNode;
  /** Сколько участников не поместилось: покажет плашку «+N». */
  overflow?: number;
  size?: AvatarSize;
  /** Описание группы для скринридера. */
  label?: string;
}

export function AvatarGroup({
  children,
  overflow,
  size = 'sm',
  label,
  className,
  ...rest
}: AvatarGroupProps) {
  return (
    <span
      className={clsx('avatar-group', className)}
      role={label ? 'group' : undefined}
      aria-label={label}
      {...rest}
    >
      {children}
      {overflow !== undefined && overflow > 0 ? (
        <Avatar initials={`+${overflow}`} name={`Ещё ${overflow}`} size={size} tone="muted" />
      ) : null}
    </span>
  );
}
