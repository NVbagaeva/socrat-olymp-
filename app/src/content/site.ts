/**
 * Тексты и ссылки общей оболочки сайта: шапка и подвал.
 * Отдельно от лендинга — их используют все публичные страницы.
 * Меняется здесь, в разметке текста нет.
 */

import { HOWTO_HREF } from '@/content/onboarding';
import { legalDocs } from '@/content/legal/documents';
import { tasksPage } from '@/content/tasks';

export interface SiteLink {
  label: string;
  href: string;
}

/** Внешняя ссылка: открывается в новой вкладке. */
export interface ExternalLink extends SiteLink {
  external: true;
}

export const site = {
  brand: 'Будет на ЕГЭ',

  /**
   * Пункты меню. Каждый ведёт на работающую страницу или блок.
   * «Тарифы» сняты: раздела нет, платного ничего нет. «Учителям» ведёт
   * на блок «Мы взяли на себя то, что обычно забирает ваш вечер» —
   * он про самостоятельные, домашние и проверку, то есть для учителя.
   */
  nav: [
    { label: 'Об авторе', href: '/about/' },
    { label: 'Банк заданий', href: tasksPage.href },
    { label: 'Как пользоваться', href: HOWTO_HREF },
    { label: 'Учителям', href: '/#how' },
  ] satisfies SiteLink[],

  /**
   * Кнопки справа в шапке. Входа на сайте нет, поэтому «Войти» не
   * показывается; вернуть — добавить login с адресом страницы входа.
   */
  headerActions: {
    login: null as SiteLink | null,
    signup: { label: 'Начать бесплатно', href: tasksPage.href } satisfies SiteLink,
  },

  footer: {
    copyright: '© 2026 Будет на ЕГЭ',
    /* Страниц оферты и обработки данных пока нет — ссылки на них сняты.
       Связь — через Telegram-канал платформы, тот же, что на печатных
       листах. */
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
