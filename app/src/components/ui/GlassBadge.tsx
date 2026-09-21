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
 * трети и тонкая светлая обводка по краю. Глиф лежит поверх отдельным
 * слоем — так внутрь встаёт любой значок, и его не нужно вписывать
 * в разметку стекла.
 *
 * Все цвета — из токенов через классы на остановках градиента и на фигурах:
 * в атрибутах SVG переменных нет. Идентификаторы градиента и фильтра
 * уникальны на экземпляр, иначе два кружка на странице делили бы один def.
 *
 * Размер задаёт CSS (--glass-badge-size): 72px, на телефоне 56px.
 * Декор: alt у кружка нет, смысл несёт текст рядом.
 */
export function GlassBadge({ children, className }: GlassBadgeProps) {
  const id = useId();
  const gradientId = `${id}-glass`;
  const sheenId = `${id}-sheen`;

  return (
    <span className={clsx('glass-badge', className)} aria-hidden="true">
      <svg className="glass-badge__glass" viewBox="0 0 72 72" focusable="false">
        <defs>
          <radialGradient id={gradientId} cx="0.42" cy="0.3" r="0.78">
            <stop offset="0" className="glass-badge__stop-light" />
            <stop offset="0.55" className="glass-badge__stop-base" />
            <stop offset="1" className="glass-badge__stop-deep" />
          </radialGradient>
          {/* Область фильтра шире эллипса, иначе размытие обрезается по его рамке. */}
          <filter id={sheenId} x="-30%" y="-60%" width="160%" height="220%">
            <feGaussianBlur stdDeviation="2.4" />
          </filter>
        </defs>
        <circle
          className="glass-badge__body"
          cx="36"
          cy="36"
          r="35.5"
          fill={`url(#${gradientId})`}
        />
        <ellipse
          className="glass-badge__sheen"
          cx="30"
          cy="18"
          rx="19"
          ry="9"
          filter={`url(#${sheenId})`}
        />
        <circle className="glass-badge__rim" cx="36" cy="36" r="35" />
      </svg>
      <span className="glass-badge__glyph">{children}</span>
    </span>
  );
}
