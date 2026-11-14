import { bazaBlokParams, bazaMetadata, OpornyyBlokPage } from '@/components/baza/stranitsa';

/* Блоки опорных задач всех наполненных разделов базы. */
export const generateStaticParams = bazaBlokParams;
export const dynamicParams = false;

type Params = Promise<{ task: string; blok: string }>;

export function generateMetadata({ params }: { params: Params }) {
  return bazaMetadata(params, 'opornye');
}

export default function Page({ params }: { params: Params }) {
  return <OpornyyBlokPage params={params} />;
}
