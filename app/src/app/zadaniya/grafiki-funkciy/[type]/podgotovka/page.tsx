import { RedirectPage, REDIRECT_METADATA } from '@/components/layout';
import { OPORNYE } from '@/content/opornye';
import { prepRedirectParams, SEKCIYA_GRAFIKOV } from '@/content/sections';
import { href, razdelBase } from '@/lib/paths';

/* Те же адреса, что были: подтемы, жившие до переименования. */
export function generateStaticParams() {
  return prepRedirectParams().map(({ task: _task, ...p }) => p);
}
export const dynamicParams = false;

export const metadata = REDIRECT_METADATA;

type Params = Promise<{ type: string }>;

/** Прежний адрес вкладки темы: до переименования в «Опорные задачи». */
export default async function Page({ params }: { params: Params }) {
  const { type } = await params;
  const task = SEKCIYA_GRAFIKOV;
  return <RedirectPage href={href(razdelBase(task), type, OPORNYE.tail)} title={OPORNYE.title} />;
}
