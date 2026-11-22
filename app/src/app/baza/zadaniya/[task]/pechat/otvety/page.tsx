import { PechatBazy, pechatBazyMetadata, pechatBazyParams } from '@/components/baza/pechat';
import type { BazaParams } from '@/components/baza/stranitsa';

export const generateStaticParams = pechatBazyParams;
export const dynamicParams = false;

export function generateMetadata({ params }: { params: BazaParams }) {
  return pechatBazyMetadata(params, 'uchitel');
}

/** Лист учителя генератора базы: те же задачи, ответы и краткий разбор. */
export default function Page({ params }: { params: BazaParams }) {
  return <PechatBazy params={params} vid="uchitel" />;
}
