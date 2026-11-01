import { AppShell } from '@/components/layout/AppShell';
import { tasksPage } from '@/content/tasks';
import { VYCHISLENIYA } from '@/content/vychisleniya';
import { RazdelTabs } from '../RazdelTabs';
import { ShapkaRazdela } from '../ShapkaRazdela';
import { ZADANIYA } from '@/lib/paths';
import { zagolovokRazdela } from '@/content/seo';
import { RazdelJsonLd } from '@/components/seo/RazdelJsonLd';

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
        <RazdelJsonLd no={8} slug="8" />
        <ShapkaRazdela
          className="z8-head"
          crumbs={[
            { label: 'Главная', href: '/' },
            { label: 'Банк заданий', href: tasksPage.href },
            { label: `№${Number(VYCHISLENIYA.no)}` },
          ]}
          title={zagolovokRazdela(8, VYCHISLENIYA.title)}
          badge={VYCHISLENIYA.badge}
          lead={VYCHISLENIYA.lead}
        />

        <RazdelTabs base={base} tabs={VYCHISLENIYA.tabs} tutors={VYCHISLENIYA.tutors} />

        <div className="section-panel">{children}</div>
      </main>
    </AppShell>
  );
}
