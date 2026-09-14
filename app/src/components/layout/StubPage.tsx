import { AppShell } from '@/components/layout/AppShell';
import { Breadcrumbs, EmptyState } from '@/components/ui';

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
 * а честное «Раздел готовится» не изображает содержимого, которого
 * нет. Когда раздел появится, его страница пишется на месте вызова.
 */
export function StubPage({ title, active }: StubPageProps) {
  return (
    <AppShell active={active}>
      <main className="app-main">
        <Breadcrumbs items={[{ label: 'Главная', href: '/' }, { label: title }]} />
        <h1 className="t-h1 stub__title">{title}</h1>
        <EmptyState
          title="Раздел готовится"
          description="Этой страницы ещё нет. Она появится, когда раздел будет собран."
        />
      </main>
    </AppShell>
  );
}
