import { clsx } from 'clsx';
import { Illustration } from '@/components/ui/Illustration';
import { illyustraciya } from '@/lib/zadanie10/illyustracii';

/**
 * Иллюстрация сюжета прототипа в теории: webp с запасным png, alt
 * по-русски; размер — норма Illustration section (до 280).
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
    <Illustration
      variant="section"
      className={clsx('z10-ill', className)}
      src={il.png}
      sources={[{ type: 'image/webp', srcSet: `${il.webp} ${il.width}w` }]}
      srcSet={`${il.png} ${il.width}w`}
      alt={il.alt}
      width={il.width}
      height={il.height}
    />
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
