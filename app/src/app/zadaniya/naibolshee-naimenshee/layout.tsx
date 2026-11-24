import type { ReactNode } from 'react';
import { StrazhRazdela, metadataRazdela } from '@/components/tasks/skrytye/StrazhRazdela';

/* Все страницы раздела под одной обёрткой: пока раздела нет в
   действующей структуре экзамена (content/struktura.js), посетителям
   он закрыт, администратору — открыт с плашкой. */
export const metadata = metadataRazdela('naibolshee-naimenshee');

export default function Razdel21Layout({ children }: { children: ReactNode }) {
  return <StrazhRazdela kod="naibolshee-naimenshee">{children}</StrazhRazdela>;
}
