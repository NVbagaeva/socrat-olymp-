import { AppShell } from '@/components/layout/AppShell';
import { SectionHeader } from '@/components/tasks/shapka/SectionHeader';
import { ZADANIE10 } from '@/content/zadanie10';
import { razdelBase } from '@/lib/paths';
import { RazdelTabs } from '../RazdelTabs';
import './shell10.css';

/**
 * Оболочка раздела «Задачи с физическим смыслом»: общая шапка раздела (SectionHeader) и
 * липкая лента вкладок (RazdelTabs). Номер, заголовок, чипы, картинка и
 * кольцо прогресса — в шапке, одинаковой у всех разделов. Вызывается из
 * layout маршрута: при переходе между вкладками остаётся на месте.
 */
export function Shell10({ children }: { children: React.ReactNode }) {
  const base = `${razdelBase(ZADANIE10.slug)}`;
  return (
    <AppShell active="tasks">
      <main className="app-main">
        <div className="z10-shell">
          <SectionHeader kod="prikladnye-zadachi" />
          <RazdelTabs
            base={base}
            tabs={ZADANIE10.tabs}
            className="topic-tabs-row--stsena"
            bezPary
          />
          <div className="section-panel">{children}</div>
        </div>
      </main>
    </AppShell>
  );
}
