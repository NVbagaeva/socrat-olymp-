import Link from 'next/link';
import { AppShell } from '@/components/layout/AppShell';
import { Breadcrumbs, EmptyState, type Crumb } from '@/components/ui';

export interface StubPageProps {
  /** Заголовок раздела: он же последняя хлебная крошка. */
  title: string;
  /** id пункта меню, который подсвечивается. */
  active?: string;
  /** Своя цепочка крошек. Не задана — «Главная / {title}». */
  crumbs?: Crumb[];
  /** Заголовок пустого состояния. Не задан — «Раздел готовится». */
  stateTitle?: string;
  /** Текст пустого состояния. */
  stateText?: string;
  /** Ссылка «назад» под пустым состоянием. */
  back?: { label: string; href: string };
}

/**
 * Страница раздела, которого ещё нет.
 *
 * Одна на все такие разделы: маршрут заявлен, ссылка ведёт по адресу,
 * а честное «Раздел готовится» не изображает содержимого, которого
 * нет. Когда раздел появится, его страница пишется на месте вызова.
 */
export function StubPage({
  title,
  active,
  crumbs,
  stateTitle = 'Раздел готовится',
  stateText = 'Этой страницы ещё нет. Она появится, когда раздел будет собран.',
  back,
}: StubPageProps) {
  return (
    <AppShell active={active}>
      <main className="app-main">
        <Breadcrumbs items={crumbs ?? [{ label: 'Главная', href: '/' }, { label: title }]} />
        <h1 className="t-h1 stub__title">{title}</h1>
        <EmptyState
          title={stateTitle}
          description={stateText}
          action={
            back === undefined ? undefined : (
              <Link className="btn btn--secondary" href={back.href}>
                {back.label}
              </Link>
            )
          }
        />
      </main>
    </AppShell>
  );
}
