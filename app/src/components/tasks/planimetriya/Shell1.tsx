import { AppShell } from '@/components/layout/AppShell';
import { tasksPage } from '@/content/tasks';
import { RAZDELY_TEORII_1 } from '@/content/teoriya1';
import { ZADANIE1 } from '@/content/zadanie1';
import { ZADANIYA } from '@/lib/paths';
import { RazdelTabs } from '../RazdelTabs';
import { ShapkaRazdela } from '../ShapkaRazdela';
import { Progress1 } from './Progress1';

/**
 * Оболочка задания №1: крошки, заголовок, кольцо прогресса и лента
 * вкладок — устройство то же, что у №2 и №11. Вызывается из layout
 * маршрута: при переходе между вкладками остаётся на месте.
 */
export function Shell1({ children }: { children: React.ReactNode }) {
  const base = `${ZADANIYA}/${ZADANIE1.slug}`;
  return (
    <AppShell active="tasks">
      <main className="app-main">
        <ShapkaRazdela
          className="z1-head"
          crumbs={[
            { label: 'Главная', href: '/' },
            { label: 'Банк заданий', href: tasksPage.href },
            { label: `№${Number(ZADANIE1.no)}` },
          ]}
          title={ZADANIE1.title}
          badge={ZADANIE1.badge}
          lead={ZADANIE1.lead}
          media={<Progress1 razdely={RAZDELY_TEORII_1.map((r) => r.id)} />}
        />
        <RazdelTabs base={base} tabs={ZADANIE1.tabs} />
        <div className="section-panel">{children}</div>
      </main>
    </AppShell>
  );
}
