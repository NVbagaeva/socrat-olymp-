import type { Metadata } from 'next';
import { GlavnayaSumerki } from '@/components/landing/sumerki/GlavnayaSumerki';
import '../../../landing.css';

/* Служебная страница: главная с синей сценой и витриной возможностей
   под вторым вариантом заголовка (content/vitrina.ts) — для выбора рядом
   с первым на /styleguide/glavnaya-sumerki/. В поиск не попадает, из
   меню не видна. */
export const metadata: Metadata = {
  title: 'Будет на ЕГЭ — синяя сцена, заголовок Б',
  robots: { index: false, follow: false },
};

export default function Page() {
  return <GlavnayaSumerki vid="vitrina" zagolovok="b" />;
}
