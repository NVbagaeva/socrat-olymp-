import { AppShell } from '@/components/layout/AppShell';
import { RazdelTabs } from '@/components/tasks/RazdelTabs';
import { SectionHeader } from '@/components/tasks/shapka/SectionHeader';
import { ZADANIE14 } from '@/content/zadanie14';
import { ZADANIYA } from '@/lib/paths';

/**
 * Оболочка раздела «Уравнение» (вторая часть): общая шапка раздела
 * (SectionHeader) и лента вкладок. Лента липнет сама (RazdelTabs).
 */
export function Shell14({ children }: { children: React.ReactNode }) {
  const base = `${ZADANIYA}/${ZADANIE14.slug}`;
  return (
    <AppShell active="tasks">
      <main className="app-main">
        <SectionHeader kod="uravnenie-s-otborom" />
        <RazdelTabs base={base} tabs={ZADANIE14.tabs} className="topic-tabs-row--stsena" bezPary />
        <div className="section-panel">{children}</div>
      </main>
    </AppShell>
  );
}
