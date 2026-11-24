import { Illustration, type IllustrationVariant } from '@/components/ui/Illustration';
import { assetUrl } from '@/lib/assetUrl';

/**
 * Иллюстрация шапки раздела. Одна запись на раздел — в его контенте.
 *
 * `src` — один готовый файл (№4). `shiriny` — набор ширин, собранный
 * scripts/build-shapka.mjs: тогда `src` — путь без ширины и расширения,
 * файлы лежат рядом как `<src>-<ширина>.webp` и `.png` (№1).
 */
export interface ShapkaArt {
  src: string;
  /** Натуральные размеры кадра: место в шапке держится до загрузки. */
  width: number;
  height: number;
  shiriny?: readonly number[];
}

/**
 * Картинка шапки раздела (слот media у ShapkaRazdela) — одна на все
 * разделы с иллюстрацией. Размер — норма Illustration: в шапке раздела
 * вариант header (260, телефон 112), в шапке «О задании» — hero.
 *
 * Декор: заголовок стоит рядом текстом, поэтому alt пустой, а картинка
 * скрыта от скринридера. Она в первом экране — без loading="lazy" и с
 * высоким приоритетом; размеры заданы, вёрстка при загрузке не сдвигается.
 */
export function IllyustratsiyaShapki({
  art,
  alt = '',
  variant = 'header',
}: {
  art: ShapkaArt;
  /** Описание: у картинки шапки раздела — пустое (декор). */
  alt?: string;
  variant?: Extract<IllustrationVariant, 'header' | 'hero'>;
}) {
  if (art.shiriny === undefined) {
    return (
      <Illustration
        variant={variant}
        className="shapka-art"
        src={art.src}
        alt={alt}
        width={art.width}
        height={art.height}
        priority
      />
    );
  }
  const file = (width: number, ext: string) => assetUrl(`${art.src}-${width}.${ext}`);
  const set = (ext: string) => art.shiriny?.map((w) => `${file(w, ext)} ${w}w`).join(', ') ?? '';
  const fallback = art.shiriny[1] ?? art.shiriny[0] ?? 0;
  return (
    <Illustration
      variant={variant}
      className="shapka-art"
      src={file(fallback, 'png')}
      srcSet={set('png')}
      sources={[{ type: 'image/webp', srcSet: set('webp') }]}
      alt={alt}
      width={art.width}
      height={art.height}
      priority
    />
  );
}
