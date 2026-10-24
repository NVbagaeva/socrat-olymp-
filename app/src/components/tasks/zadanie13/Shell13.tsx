import { AppShell } from '@/components/layout/AppShell';
import { tasksPage } from '@/content/tasks';
import { ZADANIE13 } from '@/content/zadanie13';
import { ZADANIYA } from '@/lib/paths';
import { RazdelTabs } from '../RazdelTabs';
import { ShapkaRazdela } from '../ShapkaRazdela';

/**
 * Оболочка задания №13: крошки, заголовок и липкая лента вкладок —
 * устройство то же, что у №11. Вызывается из layout маршрута, поэтому
 * при переходе между вкладками остаётся на месте.
 */
export function Shell13({ children }: { children: React.ReactNode }) {
  const base = `${ZADANIYA}/${ZADANIE13.slug}`;
  return (
    <AppShell active="tasks">
      <main className="app-main">
        <ShapkaRazdela
          className="z13-head"
          crumbs={[
            { label: 'Главная', href: '/' },
            { label: 'Банк заданий', href: tasksPage.href },
            { label: `№${Number(ZADANIE13.no)}` },
          ]}
          title={ZADANIE13.title}
          badge={ZADANIE13.badge}
          lead={ZADANIE13.lead}
        />
        <RazdelTabs base={base} tabs={ZADANIE13.tabs} />
        <div className="section-panel">{children}</div>
      </main>
    </AppShell>
  );
}
