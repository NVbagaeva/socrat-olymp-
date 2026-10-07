import { RedirectPage, REDIRECT_METADATA } from '@/components/layout';
import { OPORNYE } from '@/content/opornye';
import { prepRedirectParams } from '@/content/sections';
import { ZADANIYA } from '@/lib/paths';

/* Те же адреса, что были: подтемы, жившие до переименования. */
export function generateStaticParams() {
  return prepRedirectParams();
}
export const dynamicParams = false;

export const metadata = REDIRECT_METADATA;

type Params = Promise<{ task: string; type: string }>;

/** Прежний адрес вкладки темы: до переименования в «Опорные задачи». */
export default async function Page({ params }: { params: Params }) {
  const { task, type } = await params;
  return (
    <RedirectPage href={`${ZADANIYA}/${task}/${type}/${OPORNYE.tail}`} title={OPORNYE.title} />
  );
}
