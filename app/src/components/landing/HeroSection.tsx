import { HeroImage } from './HeroImage';
import { HeroLines } from './HeroLines';
import { Metric, MetricRow } from '@/components/ui';
import { landing } from '@/content/landing';

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
