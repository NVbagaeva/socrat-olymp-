'use client';

import { clsx } from 'clsx';
import dynamic from 'next/dynamic';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { useRef, useState } from 'react';
import { Details } from '@/components/ui';
import { ZhivayaKartinka } from '@/components/tasks/shapka/ZhivayaKartinka';
import {
  HOWTO,
  type HowtoFeature,
  type HowtoSnimok,
  type HowtoTabContent,
} from '@/content/kakPolzovatsya';
import { howtoHref, type HowtoTab } from '@/content/onboarding';
import { requestIntro, startTour } from '@/lib/onboarding';
import { Kartinka, kartinkaSrc, snimokPut, type HowtoFaily } from './howto/Kartinka';
import { PriPoyavlenii } from './howto/PriPoyavlenii';
import { Put } from './howto/Put';
import { Video } from './howto/Video';
import '@/components/tasks/steklo/steklo.css';
import '@/components/tasks/shapka/shapka.css';
import './howto.css';

/* Тяжёлое — отдельными кусками: мини-задача (KaTeX, стили тренажёра),
   демо генератора и окно со снимком грузятся, когда понадобятся. */
const Proba = dynamic(() => import('./howto/Proba'), { ssr: false });
const GeneratorDemo = dynamic(() => import('./howto/GeneratorDemo'), { ssr: false });
const SnimokOkno = dynamic(() => import('./howto/SnimokOkno'), { ssr: false });

/** Вкладка по умолчанию, когда в адресе её нет. */
const DEFAULT_TAB: HowtoTab = 'repetitor';

function tabOf(value: string | null): HowtoTab {
  return value === 'uchenik' || value === 'repetitor' ? value : DEFAULT_TAB;
}

/** Страница с вкладкой из адреса: ?dlya=uchenik | repetitor. */
export function HowtoFromUrl({ faily }: { faily: HowtoFaily }) {
  const params = useSearchParams();
  return <HowtoView tab={tabOf(params.get('dlya'))} faily={faily} />;
}

/**
 * «Как пользоваться сайтом»: шапка как у разделов заданий (картинка в
 * стеклянном круге), видео с главами, путь по сайту со снимками,
 * мини-задача с подсказкой, возможности, частые вопросы и плашка с
 * главной кнопкой. Вкладка — ссылка: её можно отправить человеку.
 */
export function HowtoView({ tab, faily }: { tab: HowtoTab; faily: HowtoFaily }) {
  const content: HowtoTabContent = HOWTO[tab];
  const order: HowtoTab[] = ['uchenik', 'repetitor'];
  const shapka = kartinkaSrc(faily, 'shapka', 'shapka');
  const [okno, setOkno] = useState<{ id: HowtoSnimok; alt: string; knopka: HTMLElement } | null>(
    null,
  );

  return (
    <div className="howto">
      <header className={clsx('shapka howto-shapka', shapka === null && 'howto-shapka--tekst')}>
        <h1 className="t-h1 shapka__title">{HOWTO.title}</h1>
        <div className="shapka__text">
          <p className="shapka__lead">{HOWTO.lead}</p>
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
        </div>
        {shapka === null ? null : (
          <div className="shapka__media" data-ill="header">
            <div className="howto-krug">
              <ZhivayaKartinka
                src560={faily['/images/kak-polzovatsya/shapka-560.webp']!}
                src280={faily['/images/kak-polzovatsya/shapka-280.webp']!}
                alt={HOWTO.shapka.alt}
                label={HOWTO.shapka.alt}
                podskazka={HOWTO.shapka.podskazka}
                vid="nazhat"
                obyomnaya={false}
              />
            </div>
          </div>
        )}
      </header>

      {/* Смена вкладки — мягкое появление содержимого: блок ставится
          заново по key. */}
      <div className="howto__telo" key={tab}>
        <Video>
          <div className="howto__video-actions">
            {content.cta.tour !== undefined ? (
              <button type="button" className="btn btn--primary" onClick={() => startTour(tab, 0)}>
                {content.cta.tour}
              </button>
            ) : null}
            {/* Заставка первого визита ещё раз: показывается один раз
                сама, отсюда — сколько угодно. */}
            <button type="button" className="btn btn--secondary" onClick={requestIntro}>
              {HOWTO.intro}
            </button>
          </div>
        </Video>

        <Put title={content.stepsTitle} hint={content.stepsHint} steps={content.steps} faily={faily} />

        <PriPoyavlenii minHeight={420}>
          <Proba title={content.probaTitle} />
        </PriPoyavlenii>

        <section aria-labelledby="howto-features">
          <h2 className="howto__h howto__h--block" id="howto-features">
            {content.featuresTitle}
          </h2>
          <ul
            className={clsx(
              'howto__features',
              content.features.some((f) => f.demo !== undefined) && 'howto__features--demo',
            )}
          >
            {content.features.map((f) => (
              <Karta
                key={f.title}
                f={f}
                faily={faily}
                onSnimok={(knopka) =>
                  f.snimok === undefined ? undefined : setOkno({ ...f.snimok, knopka })
                }
              />
            ))}
            {content.features.some((f) => f.demo === 'generator') ? (
              <li className="howto__demo">
                <PriPoyavlenii minHeight={460}>
                  <GeneratorDemo faily={faily} />
                </PriPoyavlenii>
              </li>
            ) : null}
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
                {f.link === undefined ? null : (
                  <p className="howto__q-link">
                    <Link href={f.link.href}>{f.link.label}</Link>
                  </p>
                )}
              </Details>
            ))}
          </div>
        </section>

        <section className="howto__cta" aria-labelledby="howto-cta">
          <div className="howto__cta-tekst">
            <h2 className="howto__cta-title" id="howto-cta">
              {content.cta.title}
            </h2>
            <p className="howto__cta-text">{content.cta.text}</p>
          </div>
          <div className="howto__cta-actions">
            {content.cta.tour !== undefined ? (
              <button type="button" className="btn btn--secondary" onClick={() => startTour(tab, 0)}>
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
          <Kartinka
            faily={faily}
            id="start"
            razmer="karta"
            px={120}
            alt={HOWTO.start.alt}
            className="howto__cta-kart"
          />
        </section>
      </div>

      {okno === null || faily[snimokPut(okno.id)] === undefined ? null : (
        <SnimokOkno
          src={faily[snimokPut(okno.id)]!}
          alt={okno.alt}
          vozvrat={okno.knopka}
          onClose={() => setOkno(null)}
        />
      )}
    </div>
  );
}

/** Карточка возможности: картинка 96 px, текст и кнопка со снимком. */
function Karta({
  f,
  faily,
  onSnimok,
}: {
  f: HowtoFeature;
  faily: HowtoFaily;
  onSnimok: (knopka: HTMLElement) => void;
}) {
  const knopka = useRef<HTMLButtonElement>(null);
  const estSnimok = f.snimok !== undefined && faily[snimokPut(f.snimok.id)] !== undefined;
  return (
    <li className={clsx('howto__feature', f.demo !== undefined && 'howto__feature--demo')}>
      <Kartinka
        faily={faily}
        id={f.kartinka}
        razmer="karta"
        px={96}
        alt={f.kartinkaAlt}
        className="howto__feature-kart"
      />
      <h3 className="howto__feature-title">{f.title}</h3>
      <p className="howto__feature-text">{f.text}</p>
      {estSnimok ? (
        <button
          ref={knopka}
          type="button"
          className="howto__feature-snimok"
          onClick={() => {
            if (knopka.current !== null) onSnimok(knopka.current);
          }}
        >
          <svg viewBox="0 0 24 24" aria-hidden="true">
            <rect x="3" y="5" width="18" height="13" rx="2" />
            <path d="M8 21h8M12 18v3" />
          </svg>
          {HOWTO.snimok.knopka}
        </button>
      ) : null}
    </li>
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
