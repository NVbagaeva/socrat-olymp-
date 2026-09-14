import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { AppShell } from '@/components/layout/AppShell';
import { Badge, Breadcrumbs } from '@/components/ui';
import { activeSubtopicParams, findSection, findSubtopic } from '@/content/sections';
import { tasksPage } from '@/content/tasks';
import '../../../zadaniya.css';
import '../topic.css';

/* Вложенные разделы существуют только у открытых подтем. */
export function generateStaticParams() {
  return activeSubtopicParams();
}
export const dynamicParams = false;

type Params = Promise<{ task: string; type: string }>;

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const { task, type } = await params;
  const section = findSection(task);
  const subtopic = findSubtopic(task, type);
  if (!section || !subtopic) {
    return {};
  }
  return { title: `${section.tutors.title} · ${subtopic.title} — Будет на ЕГЭ` };
}

/**
 * «Для репетиторов» — отдельная страница, а не меню.
 *
 * Обе карточки честно помечены «Готовится»: материалов ещё нет, и
 * ссылки, которая никуда не ведёт, на странице тоже нет.
 */
export default async function TutorsPage({ params }: { params: Params }) {
  const { task, type } = await params;
  const section = findSection(task);
  const subtopic = findSubtopic(task, type);
  if (!section || !subtopic) {
    notFound();
  }

  const { tutors } = section;

  return (
    <AppShell active="tasks" task={task}>
      <main className="app-main">
        <Breadcrumbs
          items={[
            { label: 'Задания', href: tasksPage.href },
            {
              label: `№${section.no}. ${section.subtitle}`,
              href: `${tasksPage.href}/${section.slug}`,
            },
            { label: subtopic.title, href: `${tasksPage.href}/${section.slug}/${subtopic.id}` },
            { label: tutors.title },
          ]}
        />

        <header className="tutors-head">
          <h1 className="t-h1">{tutors.title}</h1>
          <p className="tutors-head__lead">{tutors.lead}</p>
        </header>

        <ul className="tutors-grid">
          {tutors.items.map((item) => (
            <li key={item.id}>
              {/* Материала ещё нет: карточка не ссылка и не берёт фокус,
                  как закрытая карточка в банке заданий. */}
              <div className="card tutors-card" aria-disabled="true">
                <div className="tutors-card__head">
                  <h2 className="tutors-card__title">{item.title}</h2>
                  <Badge>Готовится</Badge>
                </div>
                <p className="tutors-card__lead">{item.lead}</p>
              </div>
            </li>
          ))}
        </ul>
      </main>
    </AppShell>
  );
}
