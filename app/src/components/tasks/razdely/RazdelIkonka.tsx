import { clsx } from 'clsx';
import type { IkonkaRazdela } from './types';
import './razdely.css';

export interface RazdelIkonkaProps {
  /**
   * Иконка раздела. Не задана — компонент ничего не рисует: у подтем
   * других заданий иконок нет, и раскладка остаётся прежней.
   */
  icon?: IkonkaRazdela | undefined;
  /** Ширина на экране для выбора файла из srcset: «88px». */
  sizes: string;
  /** Раздела ещё нет: иконка бледная и чуть обесцвечена. */
  soon?: boolean;
  /** Не выбран: иконка слегка приглушена, чтобы разница читалась не только цветом. */
  dim?: boolean;
  /** Первый экран: грузится сразу. Остальные иконки — отложенно. */
  eager?: boolean;
  className?: string;
}

/**
 * Иконка раздела — единая для плашки, меню, блока «Другие разделы»,
 * страницы «Подтемы», окна выбора типа и экранов тренажёра и генератора.
 *
 * Это декор: название раздела стоит рядом текстом, поэтому alt пустой,
 * а картинка скрыта от скринридера. WebP с запасным PNG, три ширины
 * (96, 192, 384): телефон с плотностью 2–3 берёт 192 или 384, остальные
 * — 96. Размеры заданы, место под картинку резервируется.
 */
export function RazdelIkonka({
  icon,
  sizes,
  soon = false,
  dim = false,
  eager = false,
  className,
}: RazdelIkonkaProps) {
  if (icon === undefined) {
    return null;
  }
  return (
    <picture
      className={clsx(
        'razdel-ico',
        soon && 'razdel-ico--soon',
        dim && !soon && 'razdel-ico--dim',
        className,
      )}
    >
      <source type="image/webp" srcSet={icon.webp} sizes={sizes} />
      <img
        src={icon.src}
        srcSet={icon.png}
        sizes={sizes}
        width={icon.width}
        height={icon.height}
        alt=""
        aria-hidden="true"
        loading={eager ? 'eager' : 'lazy'}
        decoding="async"
      />
    </picture>
  );
}
