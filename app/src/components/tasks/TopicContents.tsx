'use client';

import { clsx } from 'clsx';

export interface ContentsItem {
  id: string;
  title: string;
  /**
   * Раздел ещё не написан: пункт остаётся в списке, но никуда
   * не ведёт, а рядом стоит эта пометка. План темы виден целиком.
   */
  metka?: string;
}

export interface TopicContentsProps {
  items: ContentsItem[];
  /** Открытый раздел: подсвечивается в списке. */
  active: string;
  /** Переход нажатием. Разделы вкладки — состояние, а не адрес. */
  onSelect?: (id: string) => void;
  /**
   * Адрес пункта. Задан — список становится ссылками-якорями: так
   * он стоит там, где разделы лежат на одной странице подряд.
   */
  href?: (id: string) => string;
  className?: string;
}

/**
 * Содержание темы: нумерованный список разделов теории.
 *
 * Один и тот же список стоит и правой колонкой на широком экране, и
 * в шторке на узком — второго списка в проекте нет. Пункт бывает
 * кнопкой (разделы переключаются на месте, как у задания №12) или
 * ссылкой-якорем (разделы идут подряд на одной странице): разметка
 * и стили у обоих одни.
 */
export function TopicContents({ items, active, onSelect, href, className }: TopicContentsProps) {
  return (
    <ol className={clsx('contents-list', className)}>
      {items.map((item, index) => {
        /* Номер считается по месту в списке: руками он нигде
           не записан и не разъедется при правке содержания. */
        const nutro = (
          <>
            <span className="contents-item__no" aria-hidden="true">
              {index + 1}
            </span>
            <span className="contents-item__title">{item.title}</span>
            {item.metka === undefined ? null : (
              <span className="contents-item__metka">{item.metka}</span>
            )}
          </>
        );
        const klass = clsx('contents-item', item.id === active && 'is-active');
        const tekushchiy = item.id === active ? 'true' : undefined;

        return (
          <li key={item.id}>
            {/* Ненаписанный раздел никуда не ведёт: ни ссылки,
                ни кнопки — один текст с пометкой. */}
            {item.metka !== undefined ? (
              <span className={clsx(klass, 'contents-item--pusto')}>{nutro}</span>
            ) : href === undefined ? (
              <button
                type="button"
                className={klass}
                aria-current={tekushchiy}
                onClick={() => onSelect?.(item.id)}
              >
                {nutro}
              </button>
            ) : (
              <a className={klass} href={href(item.id)} aria-current={tekushchiy}>
                {nutro}
              </a>
            )}
          </li>
        );
      })}
    </ol>
  );
}
