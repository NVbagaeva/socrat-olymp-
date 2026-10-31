import { AppShell } from '@/components/layout/AppShell';
import { RazdelTabs } from '@/components/tasks/RazdelTabs';
import { ShapkaRazdela } from '@/components/tasks/ShapkaRazdela';
import { tasksPage } from '@/content/tasks';
import { ZADANIE19 } from '@/content/zadanie19';
import { ZADANIYA } from '@/lib/paths';

/**
 * Оболочка задания №19: крошки, заголовок и лента вкладок — то же
 * устройство, что у №16. Лента липнет сама (RazdelTabs).
 */
export function Shell19({ children }: { children: React.ReactNode }) {
  const base = `${ZADANIYA}/${ZADANIE19.slug}`;
  return (
    <AppShell active="tasks">
      <main className="app-main">
        <ShapkaRazdela
          className="z16-head"
          crumbs={[
            { label: 'Главная', href: '/' },
            { label: 'Банк заданий', href: tasksPage.href },
            { label: `№${Number(ZADANIE19.no)}` },
          ]}
          title={ZADANIE19.title}
          badge={ZADANIE19.badge}
          lead={ZADANIE19.lead}
        />
        <RazdelTabs base={base} tabs={ZADANIE19.tabs} />
        <div className="section-panel">{children}</div>
      </main>
    </AppShell>
  );
}
