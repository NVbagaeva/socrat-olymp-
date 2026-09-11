import { clsx } from 'clsx';
import { landing } from '@/content/landing';

export interface HeroImageProps {
  className?: string;
}

/**
 * Изображение героя. Два исходника с прозрачным фоном: широкий для десктопа
 * и вертикальный для телефона, каждый в AVIF, WebP и PNG.
 *
 * Ни один из них не растягивается выше половины натуральной ширины —
 * на экранах с удвоенной плотностью это даёт отрисовку пиксель-в-пиксель,
 * а стекло не замыливается. Пределы стоят в landing.css.
 */
const DESKTOP = { width: 1672, height: 941 };
/* Подготовленный кадр: снизу срезана пустая треть. */
const MOBILE = { width: 1122, height: 946 };
const SWITCH = '(min-width: 768px)';

const FORMATS = [
  { ext: 'avif', type: 'image/avif' },
  { ext: 'webp', type: 'image/webp' },
  { ext: 'png', type: 'image/png' },
] as const;

export function HeroImage({ className }: HeroImageProps) {
  return (
    <picture>
      {/* Порядок важен: побеждает первый подошедший источник. */}
      {FORMATS.map((format) => (
        <source
          key={`desktop-${format.ext}`}
          media={SWITCH}
          type={format.type}
          srcSet={`/hero/hero-desktop.${format.ext}`}
          width={DESKTOP.width}
          height={DESKTOP.height}
        />
      ))}
      {FORMATS.slice(0, -1).map((format) => (
        <source
          key={`mobile-${format.ext}`}
          type={format.type}
          srcSet={`/hero/hero-mobile.${format.ext}`}
          width={MOBILE.width}
          height={MOBILE.height}
        />
      ))}
      {/* Запасной вариант и он же носитель размеров: без width и height
          страница дёргалась бы, пока картинка грузится. */}
      <img
        className={clsx('hero__art', className)}
        src="/hero/hero-mobile.png"
        alt={landing.hero.image.alt}
        width={MOBILE.width}
        height={MOBILE.height}
        fetchPriority="high"
        loading="eager"
        decoding="async"
      />
    </picture>
  );
}
