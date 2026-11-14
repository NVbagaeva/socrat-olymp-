import { RAZDELY_DZ, katalogLegkiy, resheniyaKatalog } from '@/lib/dz/katalog/server';

export const dynamic = 'force-static';
export const dynamicParams = false;

/* Статический экспорт: по два файла на раздел, из которого выдаётся ДЗ. */
export function generateStaticParams() {
  return RAZDELY_DZ.flatMap((no) => {
    const z = `z${String(no).padStart(2, '0')}`;
    return [{ file: `${z}.json` }, { file: `${z}-r.json` }];
  });
}

/**
 * Каталог раздела для конструктора ДЗ (lib/dz/katalog): zNN.json —
 * наборы карточек, блоки опорных задач, типы тренажёра; zNN-r.json —
 * закрытые ответы, разборы и подсказки опорных, их конструктор качает
 * только при выдаче. Конструктор качает только разделы, которые открыл
 * репетитор.
 */
export async function GET(_request: Request, { params }: { params: Promise<{ file: string }> }) {
  const { file } = await params;
  const m = /^z(\d{2})(-r)?\.json$/.exec(file);
  const no = Number(m?.[1]);
  if (m === null || !Number.isInteger(no)) {
    return new Response('Not found', { status: 404 });
  }
  const data = m[2] === undefined ? katalogLegkiy(no) : resheniyaKatalog(no);
  if (data === null) {
    return new Response('Not found', { status: 404 });
  }
  return Response.json(data);
}
