/**
 * Тексты и ссылки общей оболочки сайта: шапка и подвал.
 * Отдельно от лендинга — их используют все публичные страницы.
 * Меняется здесь, в разметке текста нет.
 */

import { startHref, tasksPage } from '@/content/tasks';

export interface SiteLink {
  label: string;
  href: string;
}

/**
 * В меню, шапке и подвале — только ссылки на то, что существует.
 * Пунктов «Тарифы», «Войти», «Оферта», «Обработка данных» и «Контакты»
 * здесь нет: страниц и авторизации у них пока нет, а ссылка на «#»
 * выглядит сломанной. Когда появятся — добавляются сюда одной строкой,
 * шапка и подвал подхватят сами.
 */
export const site = {
  brand: 'Будет на ЕГЭ',

  nav: [
    { label: 'Банк заданий', href: tasksPage.href },
    { label: 'Для репетиторов', href: '/#tutors' },
    { label: 'Об авторе', href: '/about/' },
  ] satisfies SiteLink[],

  headerActions: {
    /* Слово «бесплатно» остаётся: регистрации нет, и это правда. */
    signup: { label: 'Начать бесплатно', href: startHref } satisfies SiteLink,
  },

  footer: {
    copyright: '© 2026 Будет на ЕГЭ',
    links: [] as SiteLink[],
  },
} as const;
