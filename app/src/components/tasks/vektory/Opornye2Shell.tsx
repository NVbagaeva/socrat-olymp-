import type { ReactNode } from 'react';
import { OPORNYE } from '@/content/opornye';
import { OPORNYE_2 } from '@/content/vektory';
import { BLOKI } from '@/lib/vektory/prep/bloki';
import { PrepChips } from '../prep/PrepChips';
import { TabScrollOnMount } from '../TabScroll';
import { Opornye2Counter } from './Opornye2Counter';

export interface Opornye2ShellProps {
  /** Адрес раздела: /zadaniya/2. */
  base: string;
  /** Что открыто: список блоков или блок. */
  active: string;
  children: ReactNode;
}

/**
 * Постоянная часть вкладки «Опорные задачи» №2: заголовок, счётчик
 * тренировок, лента блоков. Устройство то же, что у подготовки №8.
 */
export function Opornye2Shell({ base, active, children }: Opornye2ShellProps) {
  const listHref = `${base}/${OPORNYE.tail}`;
  return (
    <section className="prep z2-prep">
      <header className="prep__head">
        <h2 className="t-h2 prep__title">{OPORNYE_2.title}</h2>
        <p className="prep__lead">{OPORNYE_2.lead}</p>
        <Opornye2Counter totals={BLOKI.map((b) => ({ id: b.id, total: b.zadachi.length }))} />
      </header>
      <PrepChips
        allLabel={OPORNYE_2.allLabel}
        listHref={listHref}
        active={active}
        items={BLOKI.map((b) => ({ id: b.slug, title: b.nazvanie, href: `${listHref}${b.slug}/` }))}
      />
      <TabScrollOnMount />
      {children}
    </section>
  );
}
