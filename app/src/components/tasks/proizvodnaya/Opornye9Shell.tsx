import type { ReactNode } from 'react';
import { OPORNYE } from '@/content/opornye';
import { OPORNYE_9 } from '@/content/proizvodnaya';
import { PREP_BLOCKS } from '@/lib/proizvodnaya/prep/blocks';
import { PrepChips } from '../prep/PrepChips';
import { TabScrollOnMount } from '../TabScroll';
import { Opornye9Counter } from './Opornye9Counter';

export interface Opornye9ShellProps {
  /** Адрес раздела: /zadaniya/9. */
  base: string;
  /** Что открыто: список блоков или блок. */
  active: string;
  children: ReactNode;
}

/** Постоянная часть вкладки «Опорные задачи» №9: заголовок, счётчик, лента блоков. */
export function Opornye9Shell({ base, active, children }: Opornye9ShellProps) {
  const listHref = `${base}/${OPORNYE.tail}`;
  return (
    <section className="prep z9-prep">
      <header className="prep__head">
        <h2 className="t-h2 prep__title">{OPORNYE_9.title}</h2>
        <p className="prep__lead">{OPORNYE_9.lead}</p>
        <Opornye9Counter
          totals={PREP_BLOCKS.map((block) => ({ id: block.id, total: block.zadachi.length }))}
        />
      </header>
      <PrepChips
        allLabel={OPORNYE_9.allLabel}
        listHref={listHref}
        active={active}
        items={PREP_BLOCKS.map((block) => ({
          id: block.slug,
          title: block.nazvanie,
          href: `${listHref}${block.slug}/`,
        }))}
      />
      <TabScrollOnMount />
      {children}
    </section>
  );
}
