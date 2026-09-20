import { RedirectPage, REDIRECT_METADATA } from '@/components/layout';
import { OPORNYE } from '@/content/opornye';
import { activeSubtopicParams } from '@/content/sections';
import { tasksPage } from '@/content/tasks';
import { prepSkillIds } from '@/lib/prep';

/* Те же адреса, что были: открытые подтемы × навыки. */
export function generateStaticParams() {
  return activeSubtopicParams().flatMap((params) =>
    prepSkillIds().map((skill) => ({ ...params, skill })),
  );
}
export const dynamicParams = false;

export const metadata = REDIRECT_METADATA;

type Params = Promise<{ task: string; type: string; skill: string }>;

/** Прежний адрес тренажёра навыка. */
export default async function Page({ params }: { params: Params }) {
  const { task, type, skill } = await params;
  return (
    <RedirectPage
      href={`${tasksPage.href}/${task}/${type}/${OPORNYE.tail}${skill}/`}
      title={OPORNYE.title}
    />
  );
}
