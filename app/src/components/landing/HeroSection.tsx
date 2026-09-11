import { Badge } from '@/components/ui';
import { landing } from '@/content/landing';
import { HeroChart } from './HeroChart';

const { hero, facts } = landing;

export function HeroSection() {
  return (
    <div className="wrap hero">
      <div className="hero__grid">
        <div>
          <h1>{hero.title}</h1>
          <p className="lead">{hero.lead}</p>
          <div className="hero__actions">
            <a className="btn btn--primary btn--lg" href={hero.primaryAction.href}>
              {hero.primaryAction.label}
            </a>
            <a className="btn btn--secondary btn--lg" href={hero.secondaryAction.href}>
              {hero.secondaryAction.label}
            </a>
          </div>
          <p className="hero__note">{hero.note}</p>
        </div>

        <div className="hero__chart">
          <div className="hero__chart-head">
            <span className="hero__chart-title">{hero.chart.title}</span>
            <Badge tone="info">{hero.chart.badge}</Badge>
          </div>
          <HeroChart alt={hero.chart.alt} />
          <p className="hero__chart-note">{hero.chart.caption}</p>
        </div>
      </div>

      <ul className="facts">
        {facts.map((fact) => (
          <li className="fact" key={fact.label}>
            <b>{fact.value}</b>
            <span>{fact.label}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
