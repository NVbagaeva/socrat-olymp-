import { landing } from '@/content/landing';

const { cta } = landing;

export function CtaSection() {
  return (
    <div className="wrap cta__block">
      <section className="cta" aria-labelledby="cta-title">
        <svg
          className="cta__art"
          width="460"
          height="220"
          viewBox="0 0 460 220"
          fill="none"
          aria-hidden="true"
        >
          <path
            d="M10 200 C90 196 130 176 190 150 C260 120 300 84 380 56 C410 46 435 38 455 32"
            stroke="currentColor"
            strokeWidth="3"
            strokeLinecap="round"
          />
          <circle cx="455" cy="32" r="7" fill="currentColor" />
        </svg>
        <h2 id="cta-title">{cta.title}</h2>
        <p>{cta.lead}</p>
        <div className="cta__actions">
          <a className="btn btn--primary btn--lg" href={cta.primaryAction.href}>
            {cta.primaryAction.label}
          </a>
          <a className="btn btn--secondary btn--lg" href={cta.secondaryAction.href}>
            {cta.secondaryAction.label}
          </a>
        </div>
      </section>
    </div>
  );
}
