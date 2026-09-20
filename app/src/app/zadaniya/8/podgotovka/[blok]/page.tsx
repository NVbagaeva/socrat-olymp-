import { RedirectPage, REDIRECT_METADATA } from '@/components/layout';
import { OPORNYE } from '@/content/opornye';
import { tasksPage } from '@/content/tasks';
import { PREP_BLOCKS } from '@/lib/vychisleniya/prep/blocks';

/* Те же адреса блоков, что были: с каждого ведём на новый. */
export function generateStaticParams() {
  return PREP_BLOCKS.map((block) => ({ blok: block.slug }));
}
export const dynamicParams = false;

export const metadata = REDIRECT_METADATA;

type Params = Promise<{ blok: string }>;

/** Прежний адрес блока задания №8. */
export default async function Page({ params }: { params: Params }) {
  const { blok } = await params;
  return (
    <RedirectPage href={`${tasksPage.href}/8/${OPORNYE.tail}${blok}/`} title={OPORNYE.title} />
  );
}
