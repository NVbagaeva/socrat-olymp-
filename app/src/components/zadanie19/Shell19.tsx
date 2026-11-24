import { AppShell } from '@/components/layout/AppShell';
import { SectionHeader } from '@/components/tasks/shapka/SectionHeader';
import { RazdelTabs } from '@/components/tasks/RazdelTabs';
import { ZADANIE19 } from '@/content/zadanie19';
import { ZADANIYA } from '@/lib/paths';

/**
 * Оболочка раздела «Задача с параметром»: общая шапка раздела (SectionHeader) и
 * липкая лента вкладок (RazdelTabs). Номер, заголовок, чипы, картинка и
 * кольцо прогресса — в шапке, одинаковой у всех разделов. Вызывается из
 * layout маршрута: при переходе между вкладками остаётся на месте.
 */
export function Shell19({ children }: { children: React.ReactNode }) {
  const base = `${ZADANIYA}/${ZADANIE19.slug}`;
  return (
    <AppShell active="tasks">
      <main className="app-main">
        <SectionHeader kod="parametr" />
        <RazdelTabs base={base} tabs={ZADANIE19.tabs} className="topic-tabs-row--stsena" bezPary />
        <div className="section-panel">{children}</div>
      </main>
    </AppShell>
  );
}
