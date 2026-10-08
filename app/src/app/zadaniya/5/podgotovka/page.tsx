import { RedirectPage, REDIRECT_METADATA } from '@/components/layout';
import { OPORNYE } from '@/content/opornye';
import { ZADANIYA } from '@/lib/paths';

export const metadata = REDIRECT_METADATA;

/** Прежний адрес вкладки задания №5: до переименования в «Опорные задачи». */
export default function Page() {
  return <RedirectPage href={`${ZADANIYA}/5/${OPORNYE.tail}`} title={OPORNYE.title} />;
}
