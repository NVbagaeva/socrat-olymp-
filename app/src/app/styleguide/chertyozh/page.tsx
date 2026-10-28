import type { Metadata } from 'next';
import { DemoStranica } from '../_napravleniya/DemoStranica';
import './tokens-chertyozh.css';
import './chertyozh.css';

/* Демо направления «Чертёж». Токены и стили подключены только здесь
   и действуют только под корневым классом .dm-chertyozh. */
export const metadata: Metadata = {
  title: 'Будет на ЕГЭ — демо «Чертёж»',
  robots: { index: false, follow: false },
};

export default function Page() {
  return <DemoStranica vid="chertyozh" />;
}
