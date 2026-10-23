import { RedirectPage, REDIRECT_METADATA } from '@/components/layout';
import { OPORNYE } from '@/content/opornye';
import { FIGURA_GLAVA } from '@/content/stereo/glavy';
import { ZADANIYA } from '@/lib/paths';

/* Прежние адреса №3 — по разделу на фигуру. Раздел собран заново
   (docs/stereometry-plan.md, п. 5.4): фигуры стали главами теории,
   а тренажёр и опорные задачи — общими вкладками задания. */
export function generateStaticParams() {
  return Object.keys(FIGURA_GLAVA).map((figura) => ({ figura }));
}
export const dynamicParams = false;

export const metadata = REDIRECT_METADATA;

type Params = Promise<{ figura: string }>;

/** Прежнее имя вкладки «Опорные задачи» → опорные задачи задания. */
export default async function Page({ params }: { params: Params }) {
  await params;
  return <RedirectPage href={`${ZADANIYA}/3/${OPORNYE.tail}`} title={OPORNYE.title} />;
}
