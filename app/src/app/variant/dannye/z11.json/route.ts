import { dannye } from '@/lib/variant/data/z11';

export const dynamic = 'force-static';

export function GET(): Response {
  return Response.json(dannye());
}
