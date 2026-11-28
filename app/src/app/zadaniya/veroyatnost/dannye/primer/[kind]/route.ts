import { bank4Pool, variantPrimera } from '@/lib/veroyatnost/pool';

export const dynamic = 'force-static';
export const dynamicParams = false;

export function generateStaticParams() {
  return bank4Pool().kinds.map((k) => ({ kind: `${k.id}.json` }));
}

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ kind: string }> },
): Promise<Response> {
  const { kind } = await params;
  const tip = bank4Pool().kinds.find((k) => `${k.id}.json` === kind);
  const primer = tip && variantPrimera(4, tip);
  return primer ? Response.json(primer.steps) : new Response(null, { status: 404 });
}
