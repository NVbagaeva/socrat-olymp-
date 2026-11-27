import type { Zadanie } from '@/content/veroyatnost';
import { SHIRINY_KARTINOK, kartinkaMetoda } from '@/lib/veroyatnost/metody-kartinki';
import { illyustraciyaUrl } from '@/lib/illyustraciiUrl';

export interface KartinkaMetodaImgProps {
  zadanie: Zadanie;
  id: string;
  /** Подпись картинки; по умолчанию пустая — картинка декоративная. */
  alt?: string;
  eager?: boolean;
}

/**
 * Иллюстрация метода для стеклянной плашки карточки (.vmetod__kartinka):
 * WebP двух ширин и запасной PNG, размеры — обрезанного кадра, загрузка
 * ленивая. Общая для карточек №4 и №5. Нет картинки — ничего.
 */
export function KartinkaMetodaImg({
  zadanie,
  id,
  alt = '',
  eager = false,
}: KartinkaMetodaImgProps) {
  const k = kartinkaMetoda(zadanie, id);
  if (k === undefined) return null;
  const put = (w: number, ext: string) => illyustraciyaUrl(`${k.put}-${w}.${ext}`);
  const sizes = `(max-width: 639px) ${Math.ceil((112 * k.width) / k.height)}px, ${Math.ceil((132 * k.width) / k.height)}px`;
  return (
    <picture>
      {zadanie === 4 && (
        <source
          type="image/avif"
          srcSet={SHIRINY_KARTINOK.map((w) => `${put(w, 'avif')} ${w}w`).join(', ')}
          sizes={sizes}
        />
      )}
      <source
        type="image/webp"
        srcSet={SHIRINY_KARTINOK.map((w) => `${put(w, 'webp')} ${w}w`).join(', ')}
        sizes={sizes}
      />
      <img
        src={put(SHIRINY_KARTINOK[1], 'png')}
        width={k.width}
        height={k.height}
        alt={alt}
        loading={eager ? 'eager' : 'lazy'}
        decoding="async"
      />
    </picture>
  );
}
