import type { Metadata } from 'next';
import { LegalLayout } from '@/components/legal/LegalPage';
import { legalDocs, legalPageText, ofertaDoc } from '@/content/legal/documents';
import { ofertaBlocks } from '@/lib/legal/documents';
import { LEGAL_READY, prodavets, rekvizityVidny } from '@/lib/legal/prodavets';

/*
 * Расширение .oferta.tsx: маршрут собирается только в next dev, в превью
 * (OFERTA_PREVIEW=1) и с NEXT_PUBLIC_LEGAL_READY=1 — next.config.ts.
 * В обычной сборке адреса /oferta/ нет, хостинг отдаёт 404.
 */

export const metadata: Metadata = {
  title: `${ofertaDoc.title} — Будет на ЕГЭ`,
  description: ofertaDoc.description,
  /* Черновик в поиск не попадает. */
  robots: LEGAL_READY ? { index: true, follow: true } : { index: false, follow: false },
};

export default function Page() {
  return (
    <LegalLayout
      title={ofertaDoc.title}
      currentHref={ofertaDoc.href}
      edition={prodavets.dataOferty}
      draft={rekvizityVidny ? null : legalPageText.draftOferta}
      blocks={ofertaBlocks()}
      others={Object.values(legalDocs)}
    />
  );
}
