import type { Metadata } from 'next';
import { Sidebar, TaskCard, type NavItem } from '@/components/ui';
import { tasks, tasksPage } from '@/content/tasks';
import './zadaniya.css';

export const metadata: Metadata = {
  title: `${tasksPage.title} — Будет на ЕГЭ`,
  description: 'Все задания профильной математики ЕГЭ в одном списке.',
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

      <main className="app-main">
        <h1 className="t-h2 app-main__title">{tasksPage.title}</h1>

        {/* Сетка карточек. Статус решает, чем окажется карточка:
            ссылкой на раздел или неактивной пометкой «Скоро». */}
        <ul className="tasks-grid">
          {tasks.map((task) => (
            <li key={task.no}>
              <TaskCard
                number={task.no}
                title={task.name}
                href={task.status === 'active' ? `/zadaniya/${task.slug}` : undefined}
                soon={task.status !== 'active'}
                difficulty={task.badge}
                difficultyTone="info"
              />
            </li>
          ))}
        </ul>
      </main>
    </div>
  );
}
