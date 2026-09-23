import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { AppShell } from '@/components/layout/AppShell';
import { FunctionTopicPage } from '@/components/tasks/FunctionTopicPage';
import { TrainerShell } from '@/components/tasks/trainer';
import { findSection, findSubtopic, trainerSubtopicParams } from '@/content/sections';
import { findTrainerShortcut, trainerPage, trainerShortcutIds } from '@/content/trainerModes';
import { tasksPage } from '@/content/tasks';
import 'katex/dist/katex.min.css';
import '@/lib/graph/graph.css';
import '../../../../zadaniya.css';
import '../../../section.css';
import '../../topic.css';
import '../../prep.css';
import '../../trainer.css';
import '../../configurator.css';

/* Адреса перечислимы на сборке: подтемы с тренажёром × их ярлыки. */
export function generateStaticParams() {
  return trainerSubtopicParams().flatMap((params) =>
    trainerShortcutIds(params.type).map((mode) => ({ ...params, mode })),
  );
}
export const dynamicParams = false;

type Params = Promise<{ task: string; type: string; mode: string }>;

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const { task, type, mode } = await params;
  const subtopic = findSubtopic(task, type);
  const found = findTrainerShortcut(type, mode);
  return subtopic && found
    ? { title: `${found.title} · ${trainerPage.title} · ${subtopic.title} — Будет на ЕГЭ` }
    : {};
}

/**
 * Ярлык к конфигуратору: прежний адрес режима открывает ту же
 * вкладку с уже выбранным навыком или режимом. Своих задач у
 * адреса нет — тренировка собирается там же, где и без него.
 */
export default async function Page({ params }: { params: Params }) {
  const { task, type, mode } = await params;
  const section = findSection(task);
  const subtopic = findSubtopic(task, type);
  const found = findTrainerShortcut(type, mode);
  if (!section || !subtopic || !found) {
    notFound();
  }

  const base = `${tasksPage.href}/${section.slug}/${subtopic.id}`;

  return (
    <AppShell active="tasks">
      <FunctionTopicPage
        section={section}
        subtopic={subtopic}
        initialTab="trainer"
        trail={[{ label: trainerPage.title, href: `${base}/trenazher/` }, { label: found.title }]}
        trainer={
          <TrainerShell
            subtopic={subtopic}
            base={`${base}/trenazher/`}
            preset={{ skill: found.skills[0] ?? null, skills: found.skills, mode: found.mode }}
          />
        }
      />
    </AppShell>
  );
}
