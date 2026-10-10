import { clsx } from 'clsx';
import { FigureZoom } from '@/components/ui';

/** Натуральная ширина рисунка движка: из атрибута width корневого svg. */
function shirinaSvg(svg: string): number | null {
  const found = /<svg[^>]*\swidth="([\d.]+)"/.exec(svg);
  return found === null ? null : Number(found[1]);
}

export interface FiguraSvg9Props {
  /** Разметка рисунка: renderFigura(...) из lib/proizvodnaya/render.ts. */
  svg: string;
  /** Чем подписан рисунок: заголовок окна «во весь экран». */
  label: string;
  className?: string;
}

/**
 * Рисунок задания №9 на странице: чертёж движка в кнопке «Открыть
 * во весь экран» (на телефоне тап увеличивает мелкие подписи).
 * Своих SVG здесь нет: разметку целиком даёт render.ts.
 */
export function FiguraSvg9({ svg, label, className }: FiguraSvg9Props) {
  const width = shirinaSvg(svg);
  return (
    <FigureZoom
      label={label}
      className={clsx('z9-fig', className)}
    >
      <span
        className="z9-fig__svg"
        style={width === null ? undefined : { maxWidth: `${width}px` }}
        dangerouslySetInnerHTML={{ __html: svg }}
      />
    </FigureZoom>
  );
}
