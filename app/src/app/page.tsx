import type { Metadata } from 'next';
import { SiteFooter, SiteHeader } from '@/components/layout';
import {
  BankSection,
  CtaSection,
  DiagnosticsSection,
  HeroSection,
  HowSection,
  PathSection,
  TeachersSection,
} from '@/components/landing';
import { landing } from '@/content/landing';
import { tasksPage } from '@/content/tasks';
import { SITE_DOMAIN, SITE_NAME, SITE_URL } from '@/lib/seo';
import './landing.css';

export const metadata: Metadata = {
  title: landing.meta.title,
  description: landing.meta.description,
};

/**
 * Разметка Schema.org главной: организация, сайт и сама страница.
 *
 * Только то, что есть на самом деле: название, домен, логотип,
 * описание. Отзывов, рейтингов, цен и чужих профилей здесь нет —
 * поисковик не должен получать данных, которых нет на сайте.
 */
const ORGANIZATION_ID = `${SITE_URL}/#organization`;
const WEBSITE_ID = `${SITE_URL}/#website`;

const structuredData = {
  '@context': 'https://schema.org',
  '@graph': [
    {
      '@type': 'Organization',
      '@id': ORGANIZATION_ID,
      name: SITE_NAME,
      alternateName: SITE_DOMAIN,
      url: `${SITE_URL}/`,
      logo: {
        '@type': 'ImageObject',
        url: `${SITE_URL}/icon-512.png`,
        width: 512,
        height: 512,
      },
      description: landing.meta.description,
    },
    {
      '@type': 'WebSite',
      '@id': WEBSITE_ID,
      name: SITE_NAME,
      alternateName: [SITE_DOMAIN, 'Будет на ЕГЭ — математика'],
      url: `${SITE_URL}/`,
      inLanguage: 'ru-RU',
      description: landing.meta.description,
      publisher: { '@id': ORGANIZATION_ID },
    },
    {
      '@type': 'WebPage',
      '@id': `${SITE_URL}/#webpage`,
      url: `${SITE_URL}/`,
      name: landing.meta.title,
      description: landing.meta.description,
      inLanguage: 'ru-RU',
      isPartOf: { '@id': WEBSITE_ID },
      about: { '@id': ORGANIZATION_ID },
      /* Главная ведёт в банк заданий: поисковику полезно знать,
         что это раздел того же сайта. */
      hasPart: {
        '@type': 'WebPage',
        url: `${SITE_URL}${tasksPage.href}`,
        name: 'Банк заданий ЕГЭ по профильной математике',
      },
    },
  ],
};

export default function HomePage() {
  return (
    <>
      <script
        type="application/ld+json"
        /* JSON.stringify: данные выше постоянные, пользовательского
           ввода в них нет. Знак «<» экранируется на всякий случай. */
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(structuredData).replace(/</g, '\\u003c'),
        }}
      />
      <SiteHeader />
      <main>
        <HeroSection />
        <HowSection />
        <DiagnosticsSection />
        <PathSection />
        <BankSection />
        <TeachersSection />
        <CtaSection />
      </main>
      <SiteFooter />
    </>
  );
}
