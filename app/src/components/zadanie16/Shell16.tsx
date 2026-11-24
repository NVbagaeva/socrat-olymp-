import { AppShell } from '@/components/layout/AppShell';
import { SectionHeader } from '@/components/tasks/shapka/SectionHeader';
import { RazdelTabs } from '@/components/tasks/RazdelTabs';
import { ZADANIE16 } from '@/content/zadanie16';
import { ZADANIYA } from '@/lib/paths';

/**
 * Оболочка раздела «Неравенство»: общая шапка раздела (SectionHeader) и
 * липкая лента вкладок (RazdelTabs). Номер, заголовок, чипы, картинка и
 * кольцо прогресса — в шапке, одинаковой у всех разделов. Вызывается из
 * layout маршрута: при переходе между вкладками остаётся на месте.
 */
export function Shell16({ children }: { children: React.ReactNode }) {
  const base = `${ZADANIYA}/${ZADANIE16.slug}`;
  return (
    <AppShell active="tasks">
      <main className="app-main">
        <SectionHeader kod="neravenstvo" />
        <RazdelTabs base={base} tabs={ZADANIE16.tabs} className="topic-tabs-row--stsena" bezPary />
        <div className="section-panel">{children}</div>
      </main>
    </AppShell>
  );
}
