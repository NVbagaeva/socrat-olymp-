import { AppShell } from '@/components/layout/AppShell';
import { RazdelTabs } from '@/components/tasks/RazdelTabs';
import { ShapkaRazdela } from '@/components/tasks/ShapkaRazdela';
import { tasksPage } from '@/content/tasks';
import { ZADANIE18 } from '@/content/zadanie18';
import { ZADANIYA } from '@/lib/paths';

/**
 * Оболочка задания №18: крошки, заголовок и лента вкладок — то же
 * устройство, что у №16. Лента липнет сама (RazdelTabs).
 */
export function Shell18({ children }: { children: React.ReactNode }) {
  const base = `${ZADANIYA}/${ZADANIE18.slug}`;
  return (
    <AppShell active="tasks">
      <main className="app-main">
        <ShapkaRazdela
          className="z18-head"
          crumbs={[
            { label: 'Главная', href: '/' },
            { label: 'Банк заданий', href: tasksPage.href },
            { label: `№${Number(ZADANIE18.no)}` },
          ]}
          title={ZADANIE18.title}
          badge={ZADANIE18.badge}
          lead={ZADANIE18.lead}
        />
        <RazdelTabs base={base} tabs={ZADANIE18.tabs} />
        <div className="section-panel">{children}</div>
      </main>
    </AppShell>
  );
}
