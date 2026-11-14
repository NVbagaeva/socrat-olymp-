import type { Metadata } from 'next';
import { SiteFooter, SiteHeader } from '@/components/layout';
import { legalDocs, legalPageText, type LegalDocId } from '@/content/legal/documents';
import { legalBlocks } from '@/lib/legal/documents';
import type { LegalBlock } from '@/lib/legal/markdown';
import { operator, operatorFilled } from '@/lib/legal/operator';
import { LegalText } from './LegalText';
import './legal.css';

/** Заголовок, описание и разрешение индексировать — у всех трёх страниц одинаково. */
export function legalMetadata(id: LegalDocId): Metadata {
  const doc = legalDocs[id];
  return {
    title: `${doc.title} — Будет на ЕГЭ`,
    description: doc.description,
    robots: { index: true, follow: true },
  };
}

/**
 * Страница правового документа: заголовок, дата редакции, оглавление
 * по разделам и текст. Оглавление на широком экране — колонкой слева
 * и едет вместе со страницей, на узком — раскрывающимся списком сверху.
 */
export function LegalPage({ id }: { id: LegalDocId }) {
  const doc = legalDocs[id];
  return (
    <LegalLayout
      title={doc.title}
      currentHref={doc.href}
      edition={operator.data}
      draft={operatorFilled ? null : legalPageText.draft}
      blocks={legalBlocks(id)}
      others={Object.values(legalDocs).filter((d) => d.id !== id)}
    />
  );
}

/** Макет документа — общий для политики, согласия, соглашения и оферты. */
export function LegalLayout({
  title,
  currentHref,
  edition,
  draft,
  blocks,
  others,
}: {
  title: string;
  currentHref: string;
  edition: string;
  /** Плашка «черновик» над заголовком; null — документ готов. */
  draft: string | null;
  blocks: LegalBlock[];
  others: { href: string; title: string }[];
}) {
  const toc = blocks.flatMap((b) => (b.type === 'h' ? [{ id: b.id, text: b.text }] : []));

  const tocList = (
    <ol className="legal-toc__list">
      {toc.map((t) => (
        <li key={t.id}>
          <a href={`#${t.id}`}>{t.text}</a>
        </li>
      ))}
    </ol>
  );

  return (
    <>
      <SiteHeader currentHref={currentHref} />
      <main className="legal">
        <div className="wrap">
          {draft === null ? null : (
            <p className="legal__draft" role="note">
              {draft}
            </p>
          )}
          <header className="legal__head">
            <h1 className="legal__title">{title}</h1>
            <p className="legal__edition">
              {legalPageText.edition} <time>{edition}</time>
            </p>
          </header>

          <div className="legal__grid">
            <nav className="legal-toc" aria-label={legalPageText.toc}>
              <details className="legal-toc__fold">
                <summary>{legalPageText.toc}</summary>
                {tocList}
              </details>
              <div className="legal-toc__side">
                <p className="legal-toc__t">{legalPageText.toc}</p>
                {tocList}
              </div>
            </nav>

            <article className="legal__body">
              <LegalText blocks={blocks} />

              <aside className="legal__others" aria-label={legalPageText.otherDocs}>
                <p className="legal-toc__t">{legalPageText.otherDocs}</p>
                <ul>
                  {others.map((d) => (
                    <li key={d.href}>
                      <a href={d.href}>{d.title}</a>
                    </li>
                  ))}
                </ul>
              </aside>
            </article>
          </div>
        </div>
      </main>
      <SiteFooter />
    </>
  );
}
