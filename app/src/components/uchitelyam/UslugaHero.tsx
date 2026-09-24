import { uchitelyam } from '@/content/uchitelyam';
import { ByloStaloArt } from './ByloStaloArt';
import { ZagruzkaStroka } from './ZagruzkaStroka';

const { hero } = uchitelyam;

/** Экран 1. Текст слева, «было → стало» справа; на телефоне картинка под текстом. */
export function UslugaHero() {
  return (
    <section className="svc-hero" aria-labelledby="svc-title">
      <div className="wrap svc-hero__grid">
        <div>
          <p className="hero__eyebrow">{hero.eyebrow}</p>
          <h1 className="svc-hero__title" id="svc-title">
            {hero.titleLines.map((line) => (
              <span key={line}>{line}</span>
            ))}
          </h1>
          <p className="svc-hero__lead">{hero.lead}</p>
          <div className="svc-hero__actions">
            <a className="btn btn--primary btn--lg" href={hero.primary.href}>
              {hero.primary.label}
            </a>
            <a className="btn btn--secondary btn--lg" href={hero.secondary.href}>
              {hero.secondary.label}
            </a>
          </div>
          <p className="svc-hero__note">{hero.note}</p>
          <div className="svc-foot">
            <div className="svc-trust">
              <img src={hero.trust.photo} alt="" width="44" height="44" decoding="async" />
              <div>
                <b>{hero.trust.name}</b>
                <span>{hero.trust.line}</span>
              </div>
            </div>
            <ZagruzkaStroka />
          </div>
        </div>
        <ByloStaloArt vid="hero" />
      </div>
    </section>
  );
}
