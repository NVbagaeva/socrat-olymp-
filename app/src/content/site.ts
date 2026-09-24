/**
 * Тексты и ссылки общей оболочки сайта: шапка и подвал.
 * Отдельно от лендинга — их используют все публичные страницы.
 * Меняется здесь, в разметке текста нет.
 */

import { tasksPage } from '@/content/tasks';

export interface SiteLink {
  label: string;
  href: string;
}

export const site = {
  brand: 'Будет на ЕГЭ',

  /** Первый пункт — отдельная страница; остальные пока якоря лендинга. */
  nav: [
    { label: 'Об авторе', href: '/about' },
    { label: 'Банк заданий', href: tasksPage.href },
    /* Страница учителя. Пока на ней услуга «Материалы под ключ»; когда
       появится кабинет, она станет узлом «Учителям» с услугой как
       разделом — адрес не изменится (docs/SERVICE TEACHERS LANDING.md, §2.1). */
    { label: 'Учителям', href: '/uchitelyam/' },
    /* Раздела с тарифами на странице пока нет — ссылка ждёт его. */
    { label: 'Тарифы', href: '#' },
  ] satisfies SiteLink[],

  headerActions: {
    login: { label: 'Войти', href: '#' } satisfies SiteLink,
    signup: { label: 'Начать бесплатно', href: '#' } satisfies SiteLink,
  },

  /**
   * Яндекс Метрика: номер счётчика из кабинета metrika.yandex.ru.
   * Пустая строка — счётчик не подключается вовсе.
   */
  metrika: {
    id: '',
  },

  footer: {
    copyright: '© 2026 Будет на ЕГЭ',
    links: [
      { label: 'Оферта', href: '#' },
      { label: 'Обработка данных', href: '/politika-dannyh/' },
      { label: 'Контакты', href: '#' },
    ] satisfies SiteLink[],
  },
} as const;
