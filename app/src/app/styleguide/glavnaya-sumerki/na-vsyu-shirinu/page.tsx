import type { Metadata } from 'next';
import { GlavnayaSumerki } from '@/components/landing/sumerki/GlavnayaSumerki';
import '../../../landing.css';

/* Служебная страница: синяя сцена на всю ширину экрана с чётким нижним
   краем — для сравнения с витриной (/styleguide/glavnaya-sumerki/). В
   поиск не попадает, из меню не видна. */
export const metadata: Metadata = {
  title: 'Будет на ЕГЭ — синяя сцена на всю ширину',
  robots: { index: false, follow: false },
};

export default function Page() {
  return <GlavnayaSumerki vid="shirina" />;
}
