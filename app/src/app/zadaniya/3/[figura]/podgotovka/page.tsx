import { Redirect, REDIRECT_METADATA } from '@/components/layout';
import { OPORNYE } from '@/content/opornye';
import { tasksPage } from '@/content/tasks';
import { RAZDELY } from '@/lib/zadanie3';

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
  return <Redirect href={`${tasksPage.href}/3/${figura}/${OPORNYE.tail}`} title={OPORNYE.title} />;
}
