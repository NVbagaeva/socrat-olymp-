import type { ReactNode } from 'react';
import { OPORNYE } from '@/content/opornye';
import { OPORNYE_1 } from '@/content/zadanie1';
import { BLOKI } from '@/lib/planimetriya/prep/bloki';
import { PrepChips } from '../prep/PrepChips';
import { TabScrollOnMount } from '../TabScroll';
import { Opornye1Counter } from './Opornye1Counter';

export interface Opornye1ShellProps {
  /** Адрес раздела: /zadaniya/1. */
  base: string;
  /** Что открыто: список блоков или блок. */
  active: string;
  children: ReactNode;
}

/**
 * Постоянная часть вкладки «Опорные задачи» №1: заголовок, счётчик
 * тренировок, лента блоков. Устройство то же, что у №2.
 */
export function Opornye1Shell({ base, active, children }: Opornye1ShellProps) {
  const listHref = `${base}/${OPORNYE.tail}`;
  return (
    <section className="prep z1-prep">
      <header className="prep__head">
        <h2 className="t-h2 prep__title">{OPORNYE_1.title}</h2>
        <p className="prep__lead">{OPORNYE_1.lead}</p>
        <Opornye1Counter totals={BLOKI.map((b) => ({ id: b.id, total: b.zadachi.length }))} />
      </header>
      <PrepChips
        allLabel={OPORNYE_1.allLabel}
        listHref={listHref}
        active={active}
        items={BLOKI.map((b) => ({ id: b.slug, title: b.nazvanie, href: `${listHref}${b.slug}/` }))}
      />
      <TabScrollOnMount />
      {children}
    </section>
  );
}
