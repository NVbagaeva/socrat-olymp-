import type { Metadata } from 'next';
import { Suspense } from 'react';
import { ListPechat } from '@/components/sbornik/ListPechat';
import { sbornikTitle } from '@/content/sbornik';
import { nomerGlavy, staticGlavy } from '@/lib/sbornik/marshrut';
import 'katex/dist/katex.min.css';
import '@/lib/graph/graph.css';
import '@/lib/sheet/theme.css';
import '@/lib/sheet/sheet.css';
import './pechat-sbornik.css';

export const dynamicParams = false;

export function generateStaticParams(): { glava: string }[] {
  return staticGlavy();
}

export async function generateMetadata({ params }: { params: Promise<{ glava: string }> }): Promise<Metadata> {
  const { glava } = await params;
  return { title: sbornikTitle('Лист для печати', `Глава ${nomerGlavy(glava)}`), robots: { index: false } };
}

/**
 * Лист генератора сборника: ?vid=uchitel — с решениями и ответами,
 * без него — лист ученика. Оболочки сайта нет.
 */
export default async function PechatGlavy({ params }: { params: Promise<{ glava: string }> }) {
  const { glava } = await params;
  return (
    <Suspense fallback={null}>
      <ListPechat glava={nomerGlavy(glava)} />
    </Suspense>
  );
}
