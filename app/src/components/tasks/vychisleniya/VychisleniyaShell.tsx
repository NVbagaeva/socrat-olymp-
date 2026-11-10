import { AppShell } from '@/components/layout/AppShell';
import { tasksPage } from '@/content/tasks';
import { VYCHISLENIYA } from '@/content/vychisleniya';
import { RazdelTabs } from '../RazdelTabs';
import { ShapkaRazdela } from '../ShapkaRazdela';
import { ZADANIYA } from '@/lib/paths';
import { HomeworkBanner8 } from '@/components/dz/Razdel8Dz';

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
          title={VYCHISLENIYA.title}
          badge={VYCHISLENIYA.badge}
          lead={VYCHISLENIYA.lead}
        />

        <RazdelTabs base={base} tabs={VYCHISLENIYA.tabs} tutors={VYCHISLENIYA.tutors} />

        <div className="section-panel">
          {/* Ученику со входом — «У вас домашнее задание до …». Гостю — ничего. */}
          <HomeworkBanner8 />
          {children}
        </div>
      </main>
    </AppShell>
  );
}
