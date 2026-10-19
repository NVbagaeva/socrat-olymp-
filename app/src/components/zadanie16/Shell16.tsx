import { AppShell } from '@/components/layout/AppShell';
import { RazdelTabs } from '@/components/tasks/RazdelTabs';
import { ShapkaRazdela } from '@/components/tasks/ShapkaRazdela';
import { tasksPage } from '@/content/tasks';
import { ZADANIE16 } from '@/content/zadanie16';
import { ZADANIYA } from '@/lib/paths';

/**
 * Оболочка задания №16: крошки, заголовок и лента вкладок — то же
 * устройство, что у №11. Лента липнет сама (RazdelTabs).
 */
export function Shell16({ children }: { children: React.ReactNode }) {
  const base = `${ZADANIYA}/${ZADANIE16.slug}`;
  return (
    <AppShell active="tasks">
      <main className="app-main">
        <ShapkaRazdela
          className="z16-head"
          crumbs={[
            { label: 'Главная', href: '/' },
            { label: 'Банк заданий', href: tasksPage.href },
            { label: `№${Number(ZADANIE16.no)}` },
          ]}
          title={ZADANIE16.title}
          badge={ZADANIE16.badge}
          lead={ZADANIE16.lead}
        />
        <RazdelTabs base={base} tabs={ZADANIE16.tabs} />
        <div className="section-panel">{children}</div>
      </main>
    </AppShell>
  );
}
