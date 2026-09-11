import { landing } from '@/content/landing';
import { HeroImage } from './HeroImage';

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

        <HeroImage />
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
