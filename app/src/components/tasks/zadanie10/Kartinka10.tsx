import { clsx } from 'clsx';
import { Illustration, type IllustrationVariant } from '@/components/ui/Illustration';

/** Картинка сюжета, найденная при сборке (lib/zadanie10/illyustracii.ts). */
export interface IllInfo {
  webp: string;
  png: string;
  alt: string;
  width: number;
  height: number;
}

/**
 * Картинка сюжета №10 в «Стеклянной сцене»: готовый рисунок как есть —
 * webp с запасным png, прозрачный фон, без обрезки и пережатия. Размер —
 * норма Illustration: у условия и примера — task (до 180, телефон 120),
 * миниатюра в строке типа — inline. Подпись — для чтения с экрана в alt,
 * на экране не дублируется.
 */
export function Kartinka10({
  ill,
  alt,
  variant = 'task',
  className,
}: {
  ill: IllInfo;
  /** Пустая строка — картинка-украшение (рядом уже есть название). */
  alt?: string;
  variant?: Extract<IllustrationVariant, 'task' | 'inline' | 'section'>;
  className?: string;
}) {
  return (
    <Illustration
      variant={variant}
      className={clsx('z10-kartinka', className)}
      src={ill.png}
      sources={[{ type: 'image/webp', srcSet: `${ill.webp} ${ill.width}w` }]}
      srcSet={`${ill.png} ${ill.width}w`}
      alt={alt ?? ill.alt}
      width={ill.width}
      height={ill.height}
    />
  );
}
