import type { Metadata } from 'next';
import { SiteFooter, SiteHeader } from '@/components/layout';
import {
  ByloStalo,
  Galereya,
  Kalkulyator,
  KtoDelaet,
  Otzyvy,
  Pakety,
  Poryadok,
  Srochnost,
  Tezisy,
  UslugaHero,
  Voprosy,
  ZakazProvider,
  ZakazSekciya,
} from '@/components/uchitelyam';
import { USLUGA_HREF, uchitelyam } from '@/content/uchitelyam';
import '../landing.css';
import '@/components/uchitelyam/usluga.css';

export const metadata: Metadata = {
  title: uchitelyam.meta.title,
  description: uchitelyam.meta.description,
};

/**
 * Страница учителя: услуга «Материалы под ключ».
 * Экраны сверху вниз — §6 документа docs/SERVICE TEACHERS LANDING.md.
 * Калькулятор и форма делят один заказ: ZakazProvider держит его на всю страницу.
 */
export default function UchitelyamPage() {
  return (
    <>
      <SiteHeader currentHref={USLUGA_HREF} />
      <ZakazProvider>
        <main>
          <UslugaHero />
          <ByloStalo />
          <Tezisy />
          <Galereya />
          <Pakety />
          <Kalkulyator />
          <Srochnost />
          <Poryadok />
          <KtoDelaet />
          <Otzyvy />
          <Voprosy />
          <ZakazSekciya />
        </main>
      </ZakazProvider>
      <SiteFooter links={uchitelyam.podval.links} />
    </>
  );
}
