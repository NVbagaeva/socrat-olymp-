import { clsx } from 'clsx';
import './illustration.css';

/** Варианты картинок-иллюстраций (нормы — в Illustration.tsx). */
export type IllustrationVariant = 'header' | 'hero' | 'section' | 'inline' | 'task';

/**
 * Рамка нормы для картинки, которую рисует сам компонент (next/image,
 * своя разметка <picture>): пропсы на обёртку — вариант для проверки и
 * потолок размера из illustration.css. Своя ширина картинки остаётся,
 * больше нормы она не станет ни на каком экране.
 *
 * Отдельный модуль, без компонента Illustration: клиентские компоненты
 * (TaskCard) берут только рамку и не тянут в первую загрузку код
 * компонента.
 */
export function illustrationRamka(variant: IllustrationVariant, className?: string) {
  return {
    'data-ill': variant,
    className: clsx('illu-r', `illu--${variant}`, className),
  } as const;
}
