import { PROTOTIPY3, dannyePrototipa } from '@/lib/zadanie3/trening/dannye';

export const dynamic = 'force-static';
export const dynamicParams = false;

/* Статический экспорт: по файлу на прототип банка. */
export function generateStaticParams() {
  return PROTOTIPY3.map((id) => ({ file: `${id}.json` }));
}

/**
 * Данные прототипа №3 для тренажёра (lib/zadanie3/trening/dannye.ts):
 * условия, модель чертежа, закрытые ответ, решение и подсказка.
 * Тренировка качает только файлы своих прототипов.
 */
export async function GET(_request: Request, { params }: { params: Promise<{ file: string }> }) {
  const { file } = await params;
  const dannye = dannyePrototipa(file.replace(/\.json$/, ''));
  if (dannye === null) {
    return new Response('Not found', { status: 404 });
  }
  return Response.json(dannye);
}
