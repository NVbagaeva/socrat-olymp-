import { AppShell } from '@/components/layout/AppShell';
import { RisunokRazdela, StsenaShapka, tabletkiRazdela } from '@/components/tasks/stsena';
import { STSENA } from '@/content/stsena';
import { tasksPage } from '@/content/tasks';
import { ZADANIE10 } from '@/content/zadanie10';
import { ZADANIYA } from '@/lib/paths';
import { RazdelTabs } from '../RazdelTabs';

/**
 * Оболочка задания №10: крошки, заголовок и липкая лента вкладок
 * (RazdelTabs). Вызывается из layout маршрута — при переходе между
 * вкладками остаётся на месте, как у №11.
 */
export function Shell10({ children }: { children: React.ReactNode }) {
  const base = `${ZADANIYA}/${ZADANIE10.slug}`;
  const no = String(Number(ZADANIE10.no));
  return (
    <AppShell active="tasks">
      <main className="app-main">
        <StsenaShapka
          crumbs={[
            { label: 'Главная', href: '/' },
            { label: 'Банк заданий', href: tasksPage.href },
            { label: `№${no}` },
          ]}
          title={ZADANIE10.title}
          lead={ZADANIE10.lead}
          tabletki={tabletkiRazdela({ chast: ZADANIE10.badge })}
          media={<RisunokRazdela no={no} label={`${STSENA.oblozhka}: ${ZADANIE10.title}`} />}
        />
        <RazdelTabs base={base} tabs={ZADANIE10.tabs} className="topic-tabs-row--stsena" />
        <div className="section-panel">{children}</div>
      </main>
    </AppShell>
  );
}
