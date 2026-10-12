import { AppShell } from '@/components/layout/AppShell';
import { tasksPage } from '@/content/tasks';
import { ZADANIE7 } from '@/content/zadanie7';
import { ZADANIYA } from '@/lib/paths';
import { IllyustratsiyaShapki } from '../IllyustratsiyaShapki';
import { RazdelTabs } from '../RazdelTabs';
import { ShapkaRazdela } from '../ShapkaRazdela';

/**
 * Оболочка задания №7: крошки, заголовок (со слотом иллюстрации —
 * только когда картинка есть) и липкая лента вкладок
 * (RazdelTabs). Вызывается из layout маршрута — при переходе между
 * вкладками остаётся на месте, как у №10 и №11.
 */
export function Shell7({ children }: { children: React.ReactNode }) {
  const base = `${ZADANIYA}/${ZADANIE7.slug}`;
  return (
    <AppShell active="tasks">
      <main className="app-main">
        <ShapkaRazdela
          className="z7-head"
          crumbs={[
            { label: 'Главная', href: '/' },
            { label: 'Банк заданий', href: tasksPage.href },
            { label: `№${Number(ZADANIE7.no)}` },
          ]}
          title={ZADANIE7.title}
          badge={ZADANIE7.badge}
          lead={ZADANIE7.lead}
          {...(ZADANIE7.art ? { media: <IllyustratsiyaShapki art={ZADANIE7.art} /> } : {})}
        />
        <RazdelTabs base={base} tabs={ZADANIE7.tabs} />
        <div className="section-panel">{children}</div>
      </main>
    </AppShell>
  );
}
