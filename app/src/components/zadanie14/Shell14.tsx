import { AppShell } from '@/components/layout/AppShell';
import { RazdelTabs } from '@/components/tasks/RazdelTabs';
import { ShapkaRazdela } from '@/components/tasks/ShapkaRazdela';
import { tasksPage } from '@/content/tasks';
import { ZADANIE14 } from '@/content/zadanie14';
import { ZADANIYA } from '@/lib/paths';

/**
 * Оболочка задания №14: крошки, заголовок и лента вкладок — то же
 * устройство, что у №11. Лента липнет сама (RazdelTabs).
 */
export function Shell14({ children }: { children: React.ReactNode }) {
  const base = `${ZADANIYA}/${ZADANIE14.slug}`;
  return (
    <AppShell active="tasks">
      <main className="app-main">
        <ShapkaRazdela
          className="z14-head"
          crumbs={[
            { label: 'Главная', href: '/' },
            { label: 'Банк заданий', href: tasksPage.href },
            { label: `№${Number(ZADANIE14.no)}` },
          ]}
          title={ZADANIE14.title}
          badge={ZADANIE14.badge}
          lead={ZADANIE14.lead}
        />
        <RazdelTabs base={base} tabs={ZADANIE14.tabs} />
        <div className="section-panel">{children}</div>
      </main>
    </AppShell>
  );
}
