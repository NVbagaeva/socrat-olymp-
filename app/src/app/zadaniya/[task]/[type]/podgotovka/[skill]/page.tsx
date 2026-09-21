import { RedirectPage, REDIRECT_METADATA } from '@/components/layout';
import { OPORNYE } from '@/content/opornye';
import { prepSubtopicParams } from '@/content/sections';
import { tasksPage } from '@/content/tasks';
import { prepSkillIds } from '@/lib/prep';

/* Те же адреса, что были: подтемы с навыками × их навыки. */
export function generateStaticParams() {
  return prepSubtopicParams().flatMap((params) =>
    prepSkillIds(params.type).map((skill) => ({ ...params, skill })),
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
