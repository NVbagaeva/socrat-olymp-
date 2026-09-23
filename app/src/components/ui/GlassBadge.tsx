import { clsx } from 'clsx';
import { useId } from 'react';

/** Что нарисовано внутри шара: столбики статистики или книга. */
export type GlassBadgeGlif = 'stolbiki' | 'kniga';

export interface GlassBadgeProps {
  className?: string;
  /**
   * Глиф внутри шара. По умолчанию столбики — значок «О задании»
   * №4 от появления книги не меняется ни на пиксель.
   */
  glif?: GlassBadgeGlif;
}

/**
 * Фигура внутри шара без заливки: цвет задаёт группа снаружи —
 * так один и тот же контур рисует и глиф, и его тень.
 *
 * Столбики стоят на подложке-черте, она рисуется отдельно: у тени
 * черты нет. Книга раскрыта корешком к середине шара; страницы
 * чуть провисают по нижнему краю, как у настоящей.
 */
function Glif({ glif }: { glif: GlassBadgeGlif }) {
  if (glif === 'kniga') {
    return (
      <>
        <path d="M80,68 C72,61 62,59 54,61 L54,93 C62,91 72,93 80,99 Z" />
        <path d="M80,68 C88,61 98,59 106,61 L106,93 C98,91 88,93 80,99 Z" />
      </>
    );
  }
  return (
    <>
      <rect x="60" y="80" width="5.5" height="18" rx="2.75" />
      <rect x="72" y="58" width="5.5" height="40" rx="2.75" />
      <rect x="84" y="70" width="5.5" height="28" rx="2.75" />
      <rect x="96" y="84" width="5.5" height="14" rx="2.75" />
    </>
  );
}

/**
 * Стеклянный значок статистической карточки «О задании».
 *
 * Разметка перенесена из утверждённого образца
 * design-reference/mockups/zadanie-04/glass-badge-statistika.svg
 * как есть. Менять её здесь нельзя: правки вносятся в образец,
 * и уже оттуда переносятся сюда — иначе картинка и образец разойдутся.
 *
 * Цвета внутри SVG стоят значениями, и это не нарушение правила
 * «в компонентах только токены»: это готовая декоративная иллюстрация,
 * такая же, как растровые картинки заданий в public/images. Токены
 * задают цвета интерфейса, а не содержимое рисунка.
 *
 * От образца отличаются только идентификаторы: у каждого экземпляра
 * они свои, иначе два значка на странице делили бы одни градиенты,
 * фильтры и обтравку. Размывается только блик, преломление, тень
 * столбиков и свет по верхней кромке — на теле шара фильтра нет.
 *
 * Размер задаёт CSS (--glass-badge-size): 72px, на телефоне 56px.
 * Шар занимает 104 единицы холста из 160, остальное — свечение
 * вокруг него, поэтому холст выступает за рамку значка.
 *
 * Внутри шара может стоять другой глиф: столбики статистики или
 * раскрытая книга исторической врезки №12. Шар, свечение, блик и
 * ободок у обоих одни и те же — меняется только фигура под клипом
 * и её тень. Образец книги: design-reference/mockups/zadanie-12/
 * glass-badge-kniga.svg.
 *
 * Декор: alt у значка нет, смысл несёт текст рядом.
 */
export function GlassBadge({ className, glif = 'stolbiki' }: GlassBadgeProps) {
  const id = useId();
  const body = `body-${id}`;
  const refract = `refract-${id}`;
  const sheen = `sheen-${id}`;
  const rim = `rim-${id}`;
  const bar = `bar-${id}`;
  const halo = `halo-${id}`;
  const blurs = `blur-s-${id}`;
  const blurm = `blur-m-${id}`;
  const clip = `clip-${id}`;

  return (
    <span className={clsx('glass-badge', className)} aria-hidden="true">
      <svg className="glass-badge__art" viewBox="0 0 160 160" focusable="false">
        <defs>
          {/* тело: лазурное, темнее к центру-верху, светлеет к нижнему краю */}
          <radialGradient id={body} cx="45%" cy="38%" r="68%">
            <stop offset="0%" stopColor="#2A64DB" />
            <stop offset="45%" stopColor="#2D72E8" />
            <stop offset="75%" stopColor="#3C93F5" />
            <stop offset="100%" stopColor="#5CB8FF" />
          </radialGradient>
          {/* свет, проходящий сквозь низ шара */}
          <radialGradient id={refract} cx="55%" cy="95%" r="55%">
            <stop offset="0%" stopColor="#A8ECFF" stopOpacity="1" />
            <stop offset="55%" stopColor="#6CCBFF" stopOpacity="0.6" />
            <stop offset="100%" stopColor="#6CCBFF" stopOpacity="0" />
          </radialGradient>
          {/* мягкий блик сверху */}
          <radialGradient id={sheen} cx="40%" cy="20%" r="45%">
            <stop offset="0%" stopColor="#FFFFFF" stopOpacity="0.5" />
            <stop offset="100%" stopColor="#FFFFFF" stopOpacity="0" />
          </radialGradient>
          {/* ободок: яркая дуга сверху-слева и голубая снизу */}
          <linearGradient id={rim} x1="0.2" y1="0" x2="0.8" y2="1">
            <stop offset="0%" stopColor="#FFFFFF" stopOpacity="0.45" />
            <stop offset="35%" stopColor="#FFFFFF" stopOpacity="0.08" />
            <stop offset="70%" stopColor="#8FDCFF" stopOpacity="0.35" />
            <stop offset="100%" stopColor="#B8F0FF" stopOpacity="0.95" />
          </linearGradient>
          {/* столбики: белые, к основанию уходят в голубой */}
          <linearGradient id={bar} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#FFFFFF" stopOpacity="0.95" />
            <stop offset="100%" stopColor="#CFE9FF" stopOpacity="0.7" />
          </linearGradient>
          {/* голубое свечение вокруг */}
          <radialGradient id={halo} cx="50%" cy="55%" r="50%">
            <stop offset="72%" stopColor="#4FB0FF" stopOpacity="0.3" />
            <stop offset="100%" stopColor="#4FB0FF" stopOpacity="0" />
          </radialGradient>
          <filter id={blurs} x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="1.4" />
          </filter>
          <filter id={blurm} x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="4" />
          </filter>
          <clipPath id={clip}>
            <circle cx="80" cy="80" r="52" />
          </clipPath>
        </defs>

        <circle cx="80" cy="84" r="64" fill={`url(#${halo})`} />
        <circle cx="80" cy="80" r="52" fill={`url(#${body})`} />

        <g clipPath={`url(#${clip})`}>
          <ellipse
            cx="82"
            cy="116"
            rx="52"
            ry="30"
            fill={`url(#${refract})`}
            filter={`url(#${blurm})`}
          />
          <ellipse
            cx="70"
            cy="42"
            rx="38"
            ry="22"
            fill={`url(#${sheen})`}
            filter={`url(#${blurm})`}
          />

          {/* лёгкая тень под глифом */}
          <g fill="#1B4DB8" opacity="0.25" filter={`url(#${blurs})`} transform="translate(1,2)">
            <Glif glif={glif} />
          </g>
          {/* глиф: тонкие полупрозрачные фигуры */}
          <g fill={`url(#${bar})`}>
            <Glif glif={glif} />
          </g>
          {glif === 'stolbiki' ? (
            <rect x="52" y="100" width="58" height="4" rx="2" fill="#FFFFFF" opacity="0.65" />
          ) : null}
        </g>
        <path
          d="M42,62 A52,52 0 0 1 100,32"
          fill="none"
          stroke="#FFFFFF"
          strokeWidth="3"
          strokeLinecap="round"
          opacity="0.22"
          filter={`url(#${blurs})`}
          clipPath={`url(#${clip})`}
        />
        <circle cx="80" cy="80" r="51.2" fill="none" stroke={`url(#${rim})`} strokeWidth="1.6" />
      </svg>
    </span>
  );
}
