import { RedirectPage, REDIRECT_METADATA } from '@/components/layout';
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

/** Теория фигуры → её глава в теории задания. */
export default async function Page({ params }: { params: Params }) {
  const { figura } = await params;
  const glava = FIGURA_GLAVA[figura] ?? '';
  return <RedirectPage href={`${ZADANIYA}/3/teoriya/#teoriya-${glava}`} title="Теория" />;
}
