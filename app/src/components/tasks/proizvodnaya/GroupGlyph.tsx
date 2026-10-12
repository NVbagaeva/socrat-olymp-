import type { Gruppa } from '@/lib/proizvodnaya/types';

/**
 * Миниатюра группы прототипов для карточки конфигуратора: схема без
 * формул и без цифр — оси, кривая и то, что в группе ищут.
 * Цвета — токены темы.
 */
export function GroupGlyph({ gruppa }: { gruppa: Gruppa }) {
  const curve = 'var(--color-primary)';
  const aux = 'var(--color-accent)';
  const axis = 'var(--color-border-strong)';
  return (
    <svg viewBox="0 0 96 60" width="96" height="60" className="z9-glyph" role="presentation">
      <path d="M6 54H92M10 56V4" fill="none" stroke={axis} strokeWidth="1.5" />
      {gruppa === 'I' ? (
        <>
          <path
            d="M10 52C32 50 52 38 88 8"
            fill="none"
            stroke={curve}
            strokeWidth="2.6"
            strokeLinecap="round"
          />
          <circle cx="56" cy="34" r="3.4" fill={aux} />
        </>
      ) : null}
      {gruppa === 'II' ? (
        <>
          <path
            d="M10 46C30 50 46 40 60 26S80 12 90 10"
            fill="none"
            stroke={curve}
            strokeWidth="2.6"
            strokeLinecap="round"
          />
          <path d="M34 50L84 14" fill="none" stroke={aux} strokeWidth="2.2" strokeLinecap="round" />
          <circle cx="58" cy="32" r="3.4" fill={curve} />
        </>
      ) : null}
      {gruppa === 'III' ? (
        <>
          <path
            d="M10 40C22 8 30 8 42 34S60 54 70 36S84 12 90 14"
            fill="none"
            stroke={curve}
            strokeWidth="2.6"
            strokeLinecap="round"
          />
          <circle cx="27" cy="16" r="3.2" fill={aux} />
          <circle cx="58" cy="46" r="3.2" fill={aux} />
        </>
      ) : null}
      {gruppa === 'IV' ? (
        <>
          <path
            d="M10 14C28 14 34 46 50 46S70 6 90 10"
            fill="none"
            stroke={curve}
            strokeWidth="2.6"
            strokeLinecap="round"
          />
          <path d="M8 30H92" fill="none" stroke={axis} strokeWidth="1.2" />
          <circle cx="36" cy="30" r="3.2" fill={aux} />
          <circle cx="68" cy="30" r="3.2" fill={aux} />
        </>
      ) : null}
      {gruppa === 'V' ? (
        <>
          <path d="M26 54C34 24 50 14 70 20V54Z" fill={aux} fillOpacity="0.22" stroke="none" />
          <path
            d="M10 52C30 52 36 16 54 14S80 20 90 18"
            fill="none"
            stroke={curve}
            strokeWidth="2.6"
            strokeLinecap="round"
          />
        </>
      ) : null}
    </svg>
  );
}
