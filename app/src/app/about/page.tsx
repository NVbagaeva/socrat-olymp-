import { clsx } from 'clsx';
import type { CSSProperties } from 'react';
import type { Metadata } from 'next';
import { ogStranicy } from '@/lib/og';
import { SiteFooter, SiteHeader } from '@/components/layout';
import { Illustration } from '@/components/ui/Illustration';
import { about, type Illyustraciya, type Nadpis } from '@/content/about';
import { Dvizhenie } from './Dvizhenie';
import { Stsena } from './Stsena';
import './about.css';

export const metadata: Metadata = {
  title: about.meta.title,
  description: about.meta.description,
  openGraph: ogStranicy(about.meta.title, about.meta.description),
};

const { hero, imya, podhod, put, sajt, polza, prizyv, svyaz } = about;

/* Рукописная пометка на «бумажке»: тёплый лист с наклоном и тенью.
   Наклон задаёт модификатор — у каждой записки свой. */
function Zapiska({ nadpis, className }: { nadpis: Nadpis; className?: string }) {
  return (
    <div className={clsx('oa-zapiska', className)}>
      <img
        src={nadpis.src}
        alt={nadpis.alt}
        width={nadpis.width}
        height={nadpis.height}
        loading="lazy"
        decoding="async"
      />
    </div>
  );
}

/* Декоративная картинка: WebP с PNG-фолбэком, размеры заданы заранее. */
function Kartinka({
  ill,
  className,
  sizes,
}: {
  ill: Illyustraciya;
  className: string;
  sizes: string;
}) {
  return (
    <picture className={className}>
      <source
        type="image/webp"
        srcSet={`${ill.webp} ${ill.width}w, ${ill.webp2x} ${ill.width * 2}w`}
        sizes={sizes}
      />
      <img
        src={ill.png}
        alt=""
        aria-hidden="true"
        width={ill.width}
        height={ill.height}
        loading="lazy"
        decoding="async"
      />
    </picture>
  );
}

function Shapka({ metka, title, id }: { metka: string; title: string; id: string }) {
  return (
    <header className="oa-shapka">
      <p className="oa-kicker">{metka}</p>
      <h2 className="oa-h2" id={id}>
        {title}
      </h2>
    </header>
  );
}

/* Порядковый номер для каскада появления (--i в about.css). */
const poryadok = (i: number) => ({ '--i': i }) as CSSProperties;

/* Порядок блоков — как рассказ: кто я → как я учу → путь → о сайте →
   чем могу быть полезна → призыв и контакты. У каждого блока своя
   композиция, чтобы ритм не повторялся. */
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

      <main className="oa-main">
        {/* ── 1. Первый экран ─────────────────────────────────── */}
        <section className="oa-hero" aria-labelledby="oa-imya">
          <div className="oa-wrap oa-hero__grid">
            <Stsena>
              <img
                className="oa-foto"
                src={hero.photo.src}
                srcSet={hero.photo.srcSet}
                sizes="(max-width: 767px) 220px, 340px"
                alt={hero.photo.alt}
                width={hero.photo.width}
                height={hero.photo.height}
                fetchPriority="high"
                decoding="async"
              />
            </Stsena>
            <div className="oa-hero__text">
              <p className="oa-kicker">{hero.eyebrow}</p>
              {/* Единственный h1 страницы — имя, в две строки. */}
              <h1 className="oa-imya" id="oa-imya">
                <span>{imya.familiya}</span>{' '}
                <span>
                  {imya.imya} {imya.otchestvo}
                </span>
              </h1>
              <p className="oa-rol">{hero.rol}</p>
              <ul className="oa-hero__fakty">
                {hero.fakty.map((fakt) => (
                  <li key={fakt.glavnoe}>
                    <b>{fakt.glavnoe}</b>
                    <span>{fakt.podpis}</span>
                  </li>
                ))}
              </ul>
              <div className="oa-knopki">
                <a className="btn btn--primary btn--lg" href={hero.actions.glavnaya.href}>
                  {hero.actions.glavnaya.label}
                </a>
                <a className="btn btn--secondary btn--lg" href={hero.actions.vtoraya.href}>
                  {hero.actions.vtoraya.label}
                </a>
              </div>
            </div>
          </div>
        </section>

        {/* ── 2. Как я учу: сетка принципов, записка на углу ──── */}
        <section className="oa-sec oa-podhod" aria-labelledby="oa-podhod">
          <div className="oa-wrap">
            <div data-reveal>
              <Shapka metka={podhod.metka} title={podhod.title} id="oa-podhod" />
            </div>
            <div className="oa-podhod__pole">
              <Zapiska nadpis={podhod.nadpis} className="oa-zapiska--ugol" />
              <ol className="oa-printsipy">
                {podhod.printsipy.map((p, i) => (
                  <li key={p.title} data-reveal style={poryadok(i)}>
                    <span className="oa-printsipy__num" aria-hidden="true">
                      {String(i + 1).padStart(2, '0')}
                    </span>
                    <h3 className="oa-h3">{p.title}</h3>
                    <p>{p.text}</p>
                  </li>
                ))}
              </ol>
            </div>
          </div>
        </section>

        {/* ── 3. Путь: бейджи, лента этапов, записка-итог ─────── */}
        <section className="oa-sec oa-put-sec" aria-labelledby="oa-put">
          <div className="oa-wrap oa-put-sec__grid">
            <div className="oa-put-sec__intro" data-reveal>
              <Shapka metka={put.metka} title={put.title} id="oa-put" />
              <p className="oa-text">{put.lead}</p>
              <ul className="oa-beydzhi" aria-label="Коротко">
                {put.fakty.map((fakt) => (
                  <li key={fakt}>{fakt}</li>
                ))}
              </ul>
            </div>
            <div className="oa-put-sec__lenta">
              <ol className="oa-put">
                {put.points.map((point, i) => (
                  <li
                    className={point.parallel ? 'oa-put__parallel' : undefined}
                    key={point.place}
                    data-reveal
                    style={poryadok(i % 3)}
                  >
                    <span className="oa-put__god">{point.period}</span>
                    <h3 className="oa-put__mesto">{point.place}</h3>
                    {point.note ? <p className="oa-put__chto">{point.note}</p> : null}
                  </li>
                ))}
              </ol>
              <div className="oa-put__itog" data-reveal>
                <Zapiska nadpis={put.nadpis} className="oa-zapiska--itog" />
              </div>
            </div>
          </div>
        </section>

        {/* ── 4. О сайте ─────────────────────────────────────── */}
        <section className="oa-sec" aria-labelledby="oa-sajt">
          <div className="oa-wrap oa-sajt">
            <div className="oa-sajt__text" data-reveal>
              <Shapka metka={sajt.metka} title={sajt.title} id="oa-sajt" />
              <p className="oa-lead">{sajt.lead}</p>
              {sajt.paragraphs.map((text) => (
                <p className="oa-text" key={text}>
                  {text}
                </p>
              ))}
            </div>
            <figure className="oa-sajt__ill" data-reveal>
              <Illustration
                variant="section"
                src={sajt.illyustraciya.png}
                sources={[
                  {
                    type: 'image/webp',
                    srcSet: `${sajt.illyustraciya.webp400} 400w, ${sajt.illyustraciya.webp800} 800w`,
                  },
                ]}
                width={sajt.illyustraciya.width}
                height={sajt.illyustraciya.height}
              />
            </figure>
            <ol className="oa-plyusy">
              {sajt.items.map((item, i) => (
                <li key={item.number} data-reveal style={poryadok(i)}>
                  <span className="oa-printsipy__num" aria-hidden="true">
                    {item.number}
                  </span>
                  <h3 className="oa-h3">{item.title}</h3>
                  <p>{item.text}</p>
                </li>
              ))}
            </ol>
            <div className="oa-steklo oa-sajt__engine" data-reveal>
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
            <div className="oa-sajt__lichno" data-reveal>
              <h3 className="oa-h3 oa-h3--big">{sajt.personal.title}</h3>
              <p className="oa-text">{sajt.personal.text}</p>
            </div>
          </div>
        </section>

        {/* ── 5. Чем могу быть полезна ───────────────────────── */}
        <section className="oa-sec" aria-labelledby="oa-polza">
          <div className="oa-wrap">
            <div data-reveal>
              <Shapka metka={polza.metka} title={polza.title} id="oa-polza" />
            </div>
            <div className="oa-polza">
              {polza.karty.map((karta, i) => (
                <article
                  className={clsx(
                    'oa-steklo',
                    'oa-polza__karta',
                    karta.glavnaya && 'oa-steklo--teplo',
                  )}
                  key={karta.komu}
                  data-reveal
                  style={poryadok(i)}
                >
                  <Kartinka
                    ill={karta.illyustraciya}
                    className="oa-polza__ill"
                    sizes="(max-width: 639px) 120px, 160px"
                  />
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

        {/* ── 6. Призыв и контакты ───────────────────────────── */}
        <section className="oa-sec oa-final" aria-labelledby="oa-svyaz">
          <div className="oa-wrap">
            <div className="oa-final__plita" data-reveal>
              <figure className="oa-final__citata">
                <blockquote>
                  <p>{prizyv.citata}</p>
                </blockquote>
                <figcaption>— {prizyv.podpis}</figcaption>
              </figure>
              <a className="btn btn--primary btn--lg" href={prizyv.action.href}>
                {prizyv.action.label}
              </a>
            </div>
            <div className="oa-svyaz-blok" data-reveal>
              <div>
                <p className="oa-kicker">{svyaz.metka}</p>
                <h2 className="oa-h2 oa-h2--small" id="oa-svyaz">
                  {svyaz.title}
                </h2>
              </div>
              <div className="oa-svyaz">
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
              <Zapiska nadpis={svyaz.nadpis} className="oa-zapiska--svyaz" />
            </div>
          </div>
        </section>
      </main>

      <SiteFooter className="site-foot--steklo" />
    </div>
  );
}
