import type { Metadata } from 'next';
import { AppShell } from '@/components/layout/AppShell';
import { bankPageOf } from '@/content/tasks';
import { TaskBank } from '@/app/zadaniya/TaskBank';
import '@/app/zadaniya/zadaniya.css';

const page = bankPageOf('base');

export const metadata: Metadata = {
  title: `${page.title} — Будет на ЕГЭ`,
  description: page.lead,
};

/** Банк заданий базы: тот же экран, что у профиля, со списком 1–21. */
export default function BazaTasksPage() {
  return (
    <AppShell active="tasks" search={false} level="base">
      <TaskBank level="base" />
    </AppShell>
  );
}
