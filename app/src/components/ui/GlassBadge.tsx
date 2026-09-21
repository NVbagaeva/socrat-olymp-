import { clsx } from 'clsx';
import { useId, type ReactNode } from 'react';

export interface GlassBadgeProps {
  /**
   * Глиф внутри шара. Рисуется в том же холсте 160×160, что и стекло:
   * слои совмещаются один в один, и глиф не нужно вписывать в рамку.
   */
  children: ReactNode;
  className?: string;
}

/**
 * Стеклянный кружок под глиф: значок статистической карточки «О задании».
 *
 * Стекло нарисовано SVG, без растра, и повторяет образец
 * design-reference/mockups/zadanie-04/glass-badge-statistika.svg слой
 * в слой: свечение вокруг, тело шара, свет, проходящий сквозь низ,
 * мягкий блик сверху, размытый свет внутри верхней кромки и ободок.
 * Глиф со своей тенью и основанием лежит поверх отдельным слоем —
 * так внутрь встаёт любой значок.
 *
 * Координаты и доли прозрачности перенесены из образца без округления:
 * вид стекла держится именно на них. Цвета берутся из токенов через
 * классы на остановках градиентов, прозрачность задаётся рядом
 * в разметке — один и тот же белый нужен слоям с разной долей.
 *
 * Размер задаёт CSS (--glass-badge-size): 72px, на телефоне 56px. Шар
 * занимает 104 единицы холста из 160, остальное — свечение вокруг него,
 * поэтому холст выступает за рамку значка (--glass-badge-bleed).
 *
 * Декор: alt у кружка нет, смысл несёт текст рядом.
 */
export function GlassBadge({ children, className }: GlassBadgeProps) {
  const id = useId();
  const bodyId = `${id}-body`;
  const refractId = `${id}-refract`;
  const sheenId = `${id}-sheen`;
  const rimId = `${id}-rim`;
  const haloId = `${id}-halo`;
  const blurId = `${id}-blur`;
  const softId = `${id}-soft`;
  const clipId = `${id}-clip`;

  return (
    <span className={clsx('glass-badge', className)} aria-hidden="true">
      <svg className="glass-badge__glass" viewBox="0 0 160 160" focusable="false">
        <defs>
          {/* Тело: темнее к центру-верху, светлеет к нижнему краю. */}
          <radialGradient id={bodyId} cx="45%" cy="38%" r="68%">
            <stop offset="0%" className="glass-badge__stop-deep" />
            <stop offset="45%" className="glass-badge__stop-base" />
            <stop offset="75%" className="glass-badge__stop-light" />
            <stop offset="100%" className="glass-badge__stop-edge" />
          </radialGradient>
          {/* Свет, проходящий сквозь низ шара. */}
          <radialGradient id={refractId} cx="55%" cy="95%" r="55%">
            <stop offset="0%" className="glass-badge__stop-edge" stopOpacity="1" />
            <stop offset="55%" className="glass-badge__stop-light" stopOpacity="0.6" />
            <stop offset="100%" className="glass-badge__stop-light" stopOpacity="0" />
          </radialGradient>
          {/* Мягкий блик сверху. */}
          <radialGradient id={sheenId} cx="40%" cy="20%" r="45%">
            <stop offset="0%" className="glass-badge__stop-sheen" stopOpacity="0.5" />
            <stop offset="100%" className="glass-badge__stop-sheen" stopOpacity="0" />
          </radialGradient>
          {/* Ободок: светлая дуга сверху-слева и голубая снизу. */}
          <linearGradient id={rimId} x1="0.2" y1="0" x2="0.8" y2="1">
            <stop offset="0%" className="glass-badge__stop-rim" stopOpacity="0.45" />
            <stop offset="35%" className="glass-badge__stop-rim" stopOpacity="0.08" />
            <stop offset="70%" className="glass-badge__stop-edge" stopOpacity="0.35" />
            <stop offset="100%" className="glass-badge__stop-edge" stopOpacity="0.95" />
          </linearGradient>
          {/* Свечение вокруг шара. */}
          <radialGradient id={haloId} cx="50%" cy="55%" r="50%">
            <stop offset="72%" className="glass-badge__stop-light" stopOpacity="0.3" />
            <stop offset="100%" className="glass-badge__stop-light" stopOpacity="0" />
          </radialGradient>
          <filter id={blurId} x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="1.4" />
          </filter>
          <filter id={softId} x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="4" />
          </filter>
          <clipPath id={clipId}>
            <circle cx="80" cy="80" r="52" />
          </clipPath>
        </defs>

        <circle cx="80" cy="84" r="64" fill={`url(#${haloId})`} />
        <circle cx="80" cy="80" r="52" fill={`url(#${bodyId})`} />

        <g clipPath={`url(#${clipId})`}>
          <ellipse
            cx="82"
            cy="116"
            rx="52"
            ry="30"
            fill={`url(#${refractId})`}
            filter={`url(#${softId})`}
          />
          <ellipse
            cx="70"
            cy="42"
            rx="38"
            ry="22"
            fill={`url(#${sheenId})`}
            filter={`url(#${softId})`}
          />
        </g>

        {/* Размытый свет внутри верхней кромки — вместо белой дуги по краю. */}
        <path
          className="glass-badge__arc"
          d="M42,62 A52,52 0 0 1 100,32"
          fill="none"
          strokeWidth="3"
          strokeLinecap="round"
          opacity="0.22"
          filter={`url(#${blurId})`}
          clipPath={`url(#${clipId})`}
        />
        <circle cx="80" cy="80" r="51.2" fill="none" stroke={`url(#${rimId})`} strokeWidth="1.6" />
      </svg>
      <span className="glass-badge__glyph">{children}</span>
    </span>
  );
}
