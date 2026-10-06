import { AppShell } from '@/components/layout/AppShell';
import { RAZDELY_TEORII_11 } from '@/content/teoriya11';
import { tasksPage } from '@/content/tasks';
import { ZADANIE11 } from '@/content/zadanie11';
import { RazdelTabs } from '../RazdelTabs';
import { ShapkaRazdela } from '../ShapkaRazdela';
import { Progress11 } from './Progress11';

/**
 * Оболочка задания №11: крошки, заголовок, кольцо прогресса и лента
 * вкладок — устройство то же, что у №2. Вызывается из layout
 * маршрута: при переходе между вкладками остаётся на месте.
 */
export function Shell11({ children }: { children: React.ReactNode }) {
  const base = `${tasksPage.href}/${ZADANIE11.slug}`;
  return (
    <AppShell active="tasks">
      <main className="app-main">
        <ShapkaRazdela
          className="z11-head"
          crumbs={[
            { label: 'Главная', href: '/' },
            { label: 'Банк заданий', href: tasksPage.href },
            { label: `№${Number(ZADANIE11.no)}` },
          ]}
          title={ZADANIE11.title}
          badge={ZADANIE11.badge}
          lead={ZADANIE11.lead}
          media={<Progress11 razdely={RAZDELY_TEORII_11.map((r) => r.id)} />}
        />
        <RazdelTabs base={base} tabs={ZADANIE11.tabs} />
        <div className="section-panel">{children}</div>
      </main>
    </AppShell>
  );
}
