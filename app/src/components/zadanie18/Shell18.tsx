import { AppShell } from '@/components/layout/AppShell';
import { SectionHeader } from '@/components/tasks/shapka/SectionHeader';
import { RazdelTabs } from '@/components/tasks/RazdelTabs';
import { ZADANIE18 } from '@/content/zadanie18';
import { ZADANIYA } from '@/lib/paths';
import { Perenos18 } from './Perenos18';

/**
 * Оболочка раздела «Планиметрия» (часть 2): общая шапка раздела (SectionHeader) и
 * липкая лента вкладок (RazdelTabs). Номер, заголовок, чипы, картинка и
 * кольцо прогресса — в шапке, одинаковой у всех разделов. Вызывается из
 * layout маршрута: при переходе между вкладками остаётся на месте.
 */
export function Shell18({ children }: { children: React.ReactNode }) {
  const base = `${ZADANIYA}/${ZADANIE18.slug}`;
  return (
    <AppShell active="tasks">
      <main className="app-main">
        <SectionHeader kod="planimetriya-dokazatelstvo" />
        <RazdelTabs base={base} tabs={ZADANIE18.tabs} className="topic-tabs-row--stsena" bezPary />
        <div className="section-panel">{children}</div>
        <Perenos18 />
      </main>
    </AppShell>
  );
}
