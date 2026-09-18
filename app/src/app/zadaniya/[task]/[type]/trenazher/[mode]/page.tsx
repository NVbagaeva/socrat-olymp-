import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { AppShell } from '@/components/layout/AppShell';
import { FunctionTopicPage } from '@/components/tasks/FunctionTopicPage';
import { TrainerShell, TrainerTasks } from '@/components/tasks/trainer';
import { activeSubtopicParams, findSection, findSubtopic } from '@/content/sections';
import { findTrainerMode, trainerModeIds, trainerPage } from '@/content/trainerModes';
import { tasksPage } from '@/content/tasks';
import 'katex/dist/katex.min.css';
import '@/lib/graph/graph.css';
import '../../../../zadaniya.css';
import '../../../section.css';
import '../../topic.css';
import '../../prep.css';
import '../../trainer.css';
import '../../generator.css';

/* Адреса перечислимы на сборке: открытые подтемы × режимы. */
export function generateStaticParams() {
  return activeSubtopicParams().flatMap((params) =>
    trainerModeIds().map((mode) => ({ ...params, mode })),
  );
}
export const dynamicParams = false;

type Params = Promise<{ task: string; type: string; mode: string }>;

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const { task, type, mode } = await params;
  const subtopic = findSubtopic(task, type);
  const found = findTrainerMode(mode);
  return subtopic && found
    ? { title: `${found.title} · ${trainerPage.title} · ${subtopic.title} — Будет на ЕГЭ` }
    : {};
}

/**
 * Тренажёр в выбранном режиме.
 *
 * Рамка та же, что и у вкладки без выбора: меняется только то, что
 * стоит под строкой выбора типа.
 */
export default async function Page({ params }: { params: Params }) {
  const { task, type, mode } = await params;
  const section = findSection(task);
  const subtopic = findSubtopic(task, type);
  const found = findTrainerMode(mode);
  if (!section || !subtopic || !found) {
    notFound();
  }

  const base = `${tasksPage.href}/${section.slug}/${subtopic.id}`;

  return (
    <AppShell active="tasks" task={task}>
      <FunctionTopicPage
        section={section}
        subtopic={subtopic}
        initialTab="trainer"
        trail={[{ label: trainerPage.title, href: `${base}/trenazher/` }, { label: found.title }]}
        trainer={
          <TrainerShell base={base} mode={found}>
            {/* Задания собирает движок на сборке: в браузер уходит
                готовая разметка. */}
            <TrainerTasks mode={found} base={`${base}/trenazher/`} />
          </TrainerShell>
        }
      />
    </AppShell>
  );
}
