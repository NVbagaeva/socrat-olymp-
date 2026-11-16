import type { Metadata } from 'next';
import { GlavnayaSumerki } from '@/components/landing/sumerki/GlavnayaSumerki';
import '../../../landing.css';

/* Служебная страница: сцена варианта А с мягким ореолом за кристаллом —
   на выбор рядом с сильным (/styleguide/glavnaya-sumerki/). В поиск не
   попадает, из меню не видна. */
export const metadata: Metadata = {
  title: 'Будет на ЕГЭ — синяя сцена, мягкий ореол',
  robots: { index: false, follow: false },
};

export default function Page() {
  return <GlavnayaSumerki vid="a" oreol="myagkiy" />;
}
