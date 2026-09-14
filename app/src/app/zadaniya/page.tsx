import type { Metadata } from 'next';
import { AppShell } from '@/components/layout/AppShell';
import { tasksPage } from '@/content/tasks';
import { TaskBank } from './TaskBank';
import './zadaniya.css';

export const metadata: Metadata = {
  title: `${tasksPage.title} — Будет на ЕГЭ`,
  description: tasksPage.lead,
};

export default function TasksPage() {
  return (
    /* Поиск в шапке выключен: на этой странице фильтрует свой. */
    <AppShell active="tasks" search={false}>
      {/* Шапка, поиск и сетка живут в клиентской части: фильтрация
          идёт в браузере, серверу тут делать нечего. */}
      <TaskBank />
    </AppShell>
  );
}
