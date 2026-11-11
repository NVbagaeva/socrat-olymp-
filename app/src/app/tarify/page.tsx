import type { Metadata } from 'next';
import { SiteFooter, SiteHeader } from '@/components/layout';
import { KakEtoRabotaet, PodskazkiBlok, Shkoly, Voprosy } from '@/components/tarify/Bloki';
import { Sravnenie } from '@/components/tarify/Sravnenie';
import { TarifyVybor } from '@/components/tarify/TarifyVybor';
import { TARIFY } from '@/content/tarify';
import {
  PAYMENTS_ENABLED,
  PERIOD_DNEY,
  PLATNYE,
  TARIFY_HREF,
  tsenaDoEge,
  type Rol,
} from '@/lib/tarify/config';
import '@/components/tarify/tarify.css';
import './stranica.css';

export const metadata: Metadata = {
  title: TARIFY.meta.title,
  description: TARIFY.meta.description,
};

/**
 * Разметка Offer для поисковиков — только при включённой оплате:
 * предложение, которое нельзя купить, поисковику показывать нельзя.
 */
function OfferRazmetka() {
  if (!PAYMENTS_ENABLED) return null;
  const roli: Rol[] = ['uchenik', 'repetitor'];
  const offers = roli.flatMap((rol) => {
    const ege = tsenaDoEge(rol);
    return [
      {
        '@type': 'Offer',
        name: `${PLATNYE[rol].nazvanie} — ${PERIOD_DNEY} дней`,
        price: PLATNYE[rol].tsena30,
        priceCurrency: 'RUB',
        url: `https://budetege.ru${TARIFY_HREF}`,
      },
      ...(ege === null
        ? []
        : [
            {
              '@type': 'Offer',
              name: `${PLATNYE[rol].nazvanie} — до ЕГЭ`,
              price: ege,
              priceCurrency: 'RUB',
              url: `https://budetege.ru${TARIFY_HREF}`,
            },
          ]),
    ];
  });
  const json = {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: 'Будет на ЕГЭ — подготовка к ЕГЭ по профильной математике',
    offers,
  };
  return (
    <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(json) }} />
  );
}

export default function TarifyPage() {
  const { shapka } = TARIFY;
  return (
    <div className="tarify-stranica">
      <SiteHeader className="site-head--steklo" currentHref={TARIFY_HREF} />
      <main className="tf tf--b">
        <div className="tf-aura" aria-hidden="true">
          <span className="tf-aura__siniy" />
          <span className="tf-aura__teplyy" />
          <span className="tf-aura__terra" />
        </div>

        <header className="tf-shapka">
          <p className="tf-shapka__nad">{shapka.nad}</p>
          <h1 className="tf-shapka__zagolovok">{shapka.zagolovok}</h1>
          <p className="tf-shapka__lid">{shapka.lid}</p>
        </header>

        <TarifyVybor />
        <PodskazkiBlok />
        <Sravnenie />
        <KakEtoRabotaet />
        <Voprosy />
        <Shkoly />
      </main>
      <SiteFooter className="site-foot--steklo" />
      <OfferRazmetka />
    </div>
  );
}
