'use client';

import { clsx } from 'clsx';
import { TitleText } from './TitleText';

export interface ContentsItem {
  id: string;
  title: string;
  /** Заголовок, набранный KaTeX на сервере. Нет — выводится title. */
  titleHtml?: string;
  /** Подпункты: видны под открытым разделом (теория №11). */
  podpunkty?: { id: string; title: string }[];
}

export interface TopicContentsProps {
  items: ContentsItem[];
  /** Открытый раздел: подсвечивается в списке. */
  active: string;
  onSelect: (id: string) => void;
  /** Переход к подпункту открытого раздела: id элемента на странице. */
  onSelectPodpunkt?: (id: string) => void;
  className?: string;
}

/**
 * Содержание темы: нумерованный список разделов теории.
 *
 * Один и тот же список стоит и правой колонкой на широком экране, и
 * в шторке на узком — второго списка в проекте нет.
 */
export function TopicContents({
  items,
  active,
  onSelect,
  onSelectPodpunkt,
  className,
}: TopicContentsProps) {
  return (
    <ol className={clsx('contents-list', className)}>
      {items.map((item, index) => (
        <li key={item.id}>
          <button
            type="button"
            className={clsx('contents-item', item.id === active && 'is-active')}
            aria-current={item.id === active ? 'true' : undefined}
            onClick={() => onSelect(item.id)}
          >
            {/* Номер считается по месту в списке: руками он нигде
                не записан и не разъедется при правке содержания. */}
            <span className="contents-item__no" aria-hidden="true">
              {index + 1}
            </span>
            <span className="contents-item__title">
              <TitleText title={item.title} html={item.titleHtml} />
            </span>
          </button>
          {item.id === active && item.podpunkty !== undefined && onSelectPodpunkt !== undefined ? (
            <ul className="contents-sub">
              {item.podpunkty.map((sub) => (
                <li key={sub.id}>
                  <button
                    type="button"
                    className="contents-sub__item"
                    onClick={() => onSelectPodpunkt(sub.id)}
                  >
                    {sub.title}
                  </button>
                </li>
              ))}
            </ul>
          ) : null}
        </li>
      ))}
    </ol>
  );
}
