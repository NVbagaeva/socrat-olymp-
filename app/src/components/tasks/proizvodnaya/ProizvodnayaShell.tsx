import { AppShell } from '@/components/layout/AppShell';
import { RisunokRazdela, StsenaShapka, tabletkiRazdela } from '@/components/tasks/stsena';
import { STSENA } from '@/content/stsena';
import { tasksPage } from '@/content/tasks';
import { PROIZVODNAYA } from '@/content/proizvodnaya';
import { ZADANIYA } from '@/lib/paths';
import { RazdelTabs } from '../RazdelTabs';

/**
 * Оболочка задания №9: крошки, заголовок и лента вкладок. Вызывается
 * из layout маршрута — при переходе между вкладками остаётся на месте.
 * Устройство то же, что у №2 и №8: лента вкладок липкая, правил
 * `position` здесь нет.
 */
export function ProizvodnayaShell({ children }: { children: React.ReactNode }) {
  const base = `${ZADANIYA}/${PROIZVODNAYA.slug}`;
  const no = String(Number(PROIZVODNAYA.no));

  return (
    <AppShell active="tasks">
      <main className="app-main">
        <StsenaShapka
          crumbs={[
            { label: 'Главная', href: '/' },
            { label: 'Банк заданий', href: tasksPage.href },
            { label: `№${no}` },
          ]}
          title={PROIZVODNAYA.title}
          lead={PROIZVODNAYA.lead}
          tabletki={tabletkiRazdela({ chast: PROIZVODNAYA.badge })}
          media={<RisunokRazdela no={no} label={`${STSENA.oblozhka}: ${PROIZVODNAYA.title}`} />}
        />

        <RazdelTabs
          base={base}
          tabs={PROIZVODNAYA.tabs}
          className="topic-tabs-row--stsena"
          {...(PROIZVODNAYA.tutors.items.length === 0 ? {} : { tutors: PROIZVODNAYA.tutors })}
        />

        <div className="section-panel">{children}</div>
      </main>
    </AppShell>
  );
}
