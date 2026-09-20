import { RedirectPage, REDIRECT_METADATA } from '@/components/layout';
import { OPORNYE } from '@/content/opornye';
import { tasksPage } from '@/content/tasks';

export const metadata = REDIRECT_METADATA;

/** Прежний адрес вкладки задания №5: до переименования в «Опорные задачи». */
export default function Page() {
  return <RedirectPage href={`${tasksPage.href}/5/${OPORNYE.tail}`} title={OPORNYE.title} />;
}
