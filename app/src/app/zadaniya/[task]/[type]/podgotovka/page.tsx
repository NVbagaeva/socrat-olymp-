import { RedirectPage, REDIRECT_METADATA } from '@/components/layout';
import { OPORNYE } from '@/content/opornye';
import { prepSubtopicParams } from '@/content/sections';
import { tasksPage } from '@/content/tasks';

/* Те же адреса, что были: подтемы со списком навыков. */
export function generateStaticParams() {
  return prepSubtopicParams();
}
export const dynamicParams = false;

export const metadata = REDIRECT_METADATA;

type Params = Promise<{ task: string; type: string }>;

/** Прежний адрес вкладки темы: до переименования в «Опорные задачи». */
export default async function Page({ params }: { params: Params }) {
  const { task, type } = await params;
  return (
    <RedirectPage
      href={`${tasksPage.href}/${task}/${type}/${OPORNYE.tail}`}
      title={OPORNYE.title}
    />
  );
}
