/**
 * Объекты Schema.org для JSON-LD (components/seo/JsonLd.tsx).
 *
 *   Organization и WebSite — на всех страницах (app/layout.tsx);
 *   Person — автор, страница «Об авторе»;
 *   BreadcrumbList — у каждой цепочки хлебных крошек (ui/Breadcrumbs);
 *   LearningResource — раздел задания (оболочки разделов);
 *   FAQPage — где на странице есть вопросы с ответами;
 *   Quiz — тренажёр с примерами задач (статический блок тренажёра).
 *
 * Здесь только то, что видно на странице: разметка описывает
 * страницу, а не добавляет к ней слов.
 */

import { absUrl, SITE_NAME, SITE_URL } from '@/lib/seo';
import { tekstBezTex } from '@/lib/tekstFormul';

const ORG_ID = `${SITE_URL}/#organization`;
const SITE_ID = `${SITE_URL}/#website`;
export const AVTOR_ID = `${SITE_URL}/about/#person`;

/** Telegram-канал платформы — тот же, что в подвале и на листах. */
const TELEGRAM = 'https://t.me/budet_na_ege_math';

export function organizationLd() {
  return {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    '@id': ORG_ID,
    name: SITE_NAME,
    url: `${SITE_URL}/`,
    logo: absUrl('/icon-512.png'),
    sameAs: [TELEGRAM],
    founder: { '@id': AVTOR_ID },
  };
}

export function websiteLd() {
  return {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    '@id': SITE_ID,
    name: SITE_NAME,
    url: `${SITE_URL}/`,
    inLanguage: 'ru',
    publisher: { '@id': ORG_ID },
  };
}

export interface AvtorLd {
  name: string;
  jobTitle: string;
  description: string;
  image?: string;
}

export function personLd({ name, jobTitle, description, image }: AvtorLd) {
  return {
    '@context': 'https://schema.org',
    '@type': 'Person',
    '@id': AVTOR_ID,
    name,
    jobTitle,
    description,
    url: absUrl('/about/'),
    ...(image === undefined ? {} : { image: absUrl(image) }),
    worksFor: { '@id': ORG_ID },
    knowsAbout: ['Математика', 'Подготовка к ЕГЭ по профильной математике'],
  };
}

export interface KroshkaLd {
  label: string;
  href?: string;
}

/**
 * Хлебные крошки: те же пункты, что на экране. Пункт без адреса —
 * текущая страница: адрес у него не обязателен.
 */
export function breadcrumbLd(items: readonly KroshkaLd[]) {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((item, i) => ({
      '@type': 'ListItem',
      position: i + 1,
      name: tekstBezTex(item.label),
      ...(item.href === undefined || item.href.startsWith('#') ? {} : { item: absUrl(item.href) }),
    })),
  };
}

export interface RazdelLd {
  /** Номер задания ЕГЭ. */
  no: number;
  name: string;
  description: string;
  /** Адрес раздела: /zadaniya/13/. */
  href: string;
  /** Чему учит раздел — темы задания. */
  teaches: readonly string[];
}

/** Раздел задания: учебный ресурс для 10–11 класса, бесплатный. */
export function learningResourceLd({ no, name, description, href, teaches }: RazdelLd) {
  return {
    '@context': 'https://schema.org',
    '@type': 'LearningResource',
    '@id': `${absUrl(href)}#razdel`,
    name,
    description,
    url: absUrl(href),
    inLanguage: 'ru',
    isAccessibleForFree: true,
    learningResourceType: ['теория', 'опорные задачи', 'тренажёр', 'генератор вариантов'],
    educationalLevel: '10–11 класс',
    educationalUse: 'подготовка к ЕГЭ',
    audience: { '@type': 'EducationalAudience', educationalRole: ['student', 'teacher'] },
    about: { '@type': 'Thing', name: `Задание ${no} ЕГЭ по профильной математике` },
    teaches: teaches.map((t) => tekstBezTex(t)),
    provider: { '@id': ORG_ID },
    isPartOf: { '@id': SITE_ID },
  };
}

export interface VoprosLd {
  q: string;
  a: string;
}

/** Вопросы и ответы, которые есть на странице текстом. */
export function faqLd(items: readonly VoprosLd[]) {
  return {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: items.map((item) => ({
      '@type': 'Question',
      name: tekstBezTex(item.q),
      acceptedAnswer: { '@type': 'Answer', text: tekstBezTex(item.a) },
    })),
  };
}

export interface PrimerLd {
  /** Условие задачи текстом (TeX в $…$ допустим). */
  uslovie: string;
}

/**
 * Тренажёр: набор задач, примеры которых видны на странице. Ответов в
 * разметке нет — их нет и на странице: ответ открывается после
 * попытки ученика.
 */
export function quizLd(name: string, href: string, no: number, primery: readonly PrimerLd[]) {
  return {
    '@context': 'https://schema.org',
    '@type': 'Quiz',
    name,
    url: absUrl(href),
    inLanguage: 'ru',
    isAccessibleForFree: true,
    educationalLevel: '10–11 класс',
    about: { '@type': 'Thing', name: `Задание ${no} ЕГЭ по профильной математике` },
    provider: { '@id': ORG_ID },
    hasPart: primery.map((p) => ({
      '@type': 'Question',
      eduQuestionType: 'Short answer',
      text: tekstBezTex(p.uslovie),
    })),
  };
}
