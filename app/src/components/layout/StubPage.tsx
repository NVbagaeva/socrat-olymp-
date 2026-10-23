import { AppShell } from '@/components/layout/AppShell';
import { Breadcrumbs, EmptyState } from '@/components/ui';
import { tasksPage } from '@/content/tasks';

export interface StubPageProps {
  /** Заголовок раздела: он же последняя хлебная крошка. */
  title: string;
  /** id пункта меню, который подсвечивается. */
  active?: string;
}

/**
 * Страница раздела, которого ещё нет.
 *
 * Одна на все такие разделы: маршрут заявлен, ссылка ведёт по адресу,
 * а честное «Раздел в разработке» не изображает содержимого, которого
 * нет. Когда раздел появится, его страница пишется на месте вызова.
 */
export function StubPage({ title, active }: StubPageProps) {
  return (
    <AppShell active={active}>
      <main className="app-main">
        <Breadcrumbs items={[{ label: 'Главная', href: '/' }, { label: title }]} />
        <h1 className="t-h1 stub__title">{title}</h1>
        {/* Спокойно и без обещаний: что именно здесь будет, не пишем. */}
        <EmptyState
          title="Раздел в разработке"
          description="Здесь пока ничего нет. Всё готовое — в банке заданий."
          action={
            <a className="btn btn--secondary" href={tasksPage.href}>
              Открыть банк заданий
            </a>
          }
        />
      </main>
    </AppShell>
  );
}
