import type { ReactNode } from 'react';
import { OPORNYE } from '@/content/opornye';
import { prep8Page } from '@/content/vychisleniya';
import { PREP_BLOCKS } from '@/lib/vychisleniya/prep/blocks';
import { PrepChips } from '../prep/PrepChips';
import { TabScrollOnMount } from '../TabScroll';
import { Podgotovka8Counter } from './Podgotovka8Counter';

export interface Podgotovka8ShellProps {
  /** Адрес раздела: /zadaniya/8. */
  base: string;
  /** Что открыто: список блоков или блок. */
  active: string;
  children: ReactNode;
}

/** Постоянная часть вкладки подготовки №8: заголовок, счётчик, лента блоков. */
export function Podgotovka8Shell({ base, active, children }: Podgotovka8ShellProps) {
  const listHref = `${base}/${OPORNYE.tail}`;
  return (
    <section className="prep">
      <header className="prep__head">
        <h2 className="t-h2 prep__title">{prep8Page.title}</h2>
        <p className="prep__lead">{prep8Page.lead}</p>
        <Podgotovka8Counter
          totals={PREP_BLOCKS.map((block) => ({ id: block.id, total: block.zadachi.length }))}
        />
      </header>
      <PrepChips
        allLabel={prep8Page.allLabel}
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
