import type { ReactNode } from 'react';
import { clsx } from 'clsx';
import { OPORNYE } from '@/content/opornye';
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
  /** Строка под заголовком. Не задана — общая строка про конспект. */
  lead?: string;
  /**
   * Лента чипов блоков под шапкой. У дорожки блоков №4 её нет: блоки
   * и так идут карточками один за другим.
   */
  chips?: boolean;
  /** Класс на секции: у дорожки №4 шапка раскладывается по макету. */
  className?: string;
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
export function PodgotovkaShell({
  zadanie,
  base,
  active,
  bloki,
  lead = PODGOTOVKA_SLOVA.lead,
  chips = true,
  className,
  children,
}: PodgotovkaShellProps) {
  const listHref = `${base}/${OPORNYE.tail}`;
  return (
    <section className={clsx('prep', className)}>
      <header className="prep__head">
        <div className="prep__head-text">
          <h2 className="t-h2 prep__title">{PODGOTOVKA_SLOVA.title}</h2>
          <p className="prep__lead">{lead}</p>
        </div>
        <div className="prep__head-schet">
          <PodgotovkaSchet
            zadanie={zadanie}
            bloki={bloki.map((blok) => ({
              id: blok.id,
              zadachi: blok.zadachi.map((zadacha) => zadacha.id),
            }))}
          />
        </div>
      </header>

      {chips ? (
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
      ) : null}
      <TabScrollOnMount />
      {children}
    </section>
  );
}
