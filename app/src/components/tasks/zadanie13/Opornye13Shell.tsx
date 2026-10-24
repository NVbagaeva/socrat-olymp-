import Link from 'next/link';
import type { ReactNode } from 'react';
import { OPORNYE_13 } from '@/content/zadanie13';
import { TabScrollOnMount } from '../TabScroll';
import { Opornye13Counter } from './Opornye13Counter';

export interface Opornye13ShellProps {
  /** Адрес списка блоков: /zadaniya/13/opornye-zadachi/. */
  listHref: string;
  /** Блоки и число задач в них — для общего счётчика. */
  totals: { id: string; total: number }[];
  /** Открыт блок — над ним ссылка «← Все блоки». */
  vBloke?: boolean;
  children: ReactNode;
}

/** Постоянная часть вкладки «Опорные задачи» №13: заголовок и счётчик. */
export function Opornye13Shell({ listHref, totals, vBloke, children }: Opornye13ShellProps) {
  return (
    <section className="prep z13-prep">
      <header className="prep__head">
        <h2 className="t-h2 prep__title">{OPORNYE_13.title}</h2>
        <p className="prep__lead">{OPORNYE_13.lead}</p>
        <Opornye13Counter totals={totals} />
      </header>
      {vBloke ? (
        <Link className="z13-prep__back" href={listHref} scroll={false}>
          {OPORNYE_13.nazad}
        </Link>
      ) : null}
      <TabScrollOnMount />
      {children}
    </section>
  );
}
