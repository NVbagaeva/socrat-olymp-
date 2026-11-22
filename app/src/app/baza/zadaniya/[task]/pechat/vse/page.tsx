import { PechatBazy, pechatBazyMetadata, pechatBazyParams } from '@/components/baza/pechat';
import type { BazaParams } from '@/components/baza/stranitsa';

export const generateStaticParams = pechatBazyParams;
export const dynamicParams = false;

export function generateMetadata({ params }: { params: BazaParams }) {
  return pechatBazyMetadata(params, 'vse');
}

/** «Всё одним файлом» генератора базы: лист ученика, затем лист учителя. */
export default function Page({ params }: { params: BazaParams }) {
  return <PechatBazy params={params} vid="vse" />;
}
