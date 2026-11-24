import { RedirectPage, REDIRECT_METADATA } from '@/components/layout';
import { OPORNYE } from '@/content/opornye';
import { prepRedirectParams, SEKCIYA_GRAFIKOV } from '@/content/sections';
import { prepSkillIds } from '@/lib/prep';
import { href, razdelBase } from '@/lib/paths';

/* Те же адреса, что были: прежние подтемы × их навыки. */
export function generateStaticParams() {
  return prepRedirectParams().flatMap((params) =>
    prepSkillIds(params.type).map((skill) => ({ ...params, skill })),
  );
}
export const dynamicParams = false;

export const metadata = REDIRECT_METADATA;

type Params = Promise<{ type: string; skill: string }>;

/** Прежний адрес тренажёра навыка. */
export default async function Page({ params }: { params: Params }) {
  const { type, skill } = await params;
  const task = SEKCIYA_GRAFIKOV;
  return (
    <RedirectPage href={href(razdelBase(task), type, OPORNYE.tail, skill)} title={OPORNYE.title} />
  );
}
