import { AppShell } from '@/components/layout/AppShell';
import { RazdelTabs } from '@/components/tasks/RazdelTabs';
import { ShapkaRazdela } from '@/components/tasks/ShapkaRazdela';
import { BAZA_TEXT, pasport, VKLADKI_BAZY } from '@/content/baza/razdely';
import { bankPageOf, taskBase, type ExamTask } from '@/content/tasks';
import { levelInfo } from '@/lib/level';

/**
 * Оболочка задания базы — одна на все 21 задание: крошки, заголовок,
 * липкая лента вкладок. Устройство то же, что у разделов профиля
 * (Shell13): AppShell → ShapkaRazdela → RazdelTabs → section-panel.
 * Вызывается из layout маршрута, поэтому при переходе между вкладками
 * остаётся на месте.
 */
export function ShellBaza({ task, children }: { task: ExamTask; children: React.ReactNode }) {
  const soon = task.status !== 'ready';
  return (
    <AppShell active="tasks" level="base">
      <main className="app-main">
        <ShapkaRazdela
          className={soon ? 'task-stub-head' : undefined}
          crumbs={[
            { label: 'Главная', href: levelInfo('base').home },
            { label: 'Банк заданий', href: bankPageOf('base').href },
            { label: `№${Number(task.no)}` },
          ]}
          title={task.name}
          {...(soon ? { badge: BAZA_TEXT.badgeSoon, badgeTone: 'neutral' as const } : {})}
          lead={pasport(task.slug).lead}
        />
        <RazdelTabs base={taskBase(task)} tabs={VKLADKI_BAZY} />
        <div className="section-panel">{children}</div>
      </main>
    </AppShell>
  );
}
