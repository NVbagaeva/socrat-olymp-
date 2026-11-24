import { clsx } from 'clsx';
import { assetUrl } from '@/lib/assetUrl';
import './kartinka-zadachi.css';

/**
 * Картинка-иллюстрация сюжета в карточке задачи (lib/kartinkiZadach.ts).
 *
 * Стоит в разметке перед условием: на компьютере обтекается текстом
 * справа (170 px), на телефоне — над условием по центру (120 px).
 * Размеры заданы заранее, загрузка ленивая — вёрстка не прыгает.
 * Чертежи и графики задач она не заменяет: те выводятся как раньше.
 * На чёрно-белой печати не выводится.
 */
export interface KartinkaProps {
  src: string;
  /** Уменьшенная копия для обычных экранов; нет — только src. */
  src280?: string;
  alt: string;
  /** Размер исходника: у картинок сюжетов — квадрат 560. */
  width?: number;
  height?: number;
  className?: string;
}

export function KartinkaZadachi({
  src,
  src280,
  alt,
  width = 560,
  height = 560,
  className,
}: KartinkaProps) {
  const s = assetUrl(src);
  const srcSet = src280 === undefined ? undefined : `${assetUrl(src280)} 280w, ${s} 560w`;
  return (
    <figure className={clsx('kz', className)}>
      <img
        src={s}
        srcSet={srcSet}
        sizes="(max-width: 480px) 120px, 170px"
        alt={alt}
        width={width}
        height={height}
        loading="lazy"
        decoding="async"
      />
    </figure>
  );
}
