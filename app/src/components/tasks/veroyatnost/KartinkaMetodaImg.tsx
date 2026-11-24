import type { Zadanie } from '@/content/veroyatnost';
import { SHIRINY_KARTINOK, kartinkaMetoda } from '@/lib/veroyatnost/metody-kartinki';
import { illyustraciyaUrl } from '@/lib/illyustraciiUrl';

export interface KartinkaMetodaImgProps {
  zadanie: Zadanie;
  id: string;
  /** Подпись картинки; по умолчанию пустая — картинка декоративная. */
  alt?: string;
}

/**
 * Иллюстрация метода для стеклянной плашки карточки (.vmetod__kartinka):
 * WebP двух ширин и запасной PNG, размеры — обрезанного кадра, загрузка
 * ленивая. Общая для карточек №4 и №5. Нет картинки — ничего.
 */
export function KartinkaMetodaImg({ zadanie, id, alt = '' }: KartinkaMetodaImgProps) {
  const k = kartinkaMetoda(zadanie, id);
  if (k === undefined) return null;
  const put = (w: number, ext: string) => illyustraciyaUrl(`${k.put}-${w}.${ext}`);
  return (
    <picture>
      <source
        type="image/webp"
        srcSet={SHIRINY_KARTINOK.map((w) => `${put(w, 'webp')} ${w}w`).join(', ')}
        sizes="220px"
      />
      <img
        src={put(SHIRINY_KARTINOK[1], 'png')}
        width={k.width}
        height={k.height}
        alt={alt}
        loading="lazy"
        decoding="async"
      />
    </picture>
  );
}
