import { PROTOTIPY } from '@/lib/planimetriya/stseny';
import { primer1 } from '@/lib/planimetriya/trening/primer';
import { klyuchProto } from '@/lib/planimetriya/trenazher/sessiya';

export const dynamic = 'force-static';
export const dynamicParams = false;

/* Статический экспорт: по файлу на тип (прототип). */
export function generateStaticParams() {
  return PROTOTIPY.map((p) => ({ file: `${klyuchProto(p.id)}.json` }));
}

/**
 * Разобранный пример типа №1 (lib/planimetriya/trening/primer.ts):
 * вкладка «О задании» качает его, когда ученик раскрыл карточку типа.
 */
export async function GET(_request: Request, { params }: { params: Promise<{ file: string }> }) {
  const { file } = await params;
  const primer = primer1(file.replace(/\.json$/, ''));
  if (primer === null) {
    return new Response('Not found', { status: 404 });
  }
  return Response.json(primer);
}
