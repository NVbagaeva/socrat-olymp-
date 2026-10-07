import { AppShell } from '@/components/layout/AppShell';
import { tasksPage } from '@/content/tasks';
import { VYCHISLENIYA } from '@/content/vychisleniya';
import { RazdelTabs } from '../RazdelTabs';
import { ShapkaRazdela } from '../ShapkaRazdela';
import { ZADANIYA } from '@/lib/paths';

/**
 * Оболочка задания №8: крошки, заголовок и лента вкладок.
 *
 * Вызывается из layout маршрута: при переходе между вкладками React
 * оставляет оболочку на месте. Устройство то же, что у №4, но
 * компонент свой: общие компоненты других заданий не правятся.
 */
export function VychisleniyaShell({ children }: { children: React.ReactNode }) {
  const base = `${ZADANIYA}/${VYCHISLENIYA.slug}`;

  return (
    <AppShell active="tasks">
      <main className="app-main">
        <ShapkaRazdela
          className="z8-head"
          crumbs={[
            { label: 'Главная', href: '/' },
            { label: 'Банк заданий', href: tasksPage.href },
            { label: `№${Number(VYCHISLENIYA.no)}` },
          ]}
          /* «Задание №8. Вычисления и преобразования» — как у №4, №5 и №12. */
          title={`Задание №${Number(VYCHISLENIYA.no)}. ${VYCHISLENIYA.title}`}
          badge={VYCHISLENIYA.badge}
          lead={VYCHISLENIYA.lead}
        />

        <RazdelTabs base={base} tabs={VYCHISLENIYA.tabs} tutors={VYCHISLENIYA.tutors} />

        <div className="section-panel">{children}</div>
      </main>
    </AppShell>
  );
}
