import { AppShell } from '@/components/layout/AppShell';
import { tasksPage } from '@/content/tasks';
import { ZADANIE6 } from '@/content/zadanie6';
import { ZADANIYA } from '@/lib/paths';
import { IllyustratsiyaShapki } from '../IllyustratsiyaShapki';
import { RazdelTabs } from '../RazdelTabs';
import { ShapkaRazdela } from '../ShapkaRazdela';

/**
 * Оболочка задания №6: крошки, заголовок (со слотом иллюстрации —
 * только когда картинка есть) и липкая лента вкладок (RazdelTabs).
 * Вызывается из layout маршрута — при переходе между вкладками остаётся
 * на месте, как у №7 и №10.
 */
export function Shell6({ children }: { children: React.ReactNode }) {
  const base = `${ZADANIYA}/${ZADANIE6.slug}`;
  return (
    <AppShell active="tasks">
      <main className="app-main">
        <ShapkaRazdela
          className="z6-head"
          crumbs={[
            { label: 'Главная', href: '/' },
            { label: 'Банк заданий', href: tasksPage.href },
            { label: `№${Number(ZADANIE6.no)}` },
          ]}
          title={ZADANIE6.title}
          badge={ZADANIE6.badge}
          lead={ZADANIE6.lead}
          {...(ZADANIE6.art ? { media: <IllyustratsiyaShapki art={ZADANIE6.art} /> } : {})}
        />
        <RazdelTabs base={base} tabs={ZADANIE6.tabs} />
        <div className="section-panel">{children}</div>
      </main>
    </AppShell>
  );
}
