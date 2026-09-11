import { clsx } from 'clsx';
import type { CSSProperties } from 'react';

export interface SkeletonProps {
  /** Ширина и высота задаются по месту: это размер будущего содержимого. */
  width?: string | number;
  height?: string | number;
  radius?: string;
  className?: string;
}

/** Заглушка загрузки. Показывается, только если ожидание превысило 200 мс. */
export function Skeleton({ width = '100%', height = 12, radius, className }: SkeletonProps) {
  const style: CSSProperties = { width, height };
  if (radius) style.borderRadius = radius;
  return <span className={clsx('skeleton', className)} style={style} aria-hidden="true" />;
}
