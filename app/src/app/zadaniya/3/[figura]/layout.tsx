import { notFound } from 'next/navigation';
import { AppShell } from '@/components/layout/AppShell';
import { Solid } from '@/components/solid/Solid';
import { Breadcrumbs } from '@/components/ui';
import { stereometria } from '@/content/stereometria';
import { tasksPage } from '@/content/tasks';
import { razdelBySlug } from '@/lib/zadanie3';
import { THUMBS } from '@/lib/solid/drawings';
import { type Model } from '@/lib/solid';
import { FiguraTabs } from './FiguraTabs';
import '@/lib/solid/solid.css';
import '../../zadaniya.css';
import '../../[task]/section.css';
import '../stereometria.css';
import './figura.css';

function thumb(nomer: string): Model {
  const model = THUMBS[`thumb-${nomer}`];
  if (model === undefined) {
    throw new Error(`Нет миниатюры раздела ${nomer}`);
  }
  return model;
}

/**
 * Оболочка раздела: крошки, заголовок, чертёж и лента вкладок.
 *
 * Это именно layout, а не часть страницы. Вкладка — отдельный адрес,
 * и при переходе между вкладками React оставляет эту оболочку на
 * месте: верхняя панель не мигает и не исчезает, сколько бы вглубь
 * ни уходил ученик. В №12 шапка терялась при входе в задачу — здесь
 * это невозможно по устройству, а не по договорённости.
 */
export default async function FiguraLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ figura: string }>;
}) {
  const razdel = razdelBySlug((await params).figura);
  if (razdel === undefined) {
    notFound();
  }

  const base = `${tasksPage.href}/${stereometria.slug}/${razdel.slug}`;
  const variants = razdel.prototipy.reduce((sum, p) => sum + p.varianty.length, 0);

  return (
    <AppShell active="tasks" task={stereometria.slug}>
      <main className="app-main">
        <Breadcrumbs
          items={[
            { label: 'Задания', href: tasksPage.href },
            {
              label: `№${Number(stereometria.no)} ${stereometria.subtitle}`,
              href: `${tasksPage.href}/${stereometria.slug}`,
            },
            { label: razdel.nazvanie },
          ]}
        />

        <header className="section-head figura-head">
          <div className="section-head__text">
            <div className="section-head__title">
              <h1 className="t-h1">{razdel.nazvanie}</h1>
            </div>
            <p className="section-head__lead">
              Раздел {razdel.nomer} задачника: {razdel.prototipy.length} прототипов, {variants}{' '}
              вариантов.
            </p>
          </div>

          <div className="section-head__media">
            <Solid model={thumb(razdel.nomer)} />
          </div>
        </header>

        <FiguraTabs base={base} />

        <div className="section-panel">{children}</div>
      </main>
    </AppShell>
  );
}
