import { AppShell } from '@/components/layout/AppShell';
import { SectionHeader } from '@/components/tasks/shapka/SectionHeader';
import { ZADANIE1 } from '@/content/zadanie1';
import { ZADANIYA } from '@/lib/paths';
import { RazdelTabs } from '../RazdelTabs';

/**
 * Оболочка раздела «Планиметрия» (часть 1): общая шапка раздела (SectionHeader) и
 * липкая лента вкладок (RazdelTabs). Номер, заголовок, чипы, картинка и
 * кольцо прогресса — в шапке, одинаковой у всех разделов. Вызывается из
 * layout маршрута: при переходе между вкладками остаётся на месте.
 */
export function Shell1({ children }: { children: React.ReactNode }) {
  const base = `${ZADANIYA}/${ZADANIE1.slug}`;
  return (
    <AppShell active="tasks">
      <main className="app-main">
        <SectionHeader kod="planimetriya" />
        <RazdelTabs base={base} tabs={ZADANIE1.tabs} className="topic-tabs-row--stsena" bezPary />
        <div className="section-panel">{children}</div>
      </main>
    </AppShell>
  );
}
