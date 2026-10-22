/**
 * Тексты и ссылки общей оболочки сайта: шапка и подвал.
 * Отдельно от лендинга — их используют все публичные страницы.
 * Меняется здесь, в разметке текста нет.
 */

import { legalDocs } from '@/content/legal/documents';
import { tasksPage } from '@/content/tasks';

export interface SiteLink {
  label: string;
  href: string;
}

export const site = {
  brand: 'Будет на ЕГЭ',

  /** Первый пункт — отдельная страница; остальные пока якоря лендинга. */
  nav: [
    { label: 'Об авторе', href: '/about/' },
    { label: 'Банк заданий', href: tasksPage.href },
    { label: 'Учителям', href: '/#teachers' },
    /* Раздела с тарифами на странице пока нет — ссылка ждёт его. */
    { label: 'Тарифы', href: '#' },
  ] satisfies SiteLink[],

  /* «Войти» здесь больше нет: вход живёт в components/auth/AuthWidget и
     появляется только при включённом флаге (lib/auth/config.ts). Раздела
     с тарифами пока нет — «Начать бесплатно» без входа ведёт в никуда,
     со входом — на регистрацию. */
  headerActions: {
    signup: { label: 'Начать бесплатно', href: '#' } satisfies SiteLink,
  },

  footer: {
    copyright: '© 2026 Будет на ЕГЭ',
    links: [
      { label: legalDocs.politika.linkLabel, href: legalDocs.politika.href },
      { label: legalDocs.soglashenie.linkLabel, href: legalDocs.soglashenie.href },
      { label: 'Оферта', href: '#' },
      { label: 'Контакты', href: '#' },
    ] satisfies SiteLink[],
    /** Строка под копирайтом; ФИО — из src/content/legal/operator.json. */
    operatorLabel: 'Оператор персональных данных:',
  },
} as const;
