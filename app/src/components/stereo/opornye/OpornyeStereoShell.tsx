import Link from 'next/link';
import type { ReactNode } from 'react';
import { TabScrollOnMount } from '@/components/tasks/TabScroll';
import { OPORNYE_3 } from '@/content/stereo/opornye3';

/** Постоянная часть вкладки «Опорные задачи» №3: заголовок, описание, «← Все блоки» в блоке. */
export function OpornyeStereoShell({
  title,
  listHref,
  vBloke = false,
  dekor,
  children,
}: {
  title: string;
  listHref: string;
  vBloke?: boolean;
  /** Декоративная иллюстрация справа от заголовка (SVG движка). */
  dekor?: string;
  children: ReactNode;
}) {
  return (
    <section className="prep o3-prep">
      <header className="prep__head o3-prep__head">
        <div className="o3-prep__zag">
          <h2 className="t-h2 prep__title o3-prep__title">{title}</h2>
          {vBloke ? null : <p className="prep__lead">{OPORNYE_3.lead}</p>}
        </div>
        {dekor === undefined ? null : (
          <span
            className="o3-prep__dekor"
            aria-hidden="true"
            dangerouslySetInnerHTML={{ __html: dekor }}
          />
        )}
      </header>
      {vBloke ? (
        <Link className="o3-prep__back" href={listHref} scroll={false}>
          {OPORNYE_3.kListu}
        </Link>
      ) : null}
      <TabScrollOnMount />
      {children}
    </section>
  );
}
