import type { Metadata } from 'next';
import { nazvanieTipa, RazborStranitsa, tipySRazborom } from '@/components/stereo/RazborStranitsa';
import { metaPodstranitsy } from '@/content/seo';
import { tekstBezTex } from '@/lib/tekstFormul';

export function generateStaticParams() {
  return tipySRazborom('15');
}
export const dynamicParams = false;

type Params = Promise<{ tip: string }>;

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const title = nazvanieTipa('15', (await params).tip);
  return title === undefined ? {} : metaPodstranitsy(15, 'razbor', tekstBezTex(title));
}

/** Разобранная задача типа №15: решение по шагам на живом чертеже. */
export default async function Page({ params }: { params: Params }) {
  return <RazborStranitsa no="15" tip={(await params).tip} />;
}
