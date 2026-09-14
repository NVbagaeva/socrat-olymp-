/**
 * Навигация кабинета. Один источник пунктов на все раскладки:
 * верхнее меню на широком экране, нижняя панель на мобильном и
 * экран «Ещё» берут свои пункты отсюда, а не заводят свои списки.
 *
 * Список заданий в сайдбаре сюда не входит: он целиком считается
 * из tasks.ts.
 */

import type { NavItem } from '@/components/ui';
import { tasksPage } from '@/content/tasks';

/* Разделы кабинета. Прежние пункты сайдбара разложены по ним так:
   «Прогресс» и «Статистика» → «Статистика», «Материалы» →
   «Мои материалы», «Учитель» и «Домашние работы» → «Для учителя»,
   «Уведомления» → колокольчик в шапке. */
export const topNav: NavItem[] = [
  { id: 'home', label: 'Главная', href: '/', icon: 'home' },
  { id: 'tasks', label: 'Задания', href: tasksPage.href, icon: 'tasks' },
  { id: 'stats', label: 'Статистика', href: '/statistika/', icon: 'stats' },
  /* Короткая подпись — для нижней панели и экрана «Ещё»: полное
     название в ячейку шириной в четверть экрана не помещается. */
  { id: 'materials', label: 'Мои материалы', short: 'Материалы', href: '/moi-materialy/', icon: 'materials' },
  { id: 'teacher', label: 'Для учителя', short: 'Учитель', href: '/dlya-uchitelya/', icon: 'teacher' },
];

/** Уведомления живут за колокольчиком, в списке меню их нет. */
export const notificationsPage: NavItem = {
  id: 'notifications',
  label: 'Уведомления',
  href: '/uvedomleniya/',
  icon: 'notifications',
};

/** Личные разделы под списком заданий в сайдбаре. */
export const sidebarExtras: NavItem[] = [
  { id: 'my-tasks', label: 'Мои задания', href: '/moi-zadaniya/', icon: 'assignments' },
  { id: 'favourites', label: 'Избранное', href: '/izbrannoe/', icon: 'favourites' },
  { id: 'history', label: 'История решений', href: '/istoriya-resheniy/', icon: 'history' },
  { id: 'settings', label: 'Настройки', href: '/nastroyki/', icon: 'settings' },
];

/* «Мои конспекты» из этого списка убраны по макету. Маршрут
   /moi-konspekty остался: страница есть, ссылки в меню нет. */

/* ── Мобильная панель ─────────────────────────────────────────────
   Пунктов помещается пять: три раздела из верхнего меню и вход в
   остальные. Здесь перечислены только идентификаторы — названия и
   адреса те же, что наверху. */

const PRIMARY_IDS = ['home', 'tasks', 'stats'];

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
export const appNavMore: NavItem[] = [
  ...topNav.filter((item) => !PRIMARY_IDS.includes(item.id)),
  notificationsPage,
];

/** id пункта панели, который подсвечивается на странице раздела active. */
export function bottomNavActive(active: string | undefined): string | undefined {
  if (active === undefined) {
    return undefined;
  }
  /* Разделы с экрана «Ещё» подсвечивают сам вход в него: своей ячейки
     в панели у них нет. */
  return PRIMARY_IDS.includes(active) ? active : appNavMorePage.id;
}
