import { TIPY3_ORDER } from '@/content/zadanie3/gruppy';
import { primer3 } from '@/lib/zadanie3/primery';

export const dynamic = 'force-static';
export const dynamicParams = false;

/* Статический экспорт: по файлу на тип. */
export function generateStaticParams() {
  return TIPY3_ORDER.map((tip) => ({ file: `${tip}.json` }));
}

/**
 * Разобранный пример типа №3 (lib/zadanie3/primery.ts): вкладка
 * «О задании» качает его, когда ученик раскрыл карточку типа.
 */
export async function GET(_request: Request, { params }: { params: Promise<{ file: string }> }) {
  const { file } = await params;
  const primer = primer3(file.replace(/\.json$/, ''));
  if (primer === null) {
    return new Response('Not found', { status: 404 });
  }
  return Response.json(primer);
}
