import { AppShell } from '@/components/layout/AppShell';
import { tasksPage } from '@/content/tasks';
import { ZADANIE10 } from '@/content/zadanie10';
import { ZADANIYA } from '@/lib/paths';
import { RazdelTabs } from '../RazdelTabs';
import { ShapkaRazdela } from '../ShapkaRazdela';

/**
 * Оболочка задания №10: крошки, заголовок и липкая лента вкладок
 * (RazdelTabs). Вызывается из layout маршрута — при переходе между
 * вкладками остаётся на месте, как у №11.
 */
export function Shell10({ children }: { children: React.ReactNode }) {
  const base = `${ZADANIYA}/${ZADANIE10.slug}`;
  return (
    <AppShell active="tasks">
      <main className="app-main">
        <ShapkaRazdela
          className="z10-head"
          crumbs={[
            { label: 'Главная', href: '/' },
            { label: 'Банк заданий', href: tasksPage.href },
            { label: `№${Number(ZADANIE10.no)}` },
          ]}
          title={ZADANIE10.title}
          badge={ZADANIE10.badge}
          lead={ZADANIE10.lead}
        />
        <RazdelTabs base={base} tabs={ZADANIE10.tabs} />
        <div className="section-panel">{children}</div>
      </main>
    </AppShell>
  );
}
