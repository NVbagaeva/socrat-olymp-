import type { ReactNode } from 'react';
import { StrazhRazdela, metadataRazdela } from '@/components/tasks/skrytye/StrazhRazdela';

/* Все страницы раздела — вкладки, печать, шпаргалка — под одной
   обёрткой: когда раздела нет в структуре экзамена
   (content/struktura.js), посетителям он закрыт. */
export const metadata = metadataRazdela('sluchainye-velichiny');

export default function Razdel6Layout({ children }: { children: ReactNode }) {
  return <StrazhRazdela kod="sluchainye-velichiny">{children}</StrazhRazdela>;
}
