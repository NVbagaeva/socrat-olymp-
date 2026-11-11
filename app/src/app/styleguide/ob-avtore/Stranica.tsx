import { SiteFooter, SiteHeader } from '@/components/layout';
import { Dvizhenie } from './Dvizhenie';
import { Stsena } from './Stsena';
import { BLOKI, BYUST, FOTO, IMYA, KTO_YA, NADPISI, type Nadpis } from './teksty';
import './ob-avtore.css';

/* Два варианта композиции «Об авторе» на одних и тех же блоках.
   Разметка блоков общая; варианты различаются первым экраном и сеткой
   (ob-avtore.css, .oa--portret и .oa--razvorot). */

export type Vid = 'portret' | 'razvorot';

function Pometka({ nadpis, className = '' }: { nadpis: Nadpis; className?: string }) {
  return (
    <img
      className={`oa-pometka ${className}`}
      src={nadpis.src}
      alt={nadpis.alt}
      width={nadpis.width}
      height={nadpis.height}
      loading="lazy"
      decoding="async"
    />
  );
}

function Todo({ children }: { children: string }) {
  return <p className="oa-todo">{children}</p>;
}

function Shapka({
  nomer,
  metka,
  title,
  id,
}: {
  nomer: string;
  metka: string;
  title: string;
  id: string;
}) {
  return (
    <header className="oa-sec__head">
      <span className="oa-sec__num" aria-hidden="true">
        {nomer}
      </span>
      <p className="oa-kicker">{metka}</p>
      <h2 className="oa-h2" id={id}>
        {title}
      </h2>
    </header>
  );
}

function Foto({ sizes }: { sizes: string }) {
  return (
    <img
      className="oa-foto"
      src={FOTO.src}
      srcSet={FOTO.srcSet}
      sizes={sizes}
      alt={FOTO.alt}
      width={FOTO.width}
      height={FOTO.height}
      fetchPriority="high"
      decoding="async"
    />
  );
}

/* Фоновые надписи первого экрана: школьные формулы крупным курсивом,
   едва заметные. Это декор — от скринридера скрыты. */
const FON = [
  'f(x) = ax² + bx + c',
  'a² + b² = c²',
  'D = b² − 4ac',
  '(a + b)² = a² + 2ab + b²',
  'y = kx + b',
];

function Fon() {
  return (
    <div className="oa-fon" aria-hidden="true">
      {FON.map((formula, index) => (
        <span className={`oa-fon__f oa-fon__f--${index + 1}`} key={formula}>
          {formula}
        </span>
      ))}
    </div>
  );
}

function HeroPortret() {
  return (
    <section className="oa-hero oa-hero--portret" aria-labelledby="oa-imya">
      <Fon />
      <div className="oa-wrap oa-hero__grid">
        <div className="oa-hero__text">
          <p className="oa-kicker">Об авторе</p>
          <h1 className="oa-imya" id="oa-imya">
            <span>{IMYA.familiya}</span>{' '}
            <span className="oa-imya__io">
              <span>{IMYA.imya}</span> <span>{IMYA.otchestvo}</span>
            </span>
          </h1>
          <p className="oa-kto">{KTO_YA}</p>
        </div>
        <Stsena>
          <Foto sizes="(max-width: 899px) 62vw, 400px" />
        </Stsena>
      </div>
    </section>
  );
}

function HeroRazvorot() {
  return (
    <section className="oa-hero oa-hero--razvorot" aria-labelledby="oa-imya">
      <Fon />
      <div className="oa-wrap oa-hero__grid">
        <p className="oa-hero__rubrika">
          <span>Об авторе</span>
          <span>Будет на ЕГЭ</span>
        </p>
        <h1 className="oa-imya" id="oa-imya">
          <span className="oa-imya__familiya">{IMYA.familiya}</span>{' '}
          <span className="oa-imya__imya">
            {IMYA.imya}&nbsp;{IMYA.otchestvo}
          </span>
        </h1>
        <p className="oa-kto">{KTO_YA}</p>
        <Stsena>
          <Foto sizes="(max-width: 899px) 62vw, 400px" />
        </Stsena>
      </div>
    </section>
  );
}

export function Stranica({ vid }: { vid: Vid }) {
  const { podhod, put, sajt, polza, svyaz } = BLOKI;

  return (
    <div className={`oa oa--${vid}`}>
      <SiteHeader className="site-head--steklo" currentHref="/about/" />
      <Dvizhenie />

      <main>
        {vid === 'portret' ? <HeroPortret /> : <HeroRazvorot />}

        {/* 02 — как я учу */}
        <section className="oa-sec" aria-labelledby="oa-podhod" data-reveal>
          <div className="oa-wrap oa-sec__grid">
            <Shapka nomer="02" metka={podhod.metka} title={podhod.title} id="oa-podhod" />
            <aside className="oa-sec__side">
              <Pometka nadpis={NADPISI.znaniya} />
            </aside>
            <div className="oa-sec__body">
              <Todo>{podhod.todo}</Todo>
              <ol className="oa-printsipy">
                {podhod.items.map((item) => (
                  <li key={item.number}>
                    <span className="oa-printsipy__num">{item.number}</span>
                    <h3 className="oa-h3">{item.title}</h3>
                    <p>{item.text}</p>
                  </li>
                ))}
              </ol>
            </div>
          </div>
        </section>

        {/* 03 — образование и опыт: бюст стоит здесь, рядом своя пометка */}
        <section className="oa-sec oa-sec--put" aria-labelledby="oa-put" data-reveal>
          <div className="oa-wrap oa-sec__grid">
            <Shapka nomer="03" metka={put.metka} title={put.title} id="oa-put" />
            <aside className="oa-sec__side oa-sec__side--byust">
              <span className="oa-byust">
                <img
                  data-parallax
                  src={BYUST.src}
                  alt={BYUST.alt}
                  width={BYUST.width}
                  height={BYUST.height}
                  loading="lazy"
                  decoding="async"
                />
              </span>
              <Pometka nadpis={NADPISI.opyt} />
            </aside>
            <div className="oa-sec__body">
              <p className="oa-lead">{put.lead}</p>
              <Todo>{put.todo}</Todo>
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

        {/* 04 — о сайте и зачем он */}
        <section className="oa-sec" aria-labelledby="oa-sajt" data-reveal>
          <div className="oa-wrap oa-sec__grid">
            <Shapka nomer="04" metka={sajt.metka} title={sajt.title} id="oa-sajt" />
            <aside className="oa-sec__side">
              <Pometka nadpis={NADPISI.prototipy} />
            </aside>
            <div className="oa-sec__body">
              <p className="oa-lead">{sajt.paragraphs[0]}</p>
              {sajt.paragraphs.slice(1).map((text) => (
                <p className="oa-text" key={text}>
                  {text}
                </p>
              ))}
            </div>
            <div className="oa-sec__wide oa-steklo oa-dvizhok">
              <div className="oa-dvizhok__head">
                <h3 className="oa-h3 oa-h3--big">{sajt.engine.title}</h3>
                <p className="oa-text">{sajt.engine.lead}</p>
                <Pometka nadpis={NADPISI.grafik} className="oa-dvizhok__grafik" />
              </div>
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

        {/* 05 — чем могу быть полезна */}
        <section className="oa-sec" aria-labelledby="oa-polza" data-reveal>
          <div className="oa-wrap oa-sec__grid">
            <Shapka nomer="05" metka={polza.metka} title={polza.title} id="oa-polza" />
            <div className="oa-sec__wide oa-polza">
              <article className="oa-steklo oa-steklo--teplo oa-polza__karta">
                <h3 className="oa-h3 oa-h3--big">{polza.ucheniku.komu}</h3>
                <Todo>{polza.ucheniku.todo}</Todo>
                <a className="btn btn--primary btn--lg" href={polza.ucheniku.action.href}>
                  {polza.ucheniku.action.label}
                </a>
              </article>
              <article className="oa-steklo oa-polza__karta">
                <h3 className="oa-h3 oa-h3--big">{polza.uchitelyu.komu}</h3>
                <p className="oa-text">{polza.uchitelyu.text}</p>
                <a className="btn btn--secondary btn--lg" href={polza.uchitelyu.action.href}>
                  {polza.uchitelyu.action.label}
                </a>
              </article>
            </div>
          </div>
        </section>

        {/* 06 — как связаться */}
        <section className="oa-sec oa-sec--svyaz" aria-labelledby="oa-svyaz" data-reveal>
          <div className="oa-wrap oa-sec__grid">
            <Shapka nomer="06" metka={svyaz.metka} title={svyaz.title} id="oa-svyaz" />
            <aside className="oa-sec__side">
              <Pometka nadpis={NADPISI.vmeste} />
            </aside>
            <div className="oa-sec__body">
              <a
                className="oa-svyaz__link"
                href={svyaz.telegram.href}
                target="_blank"
                rel="noopener noreferrer"
              >
                {svyaz.telegram.label}
              </a>
              <Todo>{svyaz.todo}</Todo>
            </div>
          </div>
        </section>
      </main>

      <SiteFooter className="site-foot--steklo" />
    </div>
  );
}
