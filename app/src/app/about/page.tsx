import type { Metadata } from 'next';
import { SiteFooter, SiteHeader } from '@/components/layout';
import { about } from '@/content/about';
import './about.css';

export const metadata: Metadata = {
  title: about.meta.title,
  description: about.meta.description,
};

const { hero, path, problem, engine, principles, personal, cta } = about;

export default function AboutPage() {
  return (
    <>
      {/* Тот же SiteHeader, что и везде; currentHref подсвечивает пункт меню. */}
      <SiteHeader currentHref="/about" />

      <main>
        <section className="about-hero" aria-labelledby="about-title">
          <div className="wrap about-hero__in">
            <div className="about-hero__body">
              <p className="about-eyebrow">{hero.eyebrow}</p>
              <h1 className="about-hero__title" id="about-title">
                {hero.title}
              </h1>
              <p className="about-hero__lead">{hero.lead}</p>

              <div className="about-hero__actions">
                <a className="btn btn--primary btn--lg" href={hero.actions.primary.href}>
                  {hero.actions.primary.label}
                </a>
                <a className="btn btn--secondary btn--lg" href={hero.actions.secondary.href}>
                  {hero.actions.secondary.label}
                </a>
              </div>

              {/* Четыре равноправных пункта: ни карточек, ни теней —
                  иконка, подложка-кружок и две строки подписи. */}
              <ul className="creds">
                {hero.credibility.map((item) => (
                  <li className="cred" key={item.line1}>
                    <span className="cred__icon">
                      <img src={item.icon} alt="" width="40" height="40" decoding="async" />
                    </span>
                    <span className="cred__text">
                      {item.line1}
                      <br />
                      {item.line2}
                    </span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Правая зона. Порядок в разметке совпадает с глубиной:
                геометрия, формула, кристалл, бюст, портрет, надпись.
                Всё декоративное скрыто от скринридера и не ловит курсор. */}
            <div className="about-hero__stage">
              <img className="hero-layer hero-layer--net" src="/images/decor/network.png" alt="" aria-hidden="true" />
              <img className="hero-layer hero-layer--arcs" src="/images/decor/circles-1.png" alt="" aria-hidden="true" />
              <img
                className="hero-layer hero-layer--formula"
                src="/images/formuly/formula-kvadratichnaya-funkciya.png"
                alt=""
                aria-hidden="true"
              />
              <img
                className="hero-layer hero-layer--crystal"
                src="/images/glass/pyramid-truncated-wide.png"
                alt=""
                aria-hidden="true"
              />
              <img
                className="hero-layer hero-layer--bust"
                src="/images/author/bust-marble.png"
                alt=""
                aria-hidden="true"
              />

              <figure className="about-hero__figure">
                <img
                  className="about-hero__photo"
                  src={hero.photo.src}
                  srcSet={hero.photo.srcSet}
                  sizes={hero.photo.sizes}
                  alt={hero.photo.alt}
                  width={hero.photo.width}
                  height={hero.photo.height}
                  fetchPriority="high"
                  decoding="async"
                />
              </figure>

              <img
                className="hero-layer hero-layer--note"
                src="/images/nadpisi/nadpis-opyt-vdohnovlyaet.png"
                alt=""
                aria-hidden="true"
              />
            </div>
          </div>
        </section>

        <section className="about-band about-band--soft" aria-labelledby="path-title">
          <div className="wrap">
            <div className="about-head">
              <h2 className="t-h2" id="path-title">
                {path.title}
              </h2>
              <p>{path.lead}</p>
            </div>

            {/* Ось со точками: на широком экране горизонтальная, ниже — в столбик.
                Точка «параллельно» уходит с оси и держится на пунктире. */}
            <ol className="path">
              {path.points.map((point) => (
                <li
                  className={`path__point${point.parallel ? ' path__point--parallel' : ''}`}
                  key={point.place}
                >
                  <span className="path__dot" aria-hidden="true" />
                  <span className="path__period">{point.period}</span>
                  <span className="path__place">{point.place}</span>
                  {point.note ? (
                    <span
                      className={`path__note${point.longNote ? ' path__note--long' : ''}`}
                    >
                      {point.note}
                    </span>
                  ) : null}
                </li>
              ))}
            </ol>
          </div>
        </section>

        <section className="about-band" aria-labelledby="problem-title">
          <div className="wrap">
            {/* Узкая колонка лежит внутри контейнера, а не на нём самом:
                иначе её max-width перебил бы .wrap и блок поехал бы к центру. */}
            <div className="about-narrow">
              <h2 className="t-h2" id="problem-title">
                {problem.title}
              </h2>
              {problem.paragraphs.map((text) => (
                <p className="about-text" key={text}>
                  {text}
                </p>
              ))}
            </div>
          </div>
        </section>

        <section className="about-band about-band--soft" aria-labelledby="engine-title">
          <div className="wrap">
            <div className="about-head">
              <h2 className="t-h2" id="engine-title">
                {engine.title}
              </h2>
              <p>{engine.lead}</p>
            </div>

            {/* Схема: тонкая линия сверху вниз, на ней — узлы по числу шагов. */}
            <ol className="chain">
              {engine.steps.map((step) => (
                <li className="chain__step" key={step.title}>
                  <span className="chain__dot" aria-hidden="true" />
                  <span className="chain__title">{step.title}</span>
                  <span className="chain__note">{step.note}</span>
                </li>
              ))}
            </ol>
          </div>
        </section>

        <section className="about-band" aria-labelledby="principles-title">
          <div className="wrap">
            <div className="about-head">
              <h2 className="t-h2" id="principles-title">
                {principles.title}
              </h2>
            </div>

            <ul className="tenets">
              {principles.items.map((item) => (
                <li className="tenet" key={item.number}>
                  <span className="tenet__num">{item.number}</span>
                  <h3 className="tenet__title">{item.title}</h3>
                  <p className="tenet__text">{item.text}</p>
                </li>
              ))}
            </ul>
          </div>
        </section>

        <section className="about-band about-band--soft" aria-labelledby="personal-title">
          <div className="wrap">
            <div className="about-narrow">
              <h2 className="t-h2" id="personal-title">
                {personal.title}
              </h2>
              <p className="about-text about-text--lead">{personal.text}</p>
            </div>
          </div>
        </section>

        <section className="about-band" aria-labelledby="about-cta-title">
          <div className="wrap">
            <div className="about-narrow">
              <h2 className="t-h2" id="about-cta-title">
                {cta.title}
              </h2>
              <p className="about-text">{cta.lead}</p>
              <div className="about-cta__actions">
                <a className="btn btn--primary btn--lg" href={cta.primaryAction.href}>
                  {cta.primaryAction.label}
                </a>
                <a className="btn btn--secondary btn--lg" href={cta.secondaryAction.href}>
                  {cta.secondaryAction.label}
                </a>
              </div>
            </div>
          </div>
        </section>
      </main>

      <SiteFooter />
    </>
  );
}
