import type { Metadata } from 'next';
import { GlavnayaSumerki } from '@/components/landing/sumerki/GlavnayaSumerki';
import '../../../landing.css';

/* Служебная страница: главная с синей сценой и блоком «вечер» с текстами
   варианта Б (content/vecher.ts) — для выбора рядом с вариантом А на
   /styleguide/glavnaya-sumerki/. В поиск не попадает, из меню не видна. */
export const metadata: Metadata = {
  title: 'Будет на ЕГЭ — синяя сцена, тексты Б',
  robots: { index: false, follow: false },
};

export default function Page() {
  return <GlavnayaSumerki vid="vitrina" tekstVechera="b" />;
}
