import { clsx } from 'clsx';
import { useId, type ReactNode } from 'react';

export interface GlassBadgeProps {
  /** Глиф внутри кружка: любой из GlassGlyphs или свой SVG 24×24. */
  children: ReactNode;
  className?: string;
}

/**
 * Стеклянный кружок под глиф: значок статистической карточки «О задании».
 *
 * Стекло нарисовано SVG, без растра: круг с радиальным градиентом от
 * светлого центра-верха к насыщенному краю, размытый белый блик в верхней
 * трети, слабое отражение дугой у нижнего края и тонкая светлая обводка.
 * Глиф лежит поверх отдельным слоем — так внутрь встаёт любой значок,
 * и его не нужно вписывать в разметку стекла.
 *
 * Все цвета — из токенов через классы на остановках градиента и на фигурах:
 * в атрибутах SVG переменных нет. Идентификаторы градиента и фильтров
 * уникальны на экземпляр, иначе два кружка на странице делили бы один def.
 *
 * Размер задаёт CSS (--glass-badge-size): 72px, на телефоне 56px.
 * Декор: alt у кружка нет, смысл несёт текст рядом.
 */
export function GlassBadge({ children, className }: GlassBadgeProps) {
  const id = useId();
  const gradientId = `${id}-glass`;
  const sheenId = `${id}-sheen`;
  const reflexId = `${id}-reflex`;

  return (
    <span className={clsx('glass-badge', className)} aria-hidden="true">
      <svg className="glass-badge__glass" viewBox="0 0 72 72" focusable="false">
        <defs>
          {/* Светлое ядро в левом верхнем секторе, а насыщенный край берётся
              только на последней десятой радиуса: так верхняя половина
              читается светлой, а объём даёт узкая тёмная кромка. */}
          <radialGradient id={gradientId} cx="0.38" cy="0.28" r="0.95">
            <stop offset="0" className="glass-badge__stop-light" />
            <stop offset="0.55" className="glass-badge__stop-base" />
            <stop offset="0.92" className="glass-badge__stop-deep" />
          </radialGradient>
          {/* Область фильтра шире фигуры, иначе размытие обрезается по её рамке. */}
          <filter id={sheenId} x="-40%" y="-70%" width="180%" height="240%">
            <feGaussianBlur stdDeviation="2.6" />
          </filter>
          <filter id={reflexId} x="-40%" y="-70%" width="180%" height="240%">
            <feGaussianBlur stdDeviation="2.2" />
          </filter>
        </defs>

        <circle
          className="glass-badge__body"
          cx="36"
          cy="36"
          r="35.5"
          fill={`url(#${gradientId})`}
        />

        {/* Блик: 60% диаметра в ширину, 30% в высоту, в левом верхнем
            секторе — смещение от центра и даёт объём. */}
        <ellipse
          className="glass-badge__sheen"
          cx="28"
          cy="18"
          rx="21.5"
          ry="10.5"
          filter={`url(#${sheenId})`}
        />

        {/* Отражение снизу: слабая дуга вдоль нижнего края — она и даёт объём. */}
        <path
          className="glass-badge__reflex"
          d="M 15 53 A 24 18 0 0 1 57 53"
          filter={`url(#${reflexId})`}
        />

        <circle className="glass-badge__rim" cx="36" cy="36" r="34.8" />
      </svg>
      <span className="glass-badge__glyph">{children}</span>
    </span>
  );
}
