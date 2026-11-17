import type { Metadata } from 'next';
import { Glavnaya } from '@/components/landing/Glavnaya';
import '../../../landing.css';

/* Служебная страница: настоящая главная с добавками, вариант 1
   (docs/audit-prodazhi.md, волна 2). В поиск не попадает, из меню не
   видна. Боевая главная (app/page.tsx) — без добавок. */
export const metadata: Metadata = {
  title: 'Будет на ЕГЭ — главная, вариант 1',
  robots: { index: false, follow: false },
};

export default function Page() {
  return (
    <Glavnaya
      level="profile"
      dobavki={{ hero: { avtor: true, tarify: 'ryadom' }, tarifyBlok: 'posleBanka' }}
    />
  );
}
