import { AppShell } from '@/components/layout/AppShell';
import { tasksPage } from '@/content/tasks';
import { nomerRazdela } from '@/content/struktura';
import { ZADANIE21 } from '@/content/zadanie21';
import { ZADANIYA } from '@/lib/paths';
import { RazdelTabs } from '../RazdelTabs';
import { ShapkaRazdela } from '../ShapkaRazdela';

/**
 * Оболочка раздела «Наибольшее и наименьшее значение функции»: крошки,
 * заголовок и лента вкладок. Вызывается из layout маршрута — при
 * переходе между вкладками остаётся на месте (как у №9).
 */
export function Shell21({ children }: { children: React.ReactNode }) {
  const base = `${ZADANIYA}/${ZADANIE21.slug}`;
  return (
    <AppShell active="tasks">
      <main className="app-main">
        <ShapkaRazdela
          className="z21-head"
          crumbs={[
            { label: 'Главная', href: '/' },
            { label: 'Банк заданий', href: tasksPage.href },
            { label: `№${nomerRazdela('naibolshee-naimenshee')}` },
          ]}
          title={ZADANIE21.title}
          badge={ZADANIE21.badge}
          lead={ZADANIE21.lead}
        />
        <RazdelTabs base={base} tabs={ZADANIE21.tabs} />
        <div className="section-panel">{children}</div>
      </main>
    </AppShell>
  );
}
