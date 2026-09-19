import type { ReactNode } from 'react';
import { PODGOTOVKA_SLOVA, type Zadanie } from '@/content/veroyatnost';
import type { PrepPoolBlok } from '@/lib/veroyatnost/pool';
import { PrepChips } from '../prep/PrepChips';
import { TabScrollOnMount } from '../TabScroll';
import { PodgotovkaSchet } from './PodgotovkaSchet';

export interface PodgotovkaShellProps {
  zadanie: Zadanie;
  /** Адрес раздела: /zadaniya/4. */
  base: string;
  /** Что открыто: `all` — список блоков, иначе идентификатор блока. */
  active: string;
  bloki: PrepPoolBlok[];
  children: ReactNode;
}

/**
 * Постоянная часть вкладки подготовки заданий №4 и №5: заголовок,
 * общий счёт и лента блоков.
 *
 * Устроено как у заданий №12 и №8: лента — ссылки, а не фильтр,
 * поэтому работают «назад» и открытие в новой вкладке, а страница
 * блока живёт на своём адресе.
 */
export function PodgotovkaShell({ zadanie, base, active, bloki, children }: PodgotovkaShellProps) {
  const listHref = `${base}/podgotovka/`;
  return (
    <section className="prep">
      <header className="prep__head">
        <h2 className="t-h2 prep__title">{PODGOTOVKA_SLOVA.title}</h2>
        <p className="prep__lead">{PODGOTOVKA_SLOVA.lead}</p>
        <PodgotovkaSchet
          zadanie={zadanie}
          bloki={bloki.map((blok) => ({
            id: blok.id,
            zadachi: blok.zadachi.map((zadacha) => zadacha.id),
          }))}
        />
      </header>

      <PrepChips
        allLabel={PODGOTOVKA_SLOVA.allLabel}
        listHref={listHref}
        active={active}
        items={bloki.map((blok) => ({
          id: blok.id,
          title: blok.nazvanie,
          href: `${listHref}${blok.id}/`,
        }))}
      />
      <TabScrollOnMount />
      {children}
    </section>
  );
}
