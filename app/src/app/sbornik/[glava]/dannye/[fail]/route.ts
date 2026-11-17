import { TIPY } from '@/content/sbornik';
import { tipSlug } from '@/lib/paths';
import { vHtml, zadachiTipa } from '@/lib/sbornik/bank';
import { nomerGlavy, staticGlavy } from '@/lib/sbornik/marshrut';

export const dynamic = 'force-static';
export const dynamicParams = false;

/** Файл на каждый тип: /sbornik/glava-1/dannye/tip-1-2.json. */
export function generateStaticParams(): { glava: string; fail: string }[] {
  return staticGlavy().flatMap(({ glava }) =>
    (TIPY[Number(glava.replace('glava-', ''))] ?? []).map((t) => ({ glava, fail: `${tipSlug(t.id)}.json` })),
  );
}

/**
 * Задачи типа, набранные KaTeX, — для открытой задачи в списке, тренажёра
 * и генератора листов. Страницы не несут решений: их грузят по запросу.
 */
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ glava: string; fail: string }> },
): Promise<Response> {
  const { glava, fail } = await params;
  const n = nomerGlavy(glava);
  const tip = (TIPY[n] ?? []).find((t) => `${tipSlug(t.id)}.json` === fail);
  return Response.json(tip === undefined ? [] : zadachiTipa(tip.id).map(vHtml));
}
