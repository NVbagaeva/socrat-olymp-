import { AppShell } from '@/components/layout/AppShell';
import { SectionHeader } from '@/components/tasks/shapka/SectionHeader';
import { VEKTORY } from '@/content/vektory';
import { razdelBase } from '@/lib/paths';
import { RazdelTabs } from '../RazdelTabs';

/**
 * Оболочка задания «Векторы»: общая шапка раздела (SectionHeader) с
 * кольцом прогресса и лента вкладок. Вызывается из layout маршрута —
 * при переходе между вкладками остаётся на месте.
 */
export function VektoryShell({ children }: { children: React.ReactNode }) {
  const base = `${razdelBase(VEKTORY.slug)}`;

  return (
    <AppShell active="tasks">
      <main className="app-main">
        <SectionHeader kod="vektory" />
        <RazdelTabs
          base={base}
          tabs={VEKTORY.tabs}
          className="topic-tabs-row--stsena"
          bezPary
          {...(VEKTORY.tutors.items.length === 0 ? {} : { tutors: VEKTORY.tutors })}
        />
        <div className="section-panel">{children}</div>
      </main>
    </AppShell>
  );
}
