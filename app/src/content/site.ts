/**
 * Тексты и ссылки общей оболочки сайта: шапка и подвал.
 * Отдельно от лендинга — их используют все публичные страницы.
 * Меняется здесь, в разметке текста нет.
 */

export interface SiteLink {
  label: string;
  href: string;
}

export const site = {
  brand: 'Будет на ЕГЭ',

  /** Пока это якоря лендинга. Станут маршрутами, когда появятся страницы. */
  nav: [
    { label: 'Как это работает', href: '/#how' },
    { label: 'Банк заданий', href: '/#bank' },
    { label: 'Учителям', href: '/#teachers' },
    /* Раздела с тарифами на странице пока нет — ссылка ждёт его. */
    { label: 'Тарифы', href: '#' },
  ] satisfies SiteLink[],

  headerActions: {
    login: { label: 'Войти', href: '#' } satisfies SiteLink,
    signup: { label: 'Начать бесплатно', href: '#' } satisfies SiteLink,
  },

  footer: {
    copyright: '© 2026 Будет на ЕГЭ',
    links: [
      { label: 'Оферта', href: '#' },
      { label: 'Обработка данных', href: '#' },
      { label: 'Контакты', href: '#' },
    ] satisfies SiteLink[],
  },
} as const;
