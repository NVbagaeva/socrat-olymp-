/**
 * Меню раздела приложения. Один список на все страницы с сайдбаром:
 * пункты не повторяются в каждой странице, а подсветка текущего
 * задаётся снаружи по id.
 *
 * Этот же список питает нижнюю панель на мобильном: панель берёт из
 * него четыре главных пункта, остальные уходят на экран «Ещё».
 * Второго списка пунктов в проекте нет.
 */

import type { NavItem } from '@/components/ui';
import { tasksPage } from '@/content/tasks';

/* Разделов под большинство пунктов ещё нет, поэтому они ведут на список
   заданий — единственную собранную страницу раздела. Адреса правятся
   здесь же, когда страницы появятся. */
export const appNav: NavItem[] = [
  { id: 'home', label: 'Главная', href: '/', icon: 'home' },
  { id: 'tasks', label: 'Задания', href: tasksPage.href, icon: 'tasks' },
  /* Короткая подпись — для нижней панели: полное название в ячейку
     шириной в пятую часть экрана не помещается и рвёт ряд на две
     строки. В сайдбаре остаётся полное. */
  { id: 'homework', label: 'Домашние работы', short: 'Домашние', href: tasksPage.href, icon: 'homework' },
  { id: 'progress', label: 'Прогресс', href: tasksPage.href, icon: 'progress' },
  { id: 'stats', label: 'Статистика', href: tasksPage.href, icon: 'stats' },
  { id: 'materials', label: 'Материалы', href: tasksPage.href, icon: 'materials' },
  { id: 'teacher', label: 'Учитель', href: tasksPage.href, icon: 'teacher' },
];

export const appNavSecondary: NavItem[] = [
  { id: 'notifications', label: 'Уведомления', href: tasksPage.href, icon: 'notifications' },
];

/* ── Мобильная панель ─────────────────────────────────────────────
   На узком экране пунктов помещается пять: четыре раздела и вход в
   остальные. Здесь перечислены только идентификаторы — названия и
   адреса у пунктов те же, что в сайдбаре, и берутся из списков выше. */

const PRIMARY_IDS = ['home', 'tasks', 'homework', 'progress'];

const ALL_ITEMS: NavItem[] = [...appNav, ...appNavSecondary];

/** Экран со списком разделов, не поместившихся в панель. */
export const appNavMorePage: NavItem = {
  id: 'more',
  label: 'Ещё',
  href: '/eshche/',
  icon: 'more',
};

/** Четыре главных пункта панели — в порядке PRIMARY_IDS. */
export const appNavPrimary: NavItem[] = PRIMARY_IDS.flatMap((id) => {
  const item = ALL_ITEMS.find((candidate) => candidate.id === id);
  return item !== undefined ? [item] : [];
});

/** Всё остальное: список экрана «Ещё» считается, а не задаётся руками. */
export const appNavMore: NavItem[] = ALL_ITEMS.filter(
  (item) => !PRIMARY_IDS.includes(item.id),
);

/** id пункта панели, который подсвечивается на странице раздела active. */
export function bottomNavActive(active: string | undefined): string | undefined {
  if (active === undefined) {
    return undefined;
  }
  /* Разделы с экрана «Ещё» подсвечивают сам вход в него: своей ячейки
     в панели у них нет. */
  return PRIMARY_IDS.includes(active) ? active : appNavMorePage.id;
}
