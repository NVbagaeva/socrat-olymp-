import { AppShell } from '@/components/layout/AppShell';
import { Badge, Breadcrumbs } from '@/components/ui';
import { tasksPage } from '@/content/tasks';
import { VYCHISLENIYA } from '@/content/vychisleniya';
import { VychisleniyaTabs } from './VychisleniyaTabs';

/**
 * Оболочка задания №8: крошки, заголовок и лента вкладок.
 *
 * Вызывается из layout маршрута: при переходе между вкладками React
 * оставляет оболочку на месте. Устройство то же, что у №4, но
 * компонент свой: общие компоненты других заданий не правятся.
 */
export function VychisleniyaShell({ children }: { children: React.ReactNode }) {
  const base = `${tasksPage.href}/${VYCHISLENIYA.slug}`;

  return (
    <AppShell active="tasks">
      <main className="app-main">
        <Breadcrumbs
          items={[
            { label: 'Главная', href: '/' },
            { label: 'Банк заданий', href: tasksPage.href },
            { label: `№${Number(VYCHISLENIYA.no)}` },
          ]}
        />

        <header className="section-head z8-head">
          <div className="section-head__text">
            <div className="section-head__title">
              <h1 className="t-h1">{VYCHISLENIYA.title}</h1>
              <Badge tone="info">{VYCHISLENIYA.badge}</Badge>
            </div>
            <p className="section-head__lead">{VYCHISLENIYA.lead}</p>
          </div>
        </header>

        <VychisleniyaTabs base={base} tabs={VYCHISLENIYA.tabs} tutors={VYCHISLENIYA.tutors} />

        <div className="section-panel">{children}</div>
      </main>
    </AppShell>
  );
}
