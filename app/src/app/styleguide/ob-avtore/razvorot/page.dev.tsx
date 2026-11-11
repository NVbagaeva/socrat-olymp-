import type { Metadata } from 'next';
import { Stranica } from '../Stranica';

/* Черновик композиции «Об авторе», вариант «Журнальный разворот». Только для
   разработки (page.dev.tsx: маршрут есть лишь в `next dev` или со
   флагом GALEREYA=1). */
export const metadata: Metadata = {
  title: 'Об авторе — вариант «Журнальный разворот»',
  robots: { index: false, follow: false },
};

export default function Page() {
  return <Stranica vid="razvorot" />;
}
