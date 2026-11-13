import { RAZDELY_DZ, katalog } from '@/lib/dz/katalog/server';

export const dynamic = 'force-static';
export const dynamicParams = false;

/* Статический экспорт: по файлу на раздел, из которого выдаётся ДЗ. */
export function generateStaticParams() {
  return RAZDELY_DZ.map((no) => ({ file: `z${String(no).padStart(2, '0')}.json` }));
}

/**
 * Каталог раздела для конструктора ДЗ (lib/dz/katalog): наборы карточек,
 * блоки опорных задач, типы тренажёра. Конструктор качает только
 * разделы, которые открыл репетитор.
 */
export async function GET(_request: Request, { params }: { params: Promise<{ file: string }> }) {
  const { file } = await params;
  const no = Number(/^z(\d{2})\.json$/.exec(file)?.[1]);
  const k = Number.isInteger(no) ? katalog(no) : null;
  if (k === null) {
    return new Response('Not found', { status: 404 });
  }
  return Response.json(k);
}
