import { dannye } from '@/lib/variant/data/z01';

export const dynamic = 'force-static';

export function GET(): Response {
  return Response.json(dannye());
}
