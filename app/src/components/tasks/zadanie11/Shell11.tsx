import { AppShell } from '@/components/layout/AppShell';
import { StsenaShapka, tabletkiRazdela } from '@/components/tasks/stsena';
import { RAZDELY_TEORII_11 } from '@/content/teoriya11';
import { tasksPage } from '@/content/tasks';
import { ZADANIE11 } from '@/content/zadanie11';
import { RazdelTabs } from '../RazdelTabs';
import { BLOKI } from '@/lib/zadanie11/prep/bloki';
import { SUBTYPES } from '@/lib/zadanie11/prototypes';
import { Progress11 } from './Progress11';
import { ZADANIYA } from '@/lib/paths';

/**
 * Оболочка задания №11: шапка «Стеклянная сцена», кольцо прогресса и
 * лента вкладок — устройство то же, что у №2. Вызывается из layout
 * маршрута: при переходе между вкладками остаётся на месте.
 *
 * Кольцо остаётся справа, на месте обложки: мотив раздела занял бы его
 * место, а прогресс важнее.
 */
export function Shell11({ children }: { children: React.ReactNode }) {
  const base = `${ZADANIYA}/${ZADANIE11.slug}`;
  return (
    <AppShell active="tasks">
      <main className="app-main">
        <StsenaShapka
          crumbs={[
            { label: 'Главная', href: '/' },
            { label: 'Банк заданий', href: tasksPage.href },
            { label: `№${Number(ZADANIE11.no)}` },
          ]}
          title={ZADANIE11.title}
          lead={ZADANIE11.lead}
          tabletki={tabletkiRazdela({ chast: ZADANIE11.badge })}
          media={
            <Progress11
              razdely={RAZDELY_TEORII_11.map((r) => r.id)}
              bloki={BLOKI.map((b) => ({ id: b.id, total: b.zadachi.length }))}
              podtipy={SUBTYPES.map((st) => st.id)}
            />
          }
        />
        <RazdelTabs base={base} tabs={ZADANIE11.tabs} className="topic-tabs-row--stsena" />
        <div className="section-panel">{children}</div>
      </main>
    </AppShell>
  );
}
