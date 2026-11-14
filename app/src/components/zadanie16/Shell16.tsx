import { AppShell } from '@/components/layout/AppShell';
import { RisunokRazdela, StsenaShapka, tabletkiRazdela } from '@/components/tasks/stsena';
import { STSENA } from '@/content/stsena';
import { RazdelTabs } from '@/components/tasks/RazdelTabs';
import { tasksPage } from '@/content/tasks';
import { ZADANIE16 } from '@/content/zadanie16';
import { ZADANIYA } from '@/lib/paths';

/**
 * Оболочка задания №16: крошки, заголовок и лента вкладок — то же
 * устройство, что у №11. Лента липнет сама (RazdelTabs).
 */
export function Shell16({ children }: { children: React.ReactNode }) {
  const base = `${ZADANIYA}/${ZADANIE16.slug}`;
  const no = String(Number(ZADANIE16.no));
  return (
    <AppShell active="tasks">
      <main className="app-main">
        <StsenaShapka
          crumbs={[
            { label: 'Главная', href: '/' },
            { label: 'Банк заданий', href: tasksPage.href },
            { label: `№${no}` },
          ]}
          title={ZADANIE16.title}
          lead={ZADANIE16.lead}
          tabletki={tabletkiRazdela({ chast: ZADANIE16.badge })}
          media={<RisunokRazdela no={no} label={`${STSENA.oblozhka}: ${ZADANIE16.title}`} />}
        />
        <RazdelTabs base={base} tabs={ZADANIE16.tabs} className="topic-tabs-row--stsena" />
        <div className="section-panel">{children}</div>
      </main>
    </AppShell>
  );
}
