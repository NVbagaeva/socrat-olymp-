import {
  bazaMetadata,
  bazaStaticParams,
  VkladkaBazyPage,
  type BazaParams,
} from '@/components/baza/stranitsa';

export const generateStaticParams = bazaStaticParams;
export const dynamicParams = false;

export function generateMetadata({ params }: { params: BazaParams }) {
  return bazaMetadata(params, 'trenazher');
}

export default function Page({ params }: { params: BazaParams }) {
  return <VkladkaBazyPage params={params} tab="trenazher" />;
}
