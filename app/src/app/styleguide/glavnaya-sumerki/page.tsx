import type { Metadata } from 'next';
import { GlavnayaSumerki } from '@/components/landing/sumerki/GlavnayaSumerki';
import '../../landing.css';

/* Служебная страница: главная с синей сценой «витрина» — большая
   скруглённая карточка на светлом фоне. Для сравнения — сцена на всю
   ширину: /styleguide/glavnaya-sumerki/na-vsyu-shirinu/. В поиск не
   попадает, из меню не видна. Боевая главная (app/page.tsx) не
   меняется, пока владелец не выберет вариант. */
export const metadata: Metadata = {
  title: 'Будет на ЕГЭ — синяя сцена, витрина',
  robots: { index: false, follow: false },
};

export default function Page() {
  return <GlavnayaSumerki vid="vitrina" />;
}
