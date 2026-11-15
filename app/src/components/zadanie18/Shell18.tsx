import { AppShell } from '@/components/layout/AppShell';
import { RisunokRazdela, StsenaShapka, tabletkiRazdela } from '@/components/tasks/stsena';
import { STSENA } from '@/content/stsena';
import { RazdelTabs } from '@/components/tasks/RazdelTabs';
import { tasksPage } from '@/content/tasks';
import { ZADANIE18 } from '@/content/zadanie18';
import { ZADANIYA } from '@/lib/paths';
import { Perenos18 } from './Perenos18';

/**
 * Оболочка задания №18: крошки, заголовок и лента вкладок — то же
 * устройство, что у №16. Лента липнет сама (RazdelTabs).
 */
export function Shell18({ children }: { children: React.ReactNode }) {
  const base = `${ZADANIYA}/${ZADANIE18.slug}`;
  const no = String(Number(ZADANIE18.no));
  return (
    <AppShell active="tasks">
      <main className="app-main">
        <StsenaShapka
          crumbs={[
            { label: 'Главная', href: '/' },
            { label: 'Банк заданий', href: tasksPage.href },
            { label: `№${no}` },
          ]}
          title={ZADANIE18.title}
          lead={ZADANIE18.lead}
          tabletki={tabletkiRazdela({ chast: ZADANIE18.badge })}
          media={<RisunokRazdela no={no} label={`${STSENA.oblozhka}: ${ZADANIE18.title}`} />}
        />
        <RazdelTabs base={base} tabs={ZADANIE18.tabs} className="topic-tabs-row--stsena" />
        <div className="section-panel">{children}</div>
        <Perenos18 />
      </main>
    </AppShell>
  );
}
