import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { AppShell } from '@/components/layout/AppShell';
import { Solid } from '@/components/solid/Solid';
import { Breadcrumbs, EmptyState } from '@/components/ui';
import { stereometria } from '@/content/stereometria';
import { tasksPage } from '@/content/tasks';
import { RAZDELY, razdelBySlug } from '@/lib/zadanie3';
import { THUMBS } from '@/lib/solid/drawings';
import { type Model } from '@/lib/solid';
import '@/lib/solid/solid.css';
import '../../zadaniya.css';
import '../../[task]/section.css';
import '../stereometria.css';

/* Статический экспорт: адреса разделов известны до сборки и берутся
   из того же списка, что и карточки. Незаявленные не собираются. */
export function generateStaticParams() {
  return RAZDELY.map((razdel) => ({ figura: razdel.slug }));
}
export const dynamicParams = false;

type Params = Promise<{ figura: string }>;

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const razdel = razdelBySlug((await params).figura);
  if (razdel === undefined) {
    return {};
  }
  return { title: `${razdel.nazvanie} — задание №3 — Будет на ЕГЭ` };
}

function thumb(nomer: string): Model {
  const model = THUMBS[`thumb-${nomer}`];
  if (model === undefined) {
    throw new Error(`Нет миниатюры раздела ${nomer}`);
  }
  return model;
}

export default async function FiguraPage({ params }: { params: Params }) {
  const razdel = razdelBySlug((await params).figura);
  if (razdel === undefined) {
    notFound();
  }

  const variants = razdel.prototipy.reduce((sum, p) => sum + p.varianty.length, 0);

  return (
    <AppShell active="tasks" task={stereometria.slug}>
      <main className="app-main">
        <Breadcrumbs
          items={[
            { label: 'Главная', href: '/' },
            { label: 'Банк заданий', href: tasksPage.href },
            { label: `№3 ${stereometria.subtitle}`, href: `${tasksPage.href}/3` },
            { label: razdel.nazvanie },
          ]}
        />

        <header className="section-head">
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
            <Solid className="solid3-head__figure" model={thumb(razdel.nomer)} />
          </div>
        </header>

        {/* Вкладки раздела — следующий этап. Пока страница честно
            говорит, что содержимого тут ещё нет, и не изображает его. */}
        <EmptyState
          title="Материал готовится"
          description="Теория, подготовительные задачи и тренажёр этого раздела появятся здесь."
        />
      </main>
    </AppShell>
  );
}
