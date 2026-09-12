/**
 * Меню раздела приложения. Один список на все страницы с сайдбаром:
 * пункты не повторяются в каждой странице, а подсветка текущего
 * задаётся снаружи по id.
 *
 * Пункты перенесены из витрины оболочки без изменений состава.
 */

import type { NavItem } from '@/components/ui';
import { tasksPage } from '@/content/tasks';

/* Разделов под большинство пунктов ещё нет, поэтому они ведут на список
   заданий — единственную собранную страницу раздела. Адреса правятся
   здесь же, когда страницы появятся. */
export const appNav: NavItem[] = [
  { id: 'home', label: 'Главная', href: '/' },
  { id: 'tasks', label: 'Задания', href: tasksPage.href },
  { id: 'homework', label: 'Домашние работы', href: tasksPage.href },
  { id: 'progress', label: 'Прогресс', href: tasksPage.href },
  { id: 'stats', label: 'Статистика', href: tasksPage.href },
  { id: 'materials', label: 'Материалы', href: tasksPage.href },
  { id: 'teacher', label: 'Учитель', href: tasksPage.href },
];

export const appNavSecondary: NavItem[] = [
  { id: 'notifications', label: 'Уведомления', href: tasksPage.href },
  { id: 'settings', label: 'Настройки', href: tasksPage.href },
];
