import { RedirectPage, REDIRECT_METADATA } from '@/components/layout';
import { OPORNYE } from '@/content/opornye';
import { tasksPage } from '@/content/tasks';
import { prep5Pool } from '@/lib/veroyatnost/pool';

/* Те же адреса блоков, что были: с каждого ведём на новый. */
export function generateStaticParams() {
  return prep5Pool().map((blok) => ({ blok: blok.id }));
}
export const dynamicParams = false;

export const metadata = REDIRECT_METADATA;

type Params = Promise<{ blok: string }>;

/** Прежний адрес блока задания №5. */
export default async function Page({ params }: { params: Params }) {
  const { blok } = await params;
  return (
    <RedirectPage href={`${tasksPage.href}/5/${OPORNYE.tail}${blok}/`} title={OPORNYE.title} />
  );
}
