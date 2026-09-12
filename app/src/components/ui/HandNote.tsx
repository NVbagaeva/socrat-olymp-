import { clsx } from 'clsx';
import type { ReactNode } from 'react';

export interface HandNoteProps {
  children: ReactNode;
  className?: string;
}

/**
 * Рукописная подпись на полях — пометка от руки рядом с печатным текстом.
 *
 * Компонент отвечает только за начертание и цвет. Где подпись стоит,
 * под каким углом и с каким отступом — решает страница через className.
 */
export function HandNote({ children, className }: HandNoteProps) {
  return <span className={clsx('hand-note', className)}>{children}</span>;
}
