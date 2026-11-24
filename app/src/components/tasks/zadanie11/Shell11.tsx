import { AppShell } from '@/components/layout/AppShell';
import { SectionHeader } from '@/components/tasks/shapka/SectionHeader';
import { ZADANIE11 } from '@/content/zadanie11';
import { RazdelTabs } from '../RazdelTabs';
import { razdelBase } from '@/lib/paths';

/**
 * Оболочка раздела «Текстовые задачи»: общая шапка раздела (SectionHeader) и
 * липкая лента вкладок (RazdelTabs). Номер, заголовок, чипы, картинка и
 * кольцо прогресса — в шапке, одинаковой у всех разделов. Вызывается из
 * layout маршрута: при переходе между вкладками остаётся на месте.
 */
export function Shell11({ children }: { children: React.ReactNode }) {
  const base = `${razdelBase(ZADANIE11.slug)}`;
  return (
    <AppShell active="tasks">
      <main className="app-main">
        <SectionHeader kod="tekstovye-zadachi" />
        <RazdelTabs base={base} tabs={ZADANIE11.tabs} className="topic-tabs-row--stsena" bezPary />
        <div className="section-panel">{children}</div>
      </main>
    </AppShell>
  );
}
