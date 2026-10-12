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
 * Ширина картинки в шапке: правая колонка сетки 1.8fr : 1fr. На
 * компьютере это треть ширины раздела, не больше 400px; ниже 1024px
 * картинки нет (общий слой section.css прячет колонку), браузеру всё
 * равно надо что-то сказать — пусть берёт самый лёгкий файл.
 */
const SIZES = '(min-width: 1024px) 400px, 1px';

/**
 * Картинка шапки раздела (слот media у ShapkaRazdela) — одна на все
 * разделы с иллюстрацией: №4 и №1. Раскладку шапки задаёт метка
 * section-head--art (section.css), сама картинка себя не позиционирует.
 *
 * Декор: заголовок стоит рядом текстом, поэтому alt пустой, а картинка
 * скрыта от скринридера. Она в первом экране — без loading="lazy" и с
 * высоким приоритетом; размеры заданы, вёрстка при загрузке не сдвигается.
 */
export function IllyustratsiyaShapki({ art }: { art: ShapkaArt }) {
  if (art.shiriny === undefined) {
    return (
      <img
        className="shapka-art"
        src={art.src}
        alt=""
        aria-hidden="true"
        width={art.width}
        height={art.height}
        fetchPriority="high"
        decoding="async"
      />
    );
  }
  const file = (width: number, ext: string) => assetUrl(`${art.src}-${width}.${ext}`);
  const set = (ext: string) => art.shiriny?.map((w) => `${file(w, ext)} ${w}w`).join(', ');
  const fallback = art.shiriny[1] ?? art.shiriny[0] ?? 0;
  return (
    <picture className="shapka-art">
      <source type="image/webp" srcSet={set('webp')} sizes={SIZES} />
      <img
        src={file(fallback, 'png')}
        srcSet={set('png')}
        sizes={SIZES}
        alt=""
        aria-hidden="true"
        width={art.width}
        height={art.height}
        fetchPriority="high"
        decoding="async"
      />
    </picture>
  );
}
