import { Redirect, REDIRECT_METADATA } from '@/components/layout';
import { OPORNYE } from '@/content/opornye';
import { RAZDELY } from '@/lib/zadanie3';
import { ZADANIYA } from '@/lib/paths';

/* Те же адреса, что были: по разделу на фигуру. */
export function generateStaticParams() {
  return RAZDELY.map((razdel) => ({ figura: razdel.slug }));
}
export const dynamicParams = false;

export const metadata = REDIRECT_METADATA;

type Params = Promise<{ figura: string }>;

/**
 * Прежний адрес вкладки раздела №3: до переименования в «Опорные
 * задачи». Оболочка раздела приходит из layout, поэтому здесь только
 * сам перенос.
 */
export default async function Page({ params }: { params: Params }) {
  const { figura } = await params;
  return <Redirect href={`${ZADANIYA}/3/${figura}/${OPORNYE.tail}`} title={OPORNYE.title} />;
}
