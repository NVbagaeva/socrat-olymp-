/**
 * Тексты и ссылки общей оболочки сайта: шапка и подвал.
 * Отдельно от лендинга — их используют все публичные страницы.
 * Меняется здесь, в разметке текста нет.
 */

import { legalDocs, ofertaDoc } from '@/content/legal/documents';
import { HOWTO_HREF } from '@/content/howto';
import { tasksPage } from '@/content/tasks';
import { EZH_HREF } from '@/content/ezhemesyachnye';
import { POV_HREF } from '@/content/povyshennye';
import { VARIANT_HREF, VARIANT_ONLAYN_HREF } from '@/content/variant';
import { ONLINE_TEXT } from '@/content/variantOnline/text';
import { TARIFY_HREF } from '@/lib/tarify/config';
import type { NavIconName } from '@/components/ui/NavIcons';

export interface SiteLink {
  label: string;
  href: string;
}

/**
 * Группа пунктов меню: в широкой шапке — кнопка с выпадающим списком.
 * Бургер-меню собрано отдельно — см. site.menu.
 */
export interface NavGroup {
  label: string;
  items: MenuLink[];
}

export type NavItem = SiteLink | NavGroup;

/** Пункт бургер-меню: значок, название и строка-пояснение под ним. */
export interface MenuLink extends SiteLink {
  hint: string;
  icon: NavIconName;
}

/** Группа бургер-меню с подписью над списком. */
export interface MenuGroup {
  label: string;
  items: MenuLink[];
}

export function isNavGroup(item: NavItem): item is NavGroup {
  return 'items' in item;
}

/** Внешняя ссылка: открывается в новой вкладке. */
export interface ExternalLink extends SiteLink {
  external: true;
}

/* Пункты меню заведены по одному разу: широкая шапка и бургер берут
   их отсюда, поэтому названия и адреса в них не расходятся. Названия
   вариантов короче заголовков страниц — длинные в бургере переносились
   на две строки. Пояснения — из лидов самих страниц, без новых
   обещаний. */
const LINKS = {
  bank: {
    label: 'Банк заданий',
    hint: 'Все задания по темам',
    href: tasksPage.href,
    icon: 'tasks',
  },
  sobrat: {
    label: 'Собрать вариант',
    hint: 'Для домашней и контрольной',
    href: VARIANT_HREF,
    icon: 'variant',
  },
  onlayn: {
    label: ONLINE_TEXT.nachalo.menu,
    hint: 'Задания 1–13 с автопроверкой',
    href: VARIANT_ONLAYN_HREF,
    icon: 'target',
  },
  mesyaca: {
    label: 'Варианты месяца',
    hint: 'По одному на месяц, части 1 и 2',
    href: EZH_HREF,
    icon: 'ezhemesyachnye',
  },
  slozhnye: {
    label: 'Сложные варианты',
    hint: '36 вариантов, по шесть версий',
    href: POV_HREF,
    icon: 'povyshennye',
  },
  howto: {
    label: 'Как пользоваться',
    hint: 'Короткий гид по сайту',
    href: HOWTO_HREF,
    icon: 'help',
  },
  /* «Учителям» ведёт на блок «Мы взяли на себя то, что обычно забирает
     ваш вечер» — он про самостоятельные, домашние и проверку. */
  uchitelyam: {
    label: 'Учителям',
    hint: 'Самостоятельные и домашние',
    href: '/#how',
    icon: 'homework',
  },
  avtor: { label: 'Об авторе', hint: 'Кто делает сайт', href: '/about/', icon: 'teacher' },
  /* Страница с тарифами; оплата на ней пока выключена
     (lib/tarify/config.ts, PAYMENTS_ENABLED). */
  tarify: { label: 'Тарифы', hint: 'Что входит в доступ', href: TARIFY_HREF, icon: 'favourites' },
} satisfies Record<string, MenuLink>;

export const site = {
  brand: 'Будет на ЕГЭ',

  /**
   * Пункты широкой шапки. Каждый ведёт на работающую страницу или блок.
   * Порядок — от дела к справке: сначала задания и варианты, потом
   * разделы о проекте, «Тарифы» последними.
   */
  nav: [
    LINKS.bank,
    /* Всё про варианты — одной группой: семь пунктов в одну строку не
       помещались даже на 1440 px, и шапка переносилась в две строки.
       Первым — главное действие, оно в списке выделено. */
    {
      label: 'Варианты',
      items: [LINKS.onlayn, LINKS.sobrat, LINKS.mesyaca, LINKS.slozhnye],
    },
    LINKS.uchitelyam,
    LINKS.howto,
    LINKS.avtor,
    LINKS.tarify,
  ] as NavItem[],

  /**
   * Бургер-меню: те же пункты, но по смыслу — главное действие
   * карточкой, дальше группы, «Тарифы» отдельной строкой.
   */
  menu: {
    glavnoe: LINKS.onlayn as MenuLink,
    groups: [
      { label: 'Практика', items: [LINKS.bank, LINKS.sobrat] },
      { label: 'Готовые варианты', items: [LINKS.mesyaca, LINKS.slozhnye] },
      { label: 'О проекте', items: [LINKS.howto, LINKS.uchitelyam, LINKS.avtor] },
    ] as MenuGroup[],
    tarify: LINKS.tarify as MenuLink,
    akkaunt: 'Аккаунт',
  },

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
      { label: 'Тарифы', href: TARIFY_HREF },
      { label: 'Контакты', href: '#' },
      { label: 'Telegram', href: 'https://t.me/budet_na_ege_math', external: true },
    ] satisfies (SiteLink | ExternalLink)[],
    /**
     * С флагом NEXT_PUBLIC_LEGAL_READY (lib/legal/prodavets.ts) подвал
     * показывает реквизиты продавца и под ними — четыре документа; из
     * общего ряда ссылок правовые тогда убираются.
     */
    pravovye: [
      { label: ofertaDoc.linkLabel, href: ofertaDoc.href },
      { label: legalDocs.politika.linkLabel, href: legalDocs.politika.href },
      { label: legalDocs.soglasie.linkLabel, href: legalDocs.soglasie.href },
      { label: legalDocs.soglashenie.linkLabel, href: legalDocs.soglashenie.href },
    ] satisfies SiteLink[],
    pravovyeLabel: 'Документы',
    /** Строка под копирайтом; ФИО — из src/content/legal/operator.json. */
    operatorLabel: 'Оператор персональных данных:',
  },
} as const;
