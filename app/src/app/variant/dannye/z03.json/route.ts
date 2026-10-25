import { dannye } from '@/lib/variant/data/z03';

export const dynamic = 'force-static';

export function GET(): Response {
  return Response.json(dannye());
}
