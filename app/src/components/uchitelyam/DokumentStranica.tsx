import { Fragment, type ReactNode } from 'react';
import { SiteFooter, SiteHeader } from '@/components/layout';
import { uchitelyam } from '@/content/uchitelyam';
import type { Dokument } from '@/content/uchitelyam-dokumenty';

/** Незаполненный реквизит [[так]] подсвечивается, чтобы его нельзя было пропустить. */
function sPodsvetkoy(text: string): ReactNode {
  return text.split(/(\[\[[^\]]+\]\])/).map((kusok, i) =>
    kusok.startsWith('[[') ? (
      <mark className="svc-doc__todo" key={i}>
        {kusok.slice(2, -2)}
      </mark>
    ) : (
      <Fragment key={i}>{kusok}</Fragment>
    ),
  );
}

/** Абзацы раздела; подряд идущие строки «— …» собираются в список. */
function Abzacy({ text }: { text: string[] }) {
  const bloki: (string | string[])[] = [];
  text.forEach((line) => {
    if (line.startsWith('— ')) {
      const last = bloki[bloki.length - 1];
      if (Array.isArray(last)) last.push(line.slice(2));
      else bloki.push([line.slice(2)]);
    } else {
      bloki.push(line);
    }
  });
  return (
    <>
      {bloki.map((b, i) =>
        Array.isArray(b) ? (
          <ul key={i}>
            {b.map((li) => (
              <li key={li}>{sPodsvetkoy(li)}</li>
            ))}
          </ul>
        ) : (
          <p key={i}>{sPodsvetkoy(b)}</p>
        ),
      )}
    </>
  );
}

/** Страница юридического документа услуги: оферта, согласие, политика. */
export function DokumentStranica({ doc }: { doc: Dokument }) {
  return (
    <>
      <SiteHeader />
      <main className="svc-doc">
        <div className="wrap">
          <div className="svc-doc__in">
            <h1>{doc.title}</h1>
            <p className="svc-doc__data">{sPodsvetkoy(doc.redakciya)}</p>
            {doc.razdely.map((r) => (
              <section key={r.title}>
                <h2>{r.title}</h2>
                <Abzacy text={r.text} />
              </section>
            ))}
          </div>
        </div>
      </main>
      <SiteFooter links={uchitelyam.podval.links} />
    </>
  );
}
