import type { Metadata } from 'next';
import { SiteFooter, SiteHeader } from '@/components/layout';
import { legalDocs, ofertaDoc } from '@/content/legal/documents';
import { KONTAKTY, KONTAKTY_HREF } from '@/content/kontakty';
import { prodavets, rekvizityVidny } from '@/lib/legal/prodavets';
import '@/components/legal/legal.css';
import './kontakty.css';

export const metadata: Metadata = {
  title: KONTAKTY.meta.title,
  description: KONTAKTY.meta.description,
};

/**
 * Контакты: Telegram, почта, канал. ИНН и статус — только когда
 * опубликованы реквизиты (флаг NEXT_PUBLIC_LEGAL_READY), до этого —
 * строка оператора персональных данных, как в подвале.
 */
export default function KontaktyPage() {
  const dokumenty = [
    ...(rekvizityVidny ? [ofertaDoc] : []),
    legalDocs.politika,
    legalDocs.soglashenie,
    legalDocs.soglasie,
  ];
  return (
    <>
      <SiteHeader currentHref={KONTAKTY_HREF} />
      <main className="legal kontakty">
        <div className="wrap">
          <header className="legal__head">
            <h1 className="legal__title">{KONTAKTY.zagolovok}</h1>
            <p className="kontakty__lid">{KONTAKTY.lid}</p>
          </header>

          <ul className="kontakty__spisok">
            {KONTAKTY.sposoby.map((s) => (
              <li key={s.id} className="kontakty__punkt">
                <p className="kontakty__nazvanie">{s.nazvanie}</p>
                <a
                  className="kontakty__znachenie"
                  href={s.href}
                  {...(s.vneshnyaya ? { target: '_blank', rel: 'noopener noreferrer' } : {})}
                >
                  {s.znachenie}
                </a>
                <p className="kontakty__zachem">{s.zachem}</p>
              </li>
            ))}
          </ul>

          <section className="legal__body kontakty__rekvizity">
            {rekvizityVidny ? (
              <>
                <h2 className="legal__h">{KONTAKTY.rekvizity.zagolovok}</h2>
                <p>{prodavets.fio}</p>
                <p>
                  {KONTAKTY.rekvizity.status}: {prodavets.statusPolnostyu}
                </p>
                <p>
                  {KONTAKTY.rekvizity.inn}: {prodavets.inn}
                </p>
              </>
            ) : (
              <p>
                {KONTAKTY.operator}: {prodavets.fio}
              </p>
            )}
            <h2 className="legal__h">{KONTAKTY.dokumenty}</h2>
            <ul>
              {dokumenty.map((d) => (
                <li key={d.href}>
                  <a href={d.href}>{d.title}</a>
                </li>
              ))}
            </ul>
          </section>
        </div>
      </main>
      <SiteFooter />
    </>
  );
}
