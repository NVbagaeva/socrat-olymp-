import type { Metadata } from 'next';
import { AppShell } from '@/components/layout/AppShell';
import { TaskBank } from './TaskBank';
import './zadaniya.css';
import { SEO_STRANITSY } from '@/content/seo';

export const metadata: Metadata = SEO_STRANITSY.bank;

/**
 * Банк заданий. Каждая карточка — ссылка на страницу раздела; №12
 * открывается так же, как остальные, без промежуточного окна.
 */
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
