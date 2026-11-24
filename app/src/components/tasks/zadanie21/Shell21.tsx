import { AppShell } from '@/components/layout/AppShell';
import { SectionHeader } from '@/components/tasks/shapka/SectionHeader';
import { ZADANIE21 } from '@/content/zadanie21';
import { razdelBase } from '@/lib/paths';
import { RazdelTabs } from '../RazdelTabs';

/**
 * Оболочка раздела «Наибольшее и наименьшее значение функции»: общая
 * шапка раздела (SectionHeader) и лента вкладок. Вызывается из layout
 * маршрута — при переходе между вкладками остаётся на месте.
 */
export function Shell21({ children }: { children: React.ReactNode }) {
  const base = `${razdelBase(ZADANIE21.slug)}`;
  return (
    <AppShell active="tasks">
      <main className="app-main">
        <SectionHeader kod="naibolshee-naimenshee" />
        <RazdelTabs base={base} tabs={ZADANIE21.tabs} className="topic-tabs-row--stsena" bezPary />
        <div className="section-panel">{children}</div>
      </main>
    </AppShell>
  );
}
