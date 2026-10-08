import Link from 'next/link';
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
 * а честное «Раздел готовится» не изображает содержимого, которого
 * нет. Когда раздел появится, его страница пишется на месте вызова.
 */
export function StubPage({ title, active }: StubPageProps) {
  return (
    <AppShell active={active}>
      <main className="app-main">
        <Breadcrumbs items={[{ label: 'Главная', href: '/' }, { label: title }]} />
        <h1 className="t-h1 stub__title">{title}</h1>
        {/* Те же слова, что у заглушки неоткрытого задания: состояние
            «в разработке» на сайте одно. */}
        <EmptyState
          title={tasksPage.stub.title}
          description="Этой страницы ещё нет. Пока можно заниматься открытыми заданиями."
          action={
            <Link className="btn btn--primary" href={tasksPage.href}>
              {tasksPage.stub.action}
            </Link>
          }
        />
      </main>
    </AppShell>
  );
}
