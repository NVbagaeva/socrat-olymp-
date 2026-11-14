import { AppShell } from '@/components/layout/AppShell';
import { RazdelTabs } from '@/components/tasks/RazdelTabs';
import { RisunokRazdela, StsenaShapka, tabletkiRazdela } from '@/components/tasks/stsena';
import { BAZA_TEXT, pasport, VKLADKI_BAZY } from '@/content/baza/razdely';
import { STSENA } from '@/content/stsena';
import { bankPageOf, taskBase, type ExamTask } from '@/content/tasks';
import { levelInfo } from '@/lib/level';

/**
 * Оболочка задания базы — одна на все 21 задание: шапка «Стеклянная
 * сцена», липкая лента вкладок. Устройство то же, что у разделов
 * профиля (Shell13). Вызывается из layout маршрута, поэтому при
 * переходе между вкладками остаётся на месте.
 *
 * Обложка — общая стеклянная плитка: мотивы нарисованы под темы
 * профиля, а за теми же номерами базы стоят другие темы, и подставлять
 * чужой мотив нельзя.
 */
export function ShellBaza({ task, children }: { task: ExamTask; children: React.ReactNode }) {
  const soon = task.status !== 'ready';
  return (
    <AppShell active="tasks" level="base">
      <main className="app-main">
        <StsenaShapka
          crumbs={[
            { label: 'Главная', href: levelInfo('base').home },
            { label: 'Банк заданий', href: bankPageOf('base').href },
            { label: `№${Number(task.no)}` },
          ]}
          title={task.name}
          lead={pasport(task.slug).lead}
          tabletki={tabletkiRazdela({ ...(soon ? { chast: BAZA_TEXT.badgeSoon } : {}) })}
          media={<RisunokRazdela label={`${STSENA.oblozhka}: ${task.name}`} />}
        />
        <RazdelTabs base={taskBase(task)} tabs={VKLADKI_BAZY} className="topic-tabs-row--stsena" />
        <div className="section-panel">{children}</div>
      </main>
    </AppShell>
  );
}
