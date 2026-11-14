import { bank4Pool, razboryVida } from '@/lib/veroyatnost/pool';

export const dynamic = 'force-static';
export const dynamicParams = false;

/** Файл на каждый прототип: «p4-01.json» и так далее. */
export function generateStaticParams(): { kind: string }[] {
  return bank4Pool().kinds.map((k) => ({ kind: `${k.id}.json` }));
}

/**
 * Закрытые разборы и подсказки прототипа задания №4 файлом сборки:
 * страница тренажёра их не несёт, экран тренировки грузит только
 * прототипы своего подхода (components/tasks/veroyatnost/razboryKlient.ts).
 * Ответы и разборы закрыты отпечатком (lib/veroyatnost/secret.ts).
 */
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ kind: string }> },
): Promise<Response> {
  const { kind } = await params;
  return Response.json(razboryVida(bank4Pool(), kind.replace(/\.json$/, '')));
}
