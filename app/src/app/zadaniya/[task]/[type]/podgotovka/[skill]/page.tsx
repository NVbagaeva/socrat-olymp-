import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { AppShell } from '@/components/layout/AppShell';
import { FunctionTopicPage } from '@/components/tasks/FunctionTopicPage';
import { PrepTasks } from '@/components/tasks/prep';
import { activeSubtopicParams, findSection, findSubtopic } from '@/content/sections';
import { prepPage } from '@/content/prepSkills';
import { findPrepSkill, prepSkillIds } from '@/lib/prep';
import { tasksPage } from '@/content/tasks';
import 'katex/dist/katex.min.css';
import '@/lib/graph/graph.css';
import '../../../../zadaniya.css';
import '../../../section.css';
import '../../topic.css';
import '../../prep.css';
import '../../trainer.css';
import '../../generator.css';

/* Адреса перечислимы на сборке: открытые подтемы × навыки. Руками
   их никто не пишет — список навыков один и тот же везде. */
export function generateStaticParams() {
  return activeSubtopicParams().flatMap((params) =>
    prepSkillIds().map((skill) => ({ ...params, skill })),
  );
}
export const dynamicParams = false;

type Params = Promise<{ task: string; type: string; skill: string }>;

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const { task, type, skill } = await params;
  const subtopic = findSubtopic(task, type);
  const found = findPrepSkill(skill);
  return subtopic && found
    ? { title: `${found.title} · ${prepPage.title} · ${subtopic.title} — Будет на ЕГЭ` }
    : {};
}

/**
 * Тренажёр одного навыка.
 *
 * Рамка темы та же, что и везде: крошки, заголовок, кольцо разделов
 * и лента вкладок. Меняется только содержимое вкладки — вместо
 * списка навыков стоит экран задачи.
 */
export default async function Page({ params }: { params: Params }) {
  const { task, type, skill } = await params;
  const section = findSection(task);
  const subtopic = findSubtopic(task, type);
  const found = findPrepSkill(skill);
  if (!section || !subtopic || !found) {
    notFound();
  }

  const base = `${tasksPage.href}/${section.slug}/${subtopic.id}`;

  return (
    <AppShell active="tasks" task={task}>
      <FunctionTopicPage
        section={section}
        subtopic={subtopic}
        initialTab="prep"
        trail={[
          { label: prepPage.title, href: `${base}/podgotovka/` },
          { label: found.title },
        ]}
        prep={<PrepTasks skill={found} base={base} />}
      />
    </AppShell>
  );
}
