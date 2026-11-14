import { AppShell } from '@/components/layout/AppShell';
import { RisunokRazdela, StsenaShapka, tabletkiRazdela } from '@/components/tasks/stsena';
import { STSENA } from '@/content/stsena';
import { RazdelTabs } from '@/components/tasks/RazdelTabs';
import { tasksPage } from '@/content/tasks';
import { ZADANIE14 } from '@/content/zadanie14';
import { ZADANIYA } from '@/lib/paths';

/**
 * Оболочка задания №14: крошки, заголовок и лента вкладок — то же
 * устройство, что у №11. Лента липнет сама (RazdelTabs).
 */
export function Shell14({ children }: { children: React.ReactNode }) {
  const base = `${ZADANIYA}/${ZADANIE14.slug}`;
  const no = String(Number(ZADANIE14.no));
  return (
    <AppShell active="tasks">
      <main className="app-main">
        <StsenaShapka
          crumbs={[
            { label: 'Главная', href: '/' },
            { label: 'Банк заданий', href: tasksPage.href },
            { label: `№${no}` },
          ]}
          title={ZADANIE14.title}
          lead={ZADANIE14.lead}
          tabletki={tabletkiRazdela({ chast: ZADANIE14.badge })}
          media={<RisunokRazdela no={no} label={`${STSENA.oblozhka}: ${ZADANIE14.title}`} />}
        />
        <RazdelTabs base={base} tabs={ZADANIE14.tabs} className="topic-tabs-row--stsena" />
        <div className="section-panel">{children}</div>
      </main>
    </AppShell>
  );
}
