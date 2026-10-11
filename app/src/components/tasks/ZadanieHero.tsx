import { assetUrl } from '@/lib/assetUrl';

/** Ширины файлов — как в scripts/build-zadanie-hero.mjs. */
const WIDTHS = [480, 768, 1152] as const;
/** Натуральные размеры исходника: место под картинку резервируется. */
const WIDTH = 1536;
const HEIGHT = 1024;

export interface ZadanieHeroProps {
  /** Папка иллюстрации: public/images/zadaniya/<task>/hero-<ширина>.*. */
  task: string;
}

/**
 * Иллюстрация верхнего блока страницы задания (справа от заголовка).
 *
 * Декор: подпись и заголовок стоят рядом текстом, поэтому alt пустой, а
 * картинка скрыта от скринридера. WebP с запасным PNG, три ширины
 * (480, 768, 1152): телефон берёт 480 или 768, компьютер — 768 или 1152.
 *
 * Картинка в первом экране, поэтому без loading="lazy" и с высоким
 * приоритетом; размеры заданы — вёрстка при загрузке не сдвигается.
 */
export function ZadanieHero({ task }: ZadanieHeroProps) {
  const file = (width: number, ext: string) =>
    assetUrl(`/images/zadaniya/${task}/hero-${width}.${ext}`);
  const set = (ext: string) => WIDTHS.map((width) => `${file(width, ext)} ${width}w`).join(', ');
  /* Компьютер: колонка до 460px; телефон: картинка высотой ≈180px, то
     есть шириной ≈270px. Столько и просим у браузера. */
  const sizes = '(min-width: 1024px) 460px, 270px';
  return (
    <picture className="zadanie-hero">
      <source type="image/webp" srcSet={set('webp')} sizes={sizes} />
      <img
        src={file(768, 'png')}
        srcSet={set('png')}
        sizes={sizes}
        width={WIDTH}
        height={HEIGHT}
        alt=""
        aria-hidden="true"
        fetchPriority="high"
        decoding="async"
      />
    </picture>
  );
}
