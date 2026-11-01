/**
 * Тексты и ссылки общей оболочки сайта: шапка и подвал.
 * Отдельно от лендинга — их используют все публичные страницы.
 * Меняется здесь, в разметке текста нет.
 */

import { legalDocs } from '@/content/legal/documents';
import { HOWTO_HREF } from '@/content/howto';
import { tasksPage } from '@/content/tasks';
import { EZH_HREF } from '@/content/ezhemesyachnye';
import { POV_HREF } from '@/content/povyshennye';
import { VARIANT_HREF } from '@/content/variant';

export interface SiteLink {
  label: string;
  href: string;
}

/**
 * Группа пунктов меню: в широкой шапке — кнопка с выпадающим списком,
 * в бургер-меню — те же ссылки подряд, без заголовка.
 */
export interface NavGroup {
  label: string;
  items: SiteLink[];
}

export type NavItem = SiteLink | NavGroup;

export function isNavGroup(item: NavItem): item is NavGroup {
  return 'items' in item;
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
    /* Всё про варианты — одной группой: семь пунктов в одну строку не
       помещались даже на 1440 px, и шапка переносилась в две строки. */
    {
      label: 'Варианты',
      items: [
        { label: 'Собрать вариант', href: VARIANT_HREF },
        { label: 'Варианты повышенной сложности', href: POV_HREF },
        { label: 'Ежемесячные варианты', href: EZH_HREF },
      ],
    },
    { label: 'Как пользоваться', href: HOWTO_HREF },
    { label: 'Учителям', href: '/#how' },
  ] as NavItem[],

  /* «Войти» здесь больше нет: вход живёт в components/auth/AuthWidget и
     появляется только при включённом флаге (lib/auth/config.ts).
     «Начать бесплатно» без входа ведёт в банк заданий — платного ничего
     нет; со входом — на регистрацию. */
  headerActions: {
    signup: { label: 'Начать бесплатно', href: tasksPage.href } satisfies SiteLink,
  },

  footer: {
    copyright: '© 2026 Будет на ЕГЭ',
    /* Правовые документы — свои страницы сайта; связь — через
       Telegram-канал платформы, тот же, что на печатных листах, он
       открывается в новой вкладке. */
    links: [
      { label: legalDocs.politika.linkLabel, href: legalDocs.politika.href },
      { label: legalDocs.soglashenie.linkLabel, href: legalDocs.soglashenie.href },
      { label: 'Оферта', href: '#' },
      { label: 'Контакты', href: '#' },
      { label: 'Telegram', href: 'https://t.me/budet_na_ege_math', external: true },
    ] satisfies (SiteLink | ExternalLink)[],
    /** Строка под копирайтом; ФИО — из src/content/legal/operator.json. */
    operatorLabel: 'Оператор персональных данных:',
  },
} as const;

/** Все ссылки меню подряд, группы раскрыты — для бургер-меню. */
export const navLinks: SiteLink[] = site.nav.flatMap((item) =>
  isNavGroup(item) ? item.items : [item],
);
