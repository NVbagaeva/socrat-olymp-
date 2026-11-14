import { clsx } from 'clsx';
import type { Metadata } from 'next';
import { SiteFooter, SiteHeader } from '@/components/layout';
import { about, type Nadpis } from '@/content/about';
import { Dvizhenie } from './Dvizhenie';
import { Stsena } from './Stsena';
import './about.css';

export const metadata: Metadata = {
  title: about.meta.title,
  description: about.meta.description,
};

const { hero, imya, podhod, put, sajt, polza, svyaz } = about;

/* Рукописная пометка на поле рядом со своим блоком. */
function Pometka({ nadpis }: { nadpis: Nadpis }) {
  return (
    <img
      className="oa-pometka"
      src={nadpis.src}
      alt={nadpis.alt}
      width={nadpis.width}
      height={nadpis.height}
      loading="lazy"
      decoding="async"
    />
  );
}

function Shapka({ metka, title, id }: { metka: string; title: string; id: string }) {
  return (
    <header className="oa-sec__head">
      <p className="oa-kicker">{metka}</p>
      <h2 className="oa-h2" id={id}>
        {title}
      </h2>
    </header>
  );
}

/* Порядок блоков — как рассказ: кто я → как я учу → образование и опыт →
   о сайте → чем могу быть полезна → как связаться. Сетка — 12 колонок в
   том же контейнере, что шапка сайта. */
export default function AboutPage() {
  return (
    <div className="oa">
      {/* Тот же SiteHeader, что и везде; currentHref подсвечивает пункт меню. */}
      <SiteHeader className="site-head--steklo" currentHref="/about/" />
      <Dvizhenie />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(about.person) }}
      />

      <main>
        <section className="oa-hero" aria-labelledby="oa-imya">
          {/* Декор: формулы набраны обычным текстом, без KaTeX, поэтому
              поддерево помечено no-math-check (scripts/check-math-markup.mjs). */}
          <div className="oa-fon no-math-check" aria-hidden="true">
            {hero.formuly.map((formula) => (
              <span className="oa-fon__f" key={formula}>
                {formula}
              </span>
            ))}
          </div>
          <div className="oa-wrap oa-hero__grid">
            <div className="oa-hero__text">
              <p className="oa-kicker">{hero.eyebrow}</p>
              {/* Единственный h1 страницы — имя. На телефоне оно встаёт в три строки. */}
              <h1 className="oa-imya" id="oa-imya">
                <span>{imya.familiya}</span>{' '}
                <span className="oa-imya__io">
                  <span>{imya.imya}</span> <span>{imya.otchestvo}</span>
                </span>
              </h1>
              <p className="oa-kto">{hero.lead}</p>
            </div>
            <Stsena>
              <img
                className="oa-foto"
                src={hero.photo.src}
                srcSet={hero.photo.srcSet}
                sizes={hero.photo.sizes}
                alt={hero.photo.alt}
                width={hero.photo.width}
                height={hero.photo.height}
                fetchPriority="high"
                decoding="async"
              />
            </Stsena>
          </div>
        </section>

        <section className="oa-sec" aria-labelledby="oa-podhod" data-reveal>
          <div className="oa-wrap oa-sec__grid">
            <Shapka metka={podhod.metka} title={podhod.title} id="oa-podhod" />
            <aside className="oa-sec__side">
              <Pometka nadpis={podhod.nadpis} />
            </aside>
            <div className="oa-sec__body">
              <p className="oa-lead">{podhod.lead}</p>
              <ol className="oa-printsipy">
                {podhod.items.map((item) => (
                  <li key={item.number}>
                    <span className="oa-printsipy__num" aria-hidden="true">
                      {item.number}
                    </span>
                    <h3 className="oa-h3">{item.title}</h3>
                    <p>{item.text}</p>
                  </li>
                ))}
              </ol>
            </div>
          </div>
        </section>

        <section className="oa-sec" aria-labelledby="oa-put" data-reveal>
          <div className="oa-wrap oa-sec__grid">
            <Shapka metka={put.metka} title={put.title} id="oa-put" />
            <aside className="oa-sec__side">
              <Pometka nadpis={put.nadpis} />
            </aside>
            <div className="oa-sec__body">
              <p className="oa-lead">{put.lead}</p>
              <ul className="oa-fakty">
                {put.fakty.map((fakt) => (
                  <li key={fakt}>{fakt}</li>
                ))}
              </ul>
              <p className="oa-text">{put.obrazovanie}</p>
              {/* Вертикальная линия времени; «параллельно» — пунктирная точка. */}
              <ol className="oa-put">
                {put.points.map((point) => (
                  <li className={point.parallel ? 'oa-put__parallel' : undefined} key={point.place}>
                    <span className="oa-put__god">{point.period}</span>
                    <span className="oa-put__mesto">{point.place}</span>
                    {point.note ? <span className="oa-put__chto">{point.note}</span> : null}
                  </li>
                ))}
              </ol>
            </div>
          </div>
        </section>

        <section className="oa-sec" aria-labelledby="oa-sajt" data-reveal>
          <div className="oa-wrap oa-sec__grid">
            <Shapka metka={sajt.metka} title={sajt.title} id="oa-sajt" />
            <aside className="oa-sec__side">
              <Pometka nadpis={sajt.nadpis} />
            </aside>
            <div className="oa-sec__body">
              <p className="oa-lead">{sajt.lead}</p>
              {sajt.paragraphs.map((text) => (
                <p className="oa-text" key={text}>
                  {text}
                </p>
              ))}
            </div>
            {/* Единственная стеклянная плита секции. */}
            <div className="oa-sec__wide oa-steklo">
              <h3 className="oa-h3 oa-h3--big">{sajt.engine.title}</h3>
              <p className="oa-text">{sajt.engine.lead}</p>
              <ol className="oa-tsep">
                {sajt.engine.steps.map((step) => (
                  <li key={step.title}>
                    <b>{step.title}</b>
                    <span>{step.note}</span>
                  </li>
                ))}
              </ol>
            </div>
            <div className="oa-sec__body oa-sec__body--after">
              <h3 className="oa-h3 oa-h3--big">{sajt.personal.title}</h3>
              <p className="oa-text">{sajt.personal.text}</p>
            </div>
          </div>
        </section>

        <section className="oa-sec" aria-labelledby="oa-polza" data-reveal>
          <div className="oa-wrap oa-sec__grid">
            <Shapka metka={polza.metka} title={polza.title} id="oa-polza" />
            <div className="oa-sec__wide oa-polza">
              {polza.karty.map((karta) => (
                <article
                  className={clsx(
                    'oa-steklo',
                    'oa-polza__karta',
                    karta.glavnaya && 'oa-steklo--teplo',
                  )}
                  key={karta.komu}
                >
                  <h3 className="oa-h3 oa-h3--big">{karta.komu}</h3>
                  <p className="oa-text">{karta.text}</p>
                  <a
                    className={clsx(
                      'btn',
                      'btn--lg',
                      karta.glavnaya ? 'btn--primary' : 'btn--secondary',
                    )}
                    href={karta.action.href}
                  >
                    {karta.action.label}
                  </a>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section className="oa-sec" aria-labelledby="oa-svyaz" data-reveal>
          <div className="oa-wrap oa-sec__grid">
            <Shapka metka={svyaz.metka} title={svyaz.title} id="oa-svyaz" />
            <aside className="oa-sec__side">
              <Pometka nadpis={svyaz.nadpis} />
            </aside>
            <div className="oa-sec__body oa-svyaz">
              {svyaz.kontakty.map((kontakt) => (
                <a
                  className="oa-svyaz__link"
                  href={kontakt.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  key={kontakt.href}
                >
                  <span>{kontakt.label}</span>
                  <span className="oa-svyaz__adres">{kontakt.adres}</span>
                </a>
              ))}
            </div>
          </div>
        </section>
      </main>

      <SiteFooter className="site-foot--steklo" />
    </div>
  );
}
