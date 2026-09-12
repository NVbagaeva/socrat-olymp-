import type { Metadata } from 'next';
import { Sidebar, type NavItem } from '@/components/ui';
import { tasksPage } from '@/content/tasks';
import { TaskBank } from './TaskBank';
import './zadaniya.css';

export const metadata: Metadata = {
  title: `${tasksPage.title} — Будет на ЕГЭ`,
  description: tasksPage.lead,
};

/* Пункты меню взяты из витрины оболочки без изменений. Открыт из них
   пока один — «Задания»; остальные ведут на ту же страницу, потому
   что соответствующих разделов в проекте ещё нет. */
const MAIN: NavItem[] = [
  { id: 'home', label: 'Главная', href: '/' },
  { id: 'tasks', label: 'Задания', href: tasksPage.href, active: true },
  { id: 'homework', label: 'Домашние работы', href: tasksPage.href },
  { id: 'progress', label: 'Прогресс', href: tasksPage.href },
  { id: 'stats', label: 'Статистика', href: tasksPage.href },
  { id: 'materials', label: 'Материалы', href: tasksPage.href },
  { id: 'teacher', label: 'Учитель', href: tasksPage.href },
];

const SECONDARY: NavItem[] = [
  { id: 'notifications', label: 'Уведомления', href: tasksPage.href },
  { id: 'settings', label: 'Настройки', href: tasksPage.href },
];

export default function TasksPage() {
  return (
    <div className="shell shell--responsive app-shell">
      <Sidebar brand="Будет на ЕГЭ" items={MAIN} secondaryItems={SECONDARY} />
      {/* Шапка, поиск и сетка живут в клиентской части: фильтрация
          идёт в браузере, серверу тут делать нечего. */}
      <TaskBank />
    </div>
  );
}
