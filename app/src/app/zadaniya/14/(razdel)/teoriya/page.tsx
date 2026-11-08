import type { Metadata } from 'next';
import { Teoriya14 } from '@/components/zadanie14/Teoriya14';
import { ZADANIE14, zadanie14Title } from '@/content/zadanie14';

const VKLADKA = ZADANIE14.tabs.find((tab) => tab.id === 'teoriya')?.label ?? 'Теория';

export const metadata: Metadata = {
  title: zadanie14Title(VKLADKA),
};

/**
 * Вкладка «Теория» №14: главы подряд, содержание рядом. Страница
 * серверная: формулы и окружности набираются на сборке; живые рисунки
 * (перетаскивание точки, деление по шагам) — клиентские островки.
 */
export default function Teoriya14Tab() {
  return <Teoriya14 vkladka={VKLADKA} />;
}
