import { RedirectPage, REDIRECT_METADATA } from '@/components/layout';
import { builtSubtopicParams, findSubtopic, SEKCIYA_GRAFIKOV } from '@/content/sections';
import { href, ZADANIYA } from '@/lib/paths';

/* «Работа над ошибками» вида функции №12 — пустая страница с одним заголовком.
   Из меню вида её нет; со старого адреса — переход на тренажёр вида
   (решение владельца, docs/redesign-plan.md, п. 7). Сервер отвечает 301
   раньше (public/.htaccess). Прежняя страница — заготовка OshibkiVida
   в components/tasks/zadanie12/ZagotovkiVida.tsx. */
export function generateStaticParams() {
  return builtSubtopicParams().map(({ task: _task, ...p }) => p);
}
export const dynamicParams = false;

export const metadata = REDIRECT_METADATA;

type Params = Promise<{ type: string }>;

export default async function Page({ params }: { params: Params }) {
  const { type } = await params;
  const task = SEKCIYA_GRAFIKOV;
  const subtopic = findSubtopic(task, type);
  return (
    <RedirectPage href={href(ZADANIYA, task, type, 'trenazher')} title={subtopic?.title ?? ''} />
  );
}
