import type { Metadata } from 'next';
import Link from 'next/link';
import { SiteFooter, SiteHeader } from '@/components/layout';
import { Zherdochka } from '@/components/landing/Zherdochka';
import { taskHref, tasks, tasksPage } from '@/content/tasks';
import { VARIANT_HREF } from '@/content/variant';
import '../landing.css';
import './ne-naydeno.css';

export const metadata: Metadata = {
  title: 'Страница не найдена — Будет на ЕГЭ',
  robots: { index: false, follow: true },
};

/**
 * Страница 404. Хостинг отдаёт её на любой неизвестный адрес с кодом 404
 * (ErrorDocument в public/.htaccess); по своему адресу она тоже открывается,
 * но закрыта от поиска.
 *
 * Это обычная страница, а не корневой not-found.tsx: содержимое корневого
 * not-found Next встраивает в данные каждой страницы сайта, и первая
 * загрузка всех страниц росла (pnpm test:first-load: +18 КБ скриптов и
 * +1 КБ HTML у тем №12).
 *
 * Оформление — «Стеклянная сцена» главной (landing.css, класс .glavnaya):
 * стеклянные шапка и подвал, свечения, глянцевая кнопка. Попугай с
 * главной сидит на жёрдочке над заголовком. Ниже — открытые разделы
 * банка с номерами по действующей структуре: ученик по старой ссылке
 * попадает не в тупик, а к заданиям.
 *
 * Основа — страница 404 из PR #296 (SEO, этап 2); оформление — по
 * docs/design-audit.md, п. 14.1.
 */
export default function NeNaydeno() {
  const gotovye = tasks.filter((task) => task.status === 'ready');
  return (
    <div className="glavnaya">
      <SiteHeader className="site-head--steklo" />
      <main className="nf">
        <div className="aura" aria-hidden="true">
          <span className="aura__spot aura__spot--blue" />
          <span className="aura__spot aura__spot--orange" />
        </div>
        <section className="nf__karta" aria-labelledby="nf-title">
          <div className="nf__ptica">
            <Zherdochka podgon={false} />
          </div>
          <p className="nf__kod">Ошибка 404</p>
          <h1 id="nf-title" className="nf__title">
            Такой страницы нет
          </h1>
          <p className="nf__lead">
            Возможно, адрес изменился или в ссылке опечатка. Все задания — в банке, а вариант
            целиком собирается на странице «Собрать вариант».
          </p>
          <div className="nf__actions">
            <Link className="btn btn--primary" href={tasksPage.href}>
              Банк заданий
            </Link>
            <Link className="btn btn--secondary" href={VARIANT_HREF}>
              Собрать вариант
            </Link>
            <Link className="btn btn--secondary" href="/">
              На главную
            </Link>
          </div>
        </section>
        <nav className="nf__razdely" aria-labelledby="nf-razdely">
          <h2 id="nf-razdely">Открытые разделы</h2>
          <ul>
            {gotovye.map((task) => (
              <li key={task.slug}>
                <Link href={taskHref(task)}>
                  <span className="nf__no">{task.no}</span>
                  <span>{task.name}</span>
                </Link>
              </li>
            ))}
          </ul>
        </nav>
      </main>
      <SiteFooter className="site-foot--steklo" />
    </div>
  );
}
