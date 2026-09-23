import { notFound } from 'next/navigation';
import { AppShell } from '@/components/layout/AppShell';
import { Solid } from '@/components/solid/Solid';
import { FigureZoom } from '@/components/ui';
import { stereometria } from '@/content/stereometria';
import { tasksPage } from '@/content/tasks';
import { razdelBySlug } from '@/lib/zadanie3';
import { THUMBS } from '@/lib/solid/drawings';
import { type Model } from '@/lib/solid';
import { RazdelTabs } from '@/components/tasks/RazdelTabs';
import { ShapkaRazdela } from '@/components/tasks/ShapkaRazdela';
import { VKLADKI_FIGURY } from '@/content/vkladki';
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
    <AppShell active="tasks">
      <main className="app-main">
        <ShapkaRazdela
          className="figura-head"
          crumbs={[
            { label: 'Задания', href: tasksPage.href },
            {
              label: `№${Number(stereometria.no)} ${stereometria.subtitle}`,
              href: `${tasksPage.href}/${stereometria.slug}`,
            },
            { label: razdel.nazvanie },
          ]}
          title={razdel.nazvanie}
          lead={
            <>
              Раздел {razdel.nomer} задачника: {razdel.prototipy.length} прототипов, {variants}{' '}
              вариантов.
            </>
          }
          media={
            <FigureZoom label={`${razdel.nazvanie}: чертёж фигуры`}>
              <Solid model={thumb(razdel.nomer)} />
            </FigureZoom>
          }
        />

        <RazdelTabs base={base} tabs={VKLADKI_FIGURY} />

        <div className="section-panel">{children}</div>
      </main>
    </AppShell>
  );
}
