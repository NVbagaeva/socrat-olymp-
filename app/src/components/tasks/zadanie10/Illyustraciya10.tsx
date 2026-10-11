import { clsx } from 'clsx';
import { illyustraciya } from '@/lib/zadanie10/illyustracii';

/**
 * Иллюстрация сюжета прототипа: webp с запасным png, alt по-русски.
 * Картинки нет — компонент ничего не выводит (никаких заглушек).
 *
 * svernuto — в тренажёре над условием: картинка спрятана в
 * раскрывающийся блок «Картинка к задаче», чтобы не отодвигать условие.
 */
export function Illyustraciya10({
  id,
  svernuto = false,
  className,
}: {
  id: string;
  svernuto?: boolean;
  className?: string;
}) {
  const il = illyustraciya(id);
  if (il === null) {
    return null;
  }
  const picture = (
    <picture className={clsx('z10-ill', className)}>
      <source type="image/webp" srcSet={il.webp} />
      <img
        src={il.png}
        alt={il.alt}
        width={il.width}
        height={il.height}
        loading="lazy"
        decoding="async"
      />
    </picture>
  );
  if (!svernuto) {
    return picture;
  }
  return (
    <details className="z10-ill__svernuto">
      <summary>Картинка к задаче</summary>
      {picture}
    </details>
  );
}
