import type { Metadata } from 'next';
import Link from 'next/link';
import { AppShell } from '@/components/layout/AppShell';
import { TrajectoryIcon } from '@/components/ui/StateIcons';
import { taskHref, tasks, tasksPage } from '@/content/tasks';
import { VARIANT_HREF } from '@/content/variant';
import './not-found.css';

export const metadata: Metadata = {
  title: 'Страница не найдена — Будет на ЕГЭ',
  robots: { index: false, follow: true },
  /* У страницы 404 своего адреса нет: canonical и og:url не ставим. */
  alternates: { canonical: null },
  openGraph: null,
};

/**
 * Страница 404: сборка кладёт её в out/404.html, хостинг отдаёт её на
 * любой неизвестный адрес (ErrorDocument в public/.htaccess). Вид —
 * пустой экран дизайн-системы, ниже — открытые разделы банка: ученик
 * по старой ссылке попадает не в тупик, а к заданиям.
 */
export default function NotFound() {
  const gotovye = tasks.filter((task) => task.status === 'ready');
  return (
    <AppShell active="tasks">
      <main className="app-main">
        <div className="section-panel">
          <section className="state nf" aria-labelledby="nf-title">
            <div className="state__ico">
              <TrajectoryIcon />
            </div>
            <h1 id="nf-title" className="nf__title">
              Такой страницы нет
            </h1>
            <p>
              Возможно, адрес изменился или в ссылке опечатка. Все задания — в банке, вариант
              целиком собирается на странице «Собрать вариант».
            </p>
            <div className="nf__actions">
              <Link className="btn btn--primary" href={tasksPage.href}>
                Банк заданий
              </Link>
              <Link className="btn btn--ghost" href={VARIANT_HREF}>
                Собрать вариант
              </Link>
              <Link className="btn btn--ghost" href="/">
                На главную
              </Link>
            </div>
          </section>
          <nav className="nf__razdely" aria-labelledby="nf-razdely">
            <h2 id="nf-razdely" className="t-h4">
              Разделы банка
            </h2>
            <ul>
              {gotovye.map((task) => (
                <li key={task.slug}>
                  <Link href={taskHref(task)}>
                    <span className="nf__no">№{Number(task.no)}</span> {task.name}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
        </div>
      </main>
    </AppShell>
  );
}
