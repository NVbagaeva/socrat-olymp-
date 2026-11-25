/**
 * Навигация кабинета. Один источник пунктов на все раскладки:
 * верхнее меню на широком экране, нижняя панель на мобильном и
 * экран «Ещё» берут свои пункты отсюда, а не заводят свои списки.
 *
 * Список заданий в сайдбаре сюда не входит: он целиком считается
 * из tasks.ts.
 */

import type { NavItem } from '@/components/ui';
import { LINKS, type MenuLink } from '@/content/site';

/* Пункт нижней панели и экрана «Ещё» из общего списка меню (LINKS,
   content/site.ts): id, название, адрес и значок заведены там один раз.
   short — короткая подпись только для панели и «Ещё»; в верхнем меню
   названия всегда полные (components/layout/VerhneeMenu.tsx). */
function punkt(link: MenuLink, extra: Partial<NavItem> = {}): NavItem {
  return {
    id: link.id ?? link.href,
    label: link.label,
    href: link.href,
    icon: link.icon,
    ...(link.akcent === true ? { akcent: true } : {}),
    ...extra,
  };
}

/* Разделы кабинета для нижней панели и экрана «Ещё». Верхнее меню
   берёт пункты прямо из site.nav. «Главная» — только здесь: в верхнем
   меню на главную ведёт логотип. */
const vseRazdely: NavItem[] = [
  { id: 'home', label: 'Главная', href: '/', icon: 'home' },
  punkt(LINKS.bank),
  punkt(LINKS.ustnyy, { short: 'Счёт' }),
  punkt(LINKS.sobrat, { short: 'Вариант' }),
  punkt(LINKS.slozhnye, { short: 'Сложные' }),
  punkt(LINKS.mesyaca, { short: 'Месяца' }),
  { id: 'stats', label: 'Статистика', href: '/statistika/', icon: 'stats' },
  {
    id: 'materials',
    label: 'Мои материалы',
    short: 'Материалы',
    href: '/moi-materialy/',
    icon: 'materials',
  },
  {
    id: 'teacher',
    label: 'Для учителя',
    short: 'Учитель',
    href: '/dlya-uchitelya/',
    icon: 'teacher',
  },
  punkt(LINKS.howto, { short: 'Инструкция' }),
  punkt(LINKS.tarify),
];

/**
 * Разделы, которых ещё нет: их страницы — заглушки «Раздел в разработке»
 * (components/layout/StubPage.tsx). В меню, нижнюю панель, экран «Ещё»,
 * сайдбар и колокольчик они не попадают — ни одна кнопка навигации не
 * ведёт в тупик (docs/design-audit.md, п. 13.1). Страницы по прямому
 * адресу остаются. Раздел готов — убрать его id отсюда, и он вернётся
 * на своё место во всех раскладках.
 */
const NE_GOTOVY = new Set([
  'stats',
  'materials',
  'teacher',
  'notifications',
  'my-tasks',
  'favourites',
  'history',
  'settings',
]);

const gotovye = (items: NavItem[]): NavItem[] => items.filter((item) => !NE_GOTOVY.has(item.id));

/** Готовые разделы кабинета: нижняя панель и экран «Ещё». */
export const topNav: NavItem[] = gotovye(vseRazdely);

/** Уведомления живут за колокольчиком, в списке меню их нет. */
export const notificationsPage: NavItem = {
  id: 'notifications',
  label: 'Уведомления',
  href: '/uvedomleniya/',
  icon: 'notifications',
};

/** Личные разделы под списком заданий в сайдбаре. */
const lichnye: NavItem[] = [
  { id: 'my-tasks', label: 'Мои задания', href: '/moi-zadaniya/', icon: 'assignments' },
  { id: 'favourites', label: 'Избранное', href: '/izbrannoe/', icon: 'favourites' },
  { id: 'history', label: 'История решений', href: '/istoriya-resheniy/', icon: 'history' },
  { id: 'settings', label: 'Настройки', href: '/nastroyki/', icon: 'settings' },
];

/** Готовые личные разделы; пусто — блока в сайдбаре нет. */
export const sidebarExtras: NavItem[] = gotovye(lichnye);

/** Колокольчик в шапке — только когда страница уведомлений готова. */
export const notificationsReady = !NE_GOTOVY.has(notificationsPage.id);

/* «Мои конспекты» из этого списка убраны по макету. Маршрут
   /moi-konspekty остался: страница есть, ссылки в меню нет. */

/* ── Мобильная панель ─────────────────────────────────────────────
   Пунктов помещается пять: четыре раздела из верхнего меню и вход в
   остальные. «Устный счёт» — среди главных и выделен акцентом; пока
   статистики нет, четвёртая ячейка — «Вариант». Здесь перечислены
   только идентификаторы — названия и адреса те же, что наверху. */

const PRIMARY_IDS = ['home', 'tasks', 'ustnyy', 'variant'];

/** Экран со списком разделов, не поместившихся в панель. */
export const appNavMorePage: NavItem = {
  id: 'more',
  label: 'Ещё',
  href: '/eshche/',
  icon: 'more',
};

/** Главные пункты панели — в порядке PRIMARY_IDS. */
export const appNavPrimary: NavItem[] = PRIMARY_IDS.flatMap((id) => {
  const item = topNav.find((candidate) => candidate.id === id);
  return item !== undefined ? [item] : [];
});

/** Экран «Ещё»: всё, что не попало в панель. Считается, не задаётся. */
export const appNavMore: NavItem[] = gotovye([
  ...topNav.filter((item) => !PRIMARY_IDS.includes(item.id)),
  notificationsPage,
]);

/** id пункта панели, который подсвечивается на странице раздела active. */
export function bottomNavActive(active: string | undefined): string | undefined {
  if (active === undefined) {
    return undefined;
  }
  /* Разделы с экрана «Ещё» подсвечивают сам вход в него: своей ячейки
     в панели у них нет. */
  return PRIMARY_IDS.includes(active) ? active : appNavMorePage.id;
}
