'use client';

import { clsx } from 'clsx';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { Details } from '@/components/ui';
import { HOWTO, type HowtoTabContent } from '@/content/kakPolzovatsya';
import { howtoHref, type HowtoTab } from '@/content/onboarding';
import { startTour } from '@/lib/onboarding';
import './howto.css';

/** Вкладка по умолчанию, когда в адресе её нет. */
const DEFAULT_TAB: HowtoTab = 'repetitor';

function tabOf(value: string | null): HowtoTab {
  return value === 'uchenik' || value === 'repetitor' ? value : DEFAULT_TAB;
}

/** Страница с вкладкой из адреса: ?dlya=uchenik | repetitor. */
export function HowtoFromUrl() {
  const params = useSearchParams();
  return <HowtoView tab={tabOf(params.get('dlya'))} />;
}

/**
 * «Как пользоваться сайтом»: переключатель «Ученику | Репетитору»,
 * место под видео, шаги, возможности, частые вопросы и плашка с
 * главной кнопкой. Вкладка — ссылка: её можно отправить человеку.
 */
export function HowtoView({ tab }: { tab: HowtoTab }) {
  const content: HowtoTabContent = HOWTO[tab];
  const order: HowtoTab[] = ['uchenik', 'repetitor'];

  return (
    <div className="howto">
      <header className="howto__head">
        <div>
          <h1 className="t-h1">{HOWTO.title}</h1>
          <p className="howto__lead">{HOWTO.lead}</p>
        </div>
        <nav className="howto__tabs" aria-label={HOWTO.tabsLabel}>
          {order.map((t) => (
            <Link
              key={t}
              href={howtoHref(t)}
              scroll={false}
              replace
              className={clsx('howto__tab', t === tab && 'is-active')}
              aria-current={t === tab ? 'page' : undefined}
            >
              <span className="howto__tab-ico" aria-hidden="true">
                {t === 'uchenik' ? <CapIcon /> : <PeopleIcon />}
              </span>
              {HOWTO[t].tab}
            </Link>
          ))}
        </nav>
      </header>

      <div className="howto__top">
        {/* Видео пока нет: спокойная заглушка, без кнопки воспроизведения. */}
        <section className="howto__video" aria-labelledby="howto-video">
          <span className="badge badge--info">{HOWTO.videoSoon}</span>
          <h2 className="howto__video-title" id="howto-video">
            {content.video.title}
          </h2>
          <p className="howto__video-text">{content.video.text}</p>
          {content.cta.tour !== undefined ? (
            <button
              type="button"
              className="btn btn--primary"
              onClick={() => startTour('repetitor', 0)}
            >
              {content.cta.tour}
            </button>
          ) : null}
        </section>

        <section className="howto__steps" aria-labelledby="howto-steps">
          <h2 className="howto__h" id="howto-steps">
            {content.stepsTitle}
          </h2>
          <ol>
            {content.steps.map((s, i) => (
              <li key={s.title} className="howto__step">
                <span className="howto__step-no" aria-hidden="true">
                  {i + 1}
                </span>
                <span>
                  <span className="howto__step-title">{s.title}</span>
                  <span className="howto__step-text">{s.text}</span>
                </span>
              </li>
            ))}
          </ol>
        </section>
      </div>

      <section aria-labelledby="howto-features">
        <h2 className="howto__h howto__h--block" id="howto-features">
          {content.featuresTitle}
        </h2>
        <ul className="howto__features">
          {content.features.map((f) => (
            <li key={f.title} className="howto__feature">
              {f.image !== undefined ? (
                <img
                  className="howto__shot"
                  src={f.image.src}
                  alt={f.image.alt}
                  width={f.image.width}
                  height={f.image.height}
                  loading="lazy"
                  decoding="async"
                />
              ) : null}
              <h3 className="howto__feature-title">{f.title}</h3>
              <p className="howto__feature-text">{f.text}</p>
            </li>
          ))}
        </ul>
      </section>

      <section aria-labelledby="howto-faq">
        <h2 className="howto__h howto__h--block" id="howto-faq">
          {content.faqTitle}
        </h2>
        <div className="howto__faq">
          {content.faq.map((f) => (
            <Details key={f.q} title={f.q} className="howto__q">
              <p>{f.a}</p>
            </Details>
          ))}
        </div>
      </section>

      <section className="howto__cta" aria-labelledby="howto-cta">
        <div>
          <h2 className="howto__cta-title" id="howto-cta">
            {content.cta.title}
          </h2>
          <p className="howto__cta-text">{content.cta.text}</p>
        </div>
        <div className="howto__cta-actions">
          {content.cta.tour !== undefined ? (
            <button
              type="button"
              className="btn btn--secondary"
              onClick={() => startTour('repetitor', 0)}
            >
              {content.cta.tour}
            </button>
          ) : null}
          <div className="howto__cta-main">
            <Link className="btn howto__accent" href={content.cta.primary.href}>
              {content.cta.primary.label} →
            </Link>
            {content.cta.note !== undefined ? (
              <p className="howto__cta-note">{content.cta.note}</p>
            ) : null}
          </div>
        </div>
      </section>
    </div>
  );
}

function CapIcon() {
  return (
    <svg viewBox="0 0 24 24">
      <path d="M2.5 9.5 12 5l9.5 4.5L12 14z" />
      <path d="M6.5 11.5v4c1.5 1.5 3.4 2.2 5.5 2.2s4-.7 5.5-2.2v-4M21.5 9.5v5" />
    </svg>
  );
}

function PeopleIcon() {
  return (
    <svg viewBox="0 0 24 24">
      <circle cx="9" cy="8" r="3.2" />
      <path d="M3 19c.6-3.3 3-5.2 6-5.2s5.4 1.9 6 5.2" />
      <circle cx="17" cy="9" r="2.4" />
      <path d="M16.5 13.9c2.4.2 4.1 1.8 4.5 4.6" />
    </svg>
  );
}
