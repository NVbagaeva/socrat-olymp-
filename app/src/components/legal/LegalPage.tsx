import type { Metadata } from 'next';
import { SiteFooter, SiteHeader } from '@/components/layout';
import { legalDocs, legalPageText, type LegalDocId } from '@/content/legal/documents';
import { legalBlocks } from '@/lib/legal/documents';
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
  const blocks = legalBlocks(id);
  const toc = blocks.flatMap((b) => (b.type === 'h' ? [{ id: b.id, text: b.text }] : []));
  const others = Object.values(legalDocs).filter((d) => d.id !== id);

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
      <SiteHeader currentHref={doc.href} />
      <main className="legal">
        <div className="wrap">
          {operatorFilled ? null : (
            <p className="legal__draft" role="note">
              {legalPageText.draft}
            </p>
          )}
          <header className="legal__head">
            <h1 className="legal__title">{doc.title}</h1>
            <p className="legal__edition">
              {legalPageText.edition} <time>{operator.data}</time>
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
                    <li key={d.id}>
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
