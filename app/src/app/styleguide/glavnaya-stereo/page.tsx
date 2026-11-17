import type { Metadata } from 'next';
import { GlavnayaSumerki } from '@/components/landing/sumerki/GlavnayaSumerki';
import { StereoChast } from '@/components/landing/sumerki/StereoChast';
import '../../landing.css';

/* Служебная страница: главная с третьей частью витрины — живым
   чертежом стереометрии (StereoChast). В поиск не попадает, из меню не
   видна. Боевая главная (app/page.tsx) не меняется, пока владелец не
   одобрит. */
export const metadata: Metadata = {
  title: 'Будет на ЕГЭ — витрина, живая стереометрия',
  robots: { index: false, follow: false },
};

export default function Page() {
  return <GlavnayaSumerki vid="vitrina" vitrinaPosle={<StereoChast />} />;
}
