import { clsx } from 'clsx';
import type { IkonkaRazdela } from './types';

export interface RazdelIkonkaProps {
  icon: IkonkaRazdela;
  /** Ширина на экране для выбора файла из srcset: «88px». */
  sizes: string;
  className?: string;
}

/**
 * Иконка раздела — декор: название раздела стоит рядом текстом, поэтому
 * alt пустой и картинка скрыта от скринридера. WebP с запасным PNG,
 * три ширины: телефон с плотностью 2–3 берёт 192 или 384, остальные — 96.
 */
export function RazdelIkonka({ icon, sizes, className }: RazdelIkonkaProps) {
  return (
    <picture className={clsx('razdel-ico', className)}>
      <source type="image/webp" srcSet={icon.webp} sizes={sizes} />
      <img
        src={icon.src}
        srcSet={icon.png}
        sizes={sizes}
        width={icon.width}
        height={icon.height}
        alt=""
        aria-hidden="true"
        loading="lazy"
        decoding="async"
      />
    </picture>
  );
}
