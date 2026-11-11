import type { Metadata } from 'next';
import { Stranica } from '../Stranica';

/* Черновик композиции «Об авторе», вариант «Портрет». Только для
   разработки (page.dev.tsx: маршрут есть лишь в `next dev` или со
   флагом GALEREYA=1). */
export const metadata: Metadata = {
  title: 'Об авторе — вариант «Портрет»',
  robots: { index: false, follow: false },
};

export default function Page() {
  return <Stranica vid="portret" />;
}
