import { bank5Pool } from '@/lib/veroyatnost/pool';
import { razborPrimera } from '@/lib/veroyatnost/primeryKarty';

export const dynamic = 'force-static';
export const dynamicParams = false;

/** Файл на каждый тип: «p5-01.json» и так далее. */
export function generateStaticParams(): { kind: string }[] {
  return bank5Pool().kinds.map((k) => ({ kind: `${k.id}.json` }));
}

/**
 * Закрытый разбор примера типа для вкладки «О задании» №5: один
 * вариант, а не все (как dannye/razbory/), — около 10 КБ. Карта грузит
 * его заранее, и пример раскрывается сразу (lib/veroyatnost/primeryKarty.ts,
 * PrimerLazy45). Разбор закрыт отпечатком ответа.
 */
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ kind: string }> },
): Promise<Response> {
  const { kind } = await params;
  return Response.json({ steps: razborPrimera(5, kind.replace(/\.json$/, '')) });
}
