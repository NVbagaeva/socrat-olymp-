import { clsx } from 'clsx';
import type { CSSProperties } from 'react';
import './illustration.css';
import type { IllustrationVariant } from './illustrationRamka';

export { illustrationRamka, type IllustrationVariant } from './illustrationRamka';

/**
 * Единая система размеров картинок-иллюстраций.
 *
 * Вариант задаёт наибольший отображаемый размер (CSS-пиксели):
 *
 *   header  — картинка в шапке раздела: 260, телефон 112;
 *   hero    — главная картинка вводного блока («О задании» и подобные):
 *             не шире 360 и не выше 300, телефон — до 220 по ширине;
 *   section — иллюстрация внутри теории и разборов: до 280;
 *   inline  — маленькая картинка в карточке, списке, плитке: 96–140;
 *   task    — картинка к условию задачи: 160–180, телефон 120.
 *
 * Норма держится в illustration.css через !important: правило соседнего
 * компонента (width: 100% у картинки в колонке) не растянет картинку
 * больше нормы ни на каком экране, а на очень широком размеры не растут —
 * всё в пикселях, без долей экрана. Картинка вписывается целиком
 * (object-fit: contain), без обрезки и искажения.
 *
 * Атрибуты width/height — отображаемый размер в пропорциях исходника:
 * место держится до загрузки, вёрстка не сдвигается. Атрибут data-ill —
 * вариант для проверки scripts/check-illyustracii.mjs.
 *
 * Файлы: src — 1x; src2x — файл вдвое крупнее, если есть. Исходник,
 * который сам не меньше двойного отображаемого размера, — это и есть 2x,
 * он так и помечается. Набор ширин (картинки, собранные скриптами в
 * нескольких размерах) — sources/srcSet + sizes, как у <picture>.
 */

/** Наибольшие ширина и высота варианта на компьютере, px. */
export const ILLUSTRATION_NORMA: Record<IllustrationVariant, { w: number; h: number }> = {
  header: { w: 260, h: 260 },
  hero: { w: 360, h: 300 },
  section: { w: 280, h: 280 },
  inline: { w: 140, h: 140 },
  task: { w: 180, h: 180 },
};

/** Размер по умолчанию, если вызывающий не задал свой (в пределах нормы). */
const PO_UMOLCHANIYU: Record<IllustrationVariant, number> = {
  header: 260,
  hero: 360,
  section: 280,
  inline: 120,
  task: 180,
};

/** Нижняя граница размера варианта: inline — от 96, task — от 160. */
const NE_MENSHE: Partial<Record<IllustrationVariant, number>> = { inline: 96, task: 160 };

export interface IllustrationSource {
  type: string;
  srcSet: string;
}

export interface IllustrationProps {
  variant: IllustrationVariant;
  src: string;
  /** Натуральные размеры исходника: пропорции и пометка 1x/2x. */
  width: number;
  height: number;
  alt?: string;
  /** Файл вдвое крупнее (2x). */
  src2x?: string;
  /** Свой набор файлов (ширины w) вместо 1x/2x — с sizes. */
  srcSet?: string;
  sizes?: string;
  sources?: readonly IllustrationSource[];
  /**
   * Желаемый размер большей стороны в пределах нормы варианта
   * (inline: 96–140, task: 160–180). Не задан — размер варианта.
   */
  size?: number;
  /** На телефоне картинки нет (мешает тексту). */
  hideOnPhone?: boolean;
  /** Выравнивание в своём блоке: по центру (по умолчанию) или к началу. */
  align?: 'center' | 'start';
  /** Первый экран: без ленивой загрузки, с высоким приоритетом. */
  priority?: boolean;
  className?: string;
  imgClassName?: string;
}

/** Отображаемый размер в пропорциях исходника, не больше нормы. */
export function razmerIllustracii(
  variant: IllustrationVariant,
  width: number,
  height: number,
  size?: number,
): { w: number; h: number } {
  const norma = ILLUSTRATION_NORMA[variant];
  const nizh = NE_MENSHE[variant] ?? 1;
  const bolshaya = Math.min(
    Math.max(size ?? PO_UMOLCHANIYU[variant], nizh),
    Math.max(norma.w, norma.h),
  );
  const ar = width > 0 && height > 0 ? width / height : 1;
  let w = ar >= 1 ? bolshaya : bolshaya * ar;
  let h = w / ar;
  if (w > norma.w) {
    w = norma.w;
    h = w / ar;
  }
  if (h > norma.h) {
    h = norma.h;
    w = h * ar;
  }
  return { w: Math.round(w), h: Math.round(h) };
}

export function Illustration({
  variant,
  src,
  width,
  height,
  alt = '',
  src2x,
  srcSet,
  sizes,
  sources,
  size,
  hideOnPhone = false,
  align = 'center',
  priority = false,
  className,
  imgClassName,
}: IllustrationProps) {
  const r = razmerIllustracii(variant, width, height, size);
  const set =
    srcSet ??
    (src2x !== undefined ? `${src} 1x, ${src2x} 2x` : `${src} ${width >= r.w * 2 ? '2x' : '1x'}`);
  /* Набор ширин без своего sizes — берётся отображаемая ширина. */
  const sz = srcSet !== undefined || sources !== undefined ? (sizes ?? `${r.w}px`) : undefined;
  const style = {
    '--illu-dw': `${r.w}px`,
    '--illu-ar': `${width} / ${height}`,
  } as CSSProperties;
  return (
    <picture
      className={clsx(
        'illu',
        `illu--${variant}`,
        hideOnPhone && 'illu--skryt-tel',
        align === 'start' && 'illu--start',
        className,
      )}
      data-ill={variant}
      style={style}
    >
      {sources?.map((s) => (
        <source key={s.type} type={s.type} srcSet={s.srcSet} sizes={sz} />
      ))}
      <img
        className={imgClassName}
        src={src}
        srcSet={set}
        sizes={sz}
        alt={alt}
        aria-hidden={alt === '' ? 'true' : undefined}
        width={r.w}
        height={r.h}
        loading={priority ? undefined : 'lazy'}
        fetchPriority={priority ? 'high' : undefined}
        decoding="async"
      />
    </picture>
  );
}
