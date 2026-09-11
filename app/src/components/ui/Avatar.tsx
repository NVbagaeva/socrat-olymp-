import { clsx } from 'clsx';
import type { ComponentPropsWithRef } from 'react';

export type AvatarSize = 'md' | 'sm' | 'xs';
export type AvatarTone = 'default' | 'muted' | 'onBrand';

export interface AvatarProps extends Omit<ComponentPropsWithRef<'span'>, 'children'> {
  /** Инициалы, 1–3 знака. */
  initials: string;
  /** Полное имя для скринридера. Без него аватар считается декоративным. */
  name?: string;
  size?: AvatarSize;
  tone?: AvatarTone;
}

const SIZE: Record<AvatarSize, string | null> = {
  md: null,
  sm: 'avatar--sm',
  xs: 'avatar--xs',
};

const TONE: Record<AvatarTone, string | null> = {
  default: null,
  muted: 'avatar--muted',
  onBrand: 'avatar--on-brand',
};

export function Avatar({
  initials,
  name,
  size = 'md',
  tone = 'default',
  className,
  ...rest
}: AvatarProps) {
  return (
    <span
      className={clsx('avatar', SIZE[size], TONE[tone], className)}
      role={name ? 'img' : undefined}
      aria-label={name}
      aria-hidden={name ? undefined : true}
      {...rest}
    >
      {initials}
    </span>
  );
}
