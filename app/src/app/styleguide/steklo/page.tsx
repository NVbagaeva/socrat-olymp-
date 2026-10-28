import type { Metadata } from 'next';
import { DemoStranica } from '../_napravleniya/DemoStranica';
import './tokens-steklo.css';
import './steklo.css';

/* Демо направления «Стеклянная сцена». Токены и стили подключены только здесь
   и действуют только под корневым классом .dm-steklo. */
export const metadata: Metadata = {
  title: 'Будет на ЕГЭ — демо «Стеклянная сцена»',
  robots: { index: false, follow: false },
};

export default function Page() {
  return <DemoStranica vid="steklo" />;
}
