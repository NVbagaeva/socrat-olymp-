import type { Metadata } from 'next';
import { nazvanieTipa, RazborStranitsa, tipySRazborom } from '@/components/stereo/RazborStranitsa';
import { stereoTitle } from '@/content/stereo/zadaniya';

export function generateStaticParams() {
  return tipySRazborom('3');
}
export const dynamicParams = false;

type Params = Promise<{ tip: string }>;

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const title = nazvanieTipa('3', (await params).tip);
  return title === undefined ? {} : { title: stereoTitle('3', `Разбор: ${title}`) };
}

/** Разобранная задача типа №3: решение по шагам на живом чертеже. */
export default async function Page({ params }: { params: Params }) {
  return <RazborStranitsa no="3" tip={(await params).tip} />;
}
