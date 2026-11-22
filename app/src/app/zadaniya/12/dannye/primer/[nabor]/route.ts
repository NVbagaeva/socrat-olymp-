import { katalog12 } from '@/lib/ves12/trening/katalog';
import { primer12 } from '@/lib/ves12/trening/primer';

export const dynamic = 'force-static';
export const dynamicParams = false;

/** Файл на каждый тип (набор движка): «12Q.B.json» и так далее. */
export function generateStaticParams(): { nabor: string }[] {
  return Object.keys(katalog12()).map((nabor) => ({ nabor: `${nabor}.json` }));
}

/**
 * Разобранный пример типа №12 файлом сборки: карта «О задании» несёт в
 * разметке только первый раскрытый пример, остальные приезжают этим
 * файлом по раскрытию карточки — без движка и KaTeX в браузере.
 */
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ nabor: string }> },
): Promise<Response> {
  const { nabor } = await params;
  return Response.json(primer12(katalog12(), nabor.replace(/\.json$/, '')));
}
