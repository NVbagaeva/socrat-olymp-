import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { Suspense } from 'react';
import { katex } from '@/lib/graph/katex';
import { AppShell } from '@/components/layout/AppShell';
import { Chart } from '@/components/graph/Chart';
import { Badge, Breadcrumbs, HandNote } from '@/components/ui';
import { bankSets, findSection, sectionParams, type Subtopic } from '@/content/sections';
import { tasksPage } from '@/content/tasks';
import { lineScene } from '@/lib/scenes';
import { renderGraph } from '@/lib/graph/renderer.js';
import type { PrototypeView, SubtopicView } from './SectionTabs';
import { SectionTabs } from './SectionTabs';
import '../zadaniya.css';
import './section.css';

/* Статический экспорт: список страниц известен до сборки и считается
   из конфига. Незаявленные адреса не собираются и не открываются. */
export function generateStaticParams() {
  return sectionParams();
}
export const dynamicParams = false;

type Params = Promise<{ task: string }>;

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const section = findSection((await params).task);
  if (!section) {
    return {};
  }
  return { title: `${section.title} — Будет на ЕГЭ`, description: section.description };
}

/* Формулы вёрстываются на сборке: в браузер уходит готовая разметка,
   а не библиотека ради шести постоянных строк. */
function formulaHtml(tex: string): string {
  return katex.renderToString(tex, { throwOnError: false, displayMode: false });
}

/**
 * Миниатюра подтемы. Движок умеет одно семейство кривых — прямую,
 * поэтому чертёж есть только у линейных функций. Своего SVG вместо
 * него не рисуем: у остальных подтем места под чертёж просто нет.
 */
function thumbnail(subtopic: Subtopic): string | null {
  if (subtopic.slug !== 'linear') {
    return null;
  }
  return renderGraph(
    lineScene({ k: 1, b: 1, half: 5, alt: `Чертёж: ${subtopic.name}` }),
  ) as string;
}

function toView(sectionSlug: string, subtopic: Subtopic): SubtopicView {
  return {
    slug: subtopic.slug,
    name: subtopic.name,
    formulaHtml: formulaHtml(subtopic.formula),
    status: subtopic.status,
    href: subtopic.status === 'active' ? `/zadaniya/${sectionSlug}/${subtopic.slug}` : null,
    chartSvg: thumbnail(subtopic),
  };
}

export default async function SectionPage({ params }: { params: Params }) {
  const section = findSection((await params).task);
  if (!section) {
    notFound();
  }

  const subtopics = section.subtopics.map((item) => toView(section.slug, item));

  /* Прототипы собираются из наборов движка по всем подтемам раздела.
     Числа берутся из состава наборов и нигде не записаны руками. */
  const seen = new Set<string>();
  const prototypes: PrototypeView[] = section.subtopics.flatMap((subtopic) =>
    bankSets(subtopic)
      .filter((set) => set.kind === 'prototype' && !seen.has(set.id) && seen.add(set.id))
      .map((set) => ({ id: set.id, title: set.title, subtitle: set.subtitle, count: set.count })),
  );

  /* Первая открытая подтема — единственный осмысленный переход.
     «Продолжить с места, где остановился» не делаем: хранилища
     прогресса в проекте нет, это была бы имитация. */
  const entry = section.subtopics.find((item) => item.status === 'active');

  return (
    <AppShell active="tasks">
      <main className="app-main">
        <Breadcrumbs
          items={[
            { label: 'Главная', href: '/' },
            { label: 'Банк заданий', href: tasksPage.href },
            { label: `№${section.no}` },
          ]}
        />

        <header className="section-head">
          <div className="section-head__text">
            <div className="section-head__title">
              <h1 className="t-h1">{section.title}</h1>
              {section.badge !== undefined ? <Badge tone="info">{section.badge}</Badge> : null}
            </div>
            <p className="section-head__lead">{section.description}</p>
            {entry !== undefined ? (
              <Link
                className="btn btn--primary section-head__cta"
                href={`/zadaniya/${section.slug}/${entry.slug}`}
              >
                Продолжить подготовку
                <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
                  <path d="M5 12h13M12 6l6 6-6 6" />
                </svg>
              </Link>
            ) : null}
          </div>

          <div className="section-head__media">
            <Chart
              className="section-head__chart"
              scene={lineScene({ k: 0.5, b: 1, half: 6, label: 'y = f(x)' })}
            />
            <HandNote className="section-head__note">Функции описывают мир вокруг нас</HandNote>
          </div>
        </header>

        {/* useSearchParams требует границы ожидания: без неё статический
            экспорт отказывается собирать страницу. */}
        <Suspense fallback={null}>
          <SectionTabs
            description={section.description}
            subtopics={subtopics}
            prototypes={prototypes}
          />
        </Suspense>
      </main>
    </AppShell>
  );
}
