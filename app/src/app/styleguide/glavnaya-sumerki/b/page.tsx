import type { Metadata } from 'next';
import { GlavnayaSumerki } from '@/components/landing/sumerki/GlavnayaSumerki';
import '../../../landing.css';

/* Служебная страница: главная с первым экраном «Сумеречная сцена»,
   вариант Б — тёмное окно-витрина. В поиск не попадает, из меню не видна. Боевая главная
   (app/page.tsx) не меняется, пока владелец не выберет вариант. */
export const metadata: Metadata = {
  title: 'Будет на ЕГЭ — сумеречная сцена, вариант Б',
  robots: { index: false, follow: false },
};

export default function Page() {
  return <GlavnayaSumerki vid="b" />;
}
