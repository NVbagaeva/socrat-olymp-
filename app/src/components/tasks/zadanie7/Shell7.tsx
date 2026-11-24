import { AppShell } from '@/components/layout/AppShell';
import { SectionHeader } from '@/components/tasks/shapka/SectionHeader';
import { ZADANIE7 } from '@/content/zadanie7';
import { razdelBase } from '@/lib/paths';
import { RazdelTabs } from '../RazdelTabs';
import './shell7.css';

/**
 * Оболочка раздела «Уравнения»: общая шапка раздела (SectionHeader) и
 * липкая лента вкладок (RazdelTabs). Номер, заголовок, чипы, картинка и
 * кольцо прогресса — в шапке, одинаковой у всех разделов. Вызывается из
 * layout маршрута: при переходе между вкладками остаётся на месте.
 */
export function Shell7({ children }: { children: React.ReactNode }) {
  const base = `${razdelBase(ZADANIE7.slug)}`;
  return (
    <AppShell active="tasks">
      <main className="app-main">
        <div className="z7-shell">
          <SectionHeader kod="uravneniya" />
          <RazdelTabs base={base} tabs={ZADANIE7.tabs} className="topic-tabs-row--stsena" bezPary />
          <div className="section-panel">{children}</div>
        </div>
      </main>
    </AppShell>
  );
}
