import { AppShell } from '@/components/layout/AppShell';
import { RisunokRazdela, StsenaShapka, tabletkiRazdela } from '@/components/tasks/stsena';
import { STSENA } from '@/content/stsena';
import { RazdelTabs } from '@/components/tasks/RazdelTabs';
import { tasksPage } from '@/content/tasks';
import { ZADANIE19 } from '@/content/zadanie19';
import { ZADANIYA } from '@/lib/paths';

/**
 * Оболочка задания №19: крошки, заголовок и лента вкладок — то же
 * устройство, что у №16. Лента липнет сама (RazdelTabs).
 */
export function Shell19({ children }: { children: React.ReactNode }) {
  const base = `${ZADANIYA}/${ZADANIE19.slug}`;
  const no = String(Number(ZADANIE19.no));
  return (
    <AppShell active="tasks">
      <main className="app-main">
        <StsenaShapka
          crumbs={[
            { label: 'Главная', href: '/' },
            { label: 'Банк заданий', href: tasksPage.href },
            { label: `№${no}` },
          ]}
          title={ZADANIE19.title}
          lead={ZADANIE19.lead}
          tabletki={tabletkiRazdela({ chast: ZADANIE19.badge })}
          media={<RisunokRazdela no={no} label={`${STSENA.oblozhka}: ${ZADANIE19.title}`} />}
        />
        <RazdelTabs base={base} tabs={ZADANIE19.tabs} className="topic-tabs-row--stsena" />
        <div className="section-panel">{children}</div>
      </main>
    </AppShell>
  );
}
