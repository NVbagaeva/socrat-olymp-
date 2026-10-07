import Link from 'next/link';
import type { ReactNode } from 'react';
import { OPORNYE_11 } from '@/content/zadanie11';
import { TabScrollOnMount } from '../TabScroll';
import { Opornye11Counter } from './Opornye11Counter';

export interface Opornye11ShellProps {
  /** Адрес списка блоков: /zadaniya/11/opornye-zadachi/. */
  listHref: string;
  /** Блоки и число задач в них — для общего счётчика. */
  totals: { id: string; total: number }[];
  /** Открыт блок — над ним ссылка «← Все блоки». */
  vBloke?: boolean;
  children: ReactNode;
}

/** Постоянная часть вкладки «Опорные задачи» №11: заголовок и счётчик. */
export function Opornye11Shell({ listHref, totals, vBloke, children }: Opornye11ShellProps) {
  return (
    <section className="prep z11-prep">
      <header className="prep__head">
        <h2 className="t-h2 prep__title">{OPORNYE_11.title}</h2>
        <p className="prep__lead">{OPORNYE_11.lead}</p>
        <Opornye11Counter totals={totals} />
      </header>
      {vBloke ? (
        <Link className="z11-prep__back" href={listHref} scroll={false}>
          {OPORNYE_11.nazad}
        </Link>
      ) : null}
      <TabScrollOnMount />
      {children}
    </section>
  );
}
