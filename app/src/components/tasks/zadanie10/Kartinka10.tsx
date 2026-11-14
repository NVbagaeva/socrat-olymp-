import { clsx } from 'clsx';

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
 * webp с запасным png, прозрачный фон, без обрезки и пережатия. Ширина
 * по месту, высота — по пропорциям файла; вертикальные рисунки (бак,
 * мяч) — уже, чтобы не занимали весь экран. Подпись — для чтения с
 * экрана в alt, на экране не дублируется.
 */
export function Kartinka10({
  ill,
  alt,
  className,
}: {
  ill: IllInfo;
  /** Пустая строка — картинка-украшение (рядом уже есть название). */
  alt?: string;
  className?: string;
}) {
  return (
    <picture
      className={clsx('z10-kartinka', ill.height > ill.width && 'z10-kartinka--vert', className)}
    >
      <source type="image/webp" srcSet={ill.webp} />
      <img
        src={ill.png}
        alt={alt ?? ill.alt}
        width={ill.width}
        height={ill.height}
        loading="lazy"
        decoding="async"
      />
    </picture>
  );
}
