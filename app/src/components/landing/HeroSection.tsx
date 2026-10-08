import Link from 'next/link';
import { HeroImage } from './HeroImage';
import { HeroLines } from './HeroLines';
import { Metric, MetricRow } from '@/components/ui';
import { landing } from '@/content/landing';
import { HOWTO_HREF, HOWTO_PILL } from '@/content/onboarding';

const { hero, metrics } = landing;

/**
 * Первый экран. Слева изображение во всю высоту экрана от самого края окна,
 * справа текст. Полоса показателей строится по длине массива metrics.
 */
export function HeroSection() {
  return (
    <section className="hero">
      <HeroLines />

      <div className="hero__media">
        <HeroImage />
      </div>

      <div className="hero__body">
        <p className="hero__eyebrow">{hero.eyebrow}</p>

        <h1 className="t-display hero__title">
          {hero.titleLines.map((line) => (
            <span key={line}>{line}</span>
          ))}
        </h1>

        <p className="hero__lead">{hero.lead}</p>

        <div className="hero__actions">
          <a className="btn btn--primary btn--lg" href={hero.primaryAction.href}>
            {hero.primaryAction.label}
          </a>
          {/* Рядом с главной кнопкой — вход в инструкцию и тур. */}
          <Link className="hero__howto" href={HOWTO_HREF}>
            <span className="hero__howto-ico" aria-hidden="true">
              <svg viewBox="0 0 24 24">
                <circle cx="12" cy="12" r="8.5" />
                <path d="M9.6 9.6a2.5 2.5 0 0 1 4.8.9c0 1.7-2.4 2.1-2.4 3.6" />
                <path d="M12 16.9v.1" />
              </svg>
            </span>
            <span className="hero__howto-text">
              {HOWTO_PILL.label}
              <span className="hero__howto-meta">{HOWTO_PILL.meta}</span>
            </span>
          </Link>
          <a className="btn btn--secondary btn--lg" href={hero.secondaryAction.href}>
            {hero.secondaryAction.label}
          </a>
        </div>

        <p className="hero__note">{hero.note}</p>

        <MetricRow className="hero__metrics" columns={3}>
          {metrics.map((metric) => (
            <Metric key={metric.label} value={metric.value} label={metric.label} />
          ))}
        </MetricRow>
      </div>
    </section>
  );
}
