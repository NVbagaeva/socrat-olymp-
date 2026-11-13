import { AppShell } from '@/components/layout/AppShell';
import { RisunokRazdela, StsenaShapka, tabletkiRazdela } from '@/components/tasks/stsena';
import { STSENA } from '@/content/stsena';
import { tasksPage } from '@/content/tasks';
import { ZADANIE13 } from '@/content/zadanie13';
import { ZADANIYA } from '@/lib/paths';
import { RazdelTabs } from '../RazdelTabs';

/**
 * Оболочка задания №13: крошки, заголовок и липкая лента вкладок —
 * устройство то же, что у №11. Вызывается из layout маршрута, поэтому
 * при переходе между вкладками остаётся на месте.
 */
export function Shell13({ children }: { children: React.ReactNode }) {
  const base = `${ZADANIYA}/${ZADANIE13.slug}`;
  const no = String(Number(ZADANIE13.no));
  return (
    <AppShell active="tasks">
      <main className="app-main">
        <StsenaShapka
          crumbs={[
            { label: 'Главная', href: '/' },
            { label: 'Банк заданий', href: tasksPage.href },
            { label: `№${no}` },
          ]}
          title={ZADANIE13.title}
          lead={ZADANIE13.lead}
          tabletki={tabletkiRazdela({ chast: ZADANIE13.badge })}
          media={<RisunokRazdela no={no} label={`${STSENA.oblozhka}: ${ZADANIE13.title}`} />}
        />
        <RazdelTabs base={base} tabs={ZADANIE13.tabs} className="topic-tabs-row--stsena" />
        <div className="section-panel">{children}</div>
      </main>
    </AppShell>
  );
}
