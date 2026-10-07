import { RedirectPage, REDIRECT_METADATA } from '@/components/layout';
import { OPORNYE } from '@/content/opornye';
import { prepRedirectParams } from '@/content/sections';
import { prepSkillIds } from '@/lib/prep';
import { ZADANIYA } from '@/lib/paths';

/* Те же адреса, что были: прежние подтемы × их навыки. */
export function generateStaticParams() {
  return prepRedirectParams().flatMap((params) =>
    prepSkillIds(params.type).map((skill) => ({ ...params, skill })),
  );
}
export const dynamicParams = false;

export const metadata = REDIRECT_METADATA;

type Params = Promise<{ task: string; type: string; skill: string }>;

/** Прежний адрес тренажёра навыка. */
export default async function Page({ params }: { params: Params }) {
  const { task, type, skill } = await params;
  return (
    <RedirectPage
      href={`${ZADANIYA}/${task}/${type}/${OPORNYE.tail}${skill}/`}
      title={OPORNYE.title}
    />
  );
}
