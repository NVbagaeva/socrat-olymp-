import { AppShell } from '@/components/layout/AppShell';
import { SectionHeader } from '@/components/tasks/shapka/SectionHeader';
import { ZADANIE13 } from '@/content/zadanie13';
import { razdelBase } from '@/lib/paths';
import { RazdelTabs } from '../RazdelTabs';

/**
 * Оболочка раздела «Финансовая грамотность»: общая шапка раздела (SectionHeader) и
 * липкая лента вкладок (RazdelTabs). Номер, заголовок, чипы, картинка и
 * кольцо прогресса — в шапке, одинаковой у всех разделов. Вызывается из
 * layout маршрута: при переходе между вкладками остаётся на месте.
 */
export function Shell13({ children }: { children: React.ReactNode }) {
  const base = `${razdelBase(ZADANIE13.slug)}`;
  return (
    <AppShell active="tasks">
      <main className="app-main">
        <SectionHeader kod="ekonomika" />
        <RazdelTabs base={base} tabs={ZADANIE13.tabs} className="topic-tabs-row--stsena" bezPary />
        <div className="section-panel">{children}</div>
      </main>
    </AppShell>
  );
}
