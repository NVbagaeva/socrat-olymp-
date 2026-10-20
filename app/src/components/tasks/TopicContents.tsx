'use client';

import { clsx } from 'clsx';
import { TitleText } from './TitleText';

export interface ContentsItem {
  /** Номер на экране. Не задан — место в списке, с единицы. */
  nomer?: number;
  id: string;
  title: string;
  /** Заголовок, набранный KaTeX на сервере. Нет — выводится title. */
  titleHtml?: string;
  /** Раздел ещё не открыт (теория №16): вместо номера — замок, строка приглушена. */
  skoro?: boolean;
  /** Подпункты: видны под открытым разделом (теория №11). */
  podpunkty?: { id: string; title: string; titleHtml?: string }[];
}

export interface TopicContentsProps {
  items: ContentsItem[];
  /** Открытый раздел: подсвечивается в списке. */
  active: string;
  onSelect: (id: string) => void;
  /** Переход к подпункту открытого раздела: id элемента на странице. */
  onSelectPodpunkt?: (id: string) => void;
  /** Подпункты видны всегда, а не только у открытого раздела. */
  podpunktyVsegda?: boolean;
  className?: string;
}

/** Замок раздела «Скоро»: рисуется вместо номера. */
export function ZamokIkonka() {
  return (
    <svg className="contents-item__zamok" viewBox="0 0 24 24" aria-hidden="true" focusable="false">
      <rect x="5" y="11" width="14" height="9" rx="2" />
      <path d="M8 11V8a4 4 0 0 1 8 0v3" />
    </svg>
  );
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
  podpunktyVsegda = false,
  className,
}: TopicContentsProps) {
  return (
    <ol className={clsx('contents-list', className)}>
      {items.map((item, index) => (
        <li key={item.id}>
          <button
            type="button"
            className={clsx(
              'contents-item',
              item.id === active && 'is-active',
              item.skoro && 'is-skoro',
            )}
            aria-current={item.id === active ? 'true' : undefined}
            onClick={() => onSelect(item.id)}
          >
            {/* Номер считается по месту в списке: руками он нигде
                не записан и не разъедется при правке содержания. */}
            <span className="contents-item__no" aria-hidden="true">
              {item.skoro ? <ZamokIkonka /> : (item.nomer ?? index + 1)}
            </span>
            <span className="contents-item__title">
              <TitleText title={item.title} html={item.titleHtml} />
              {item.skoro ? <span className="sr-only"> (скоро)</span> : null}
            </span>
          </button>
          {(podpunktyVsegda || item.id === active) &&
          item.podpunkty !== undefined &&
          onSelectPodpunkt !== undefined ? (
            <ul className="contents-sub">
              {item.podpunkty.map((sub) => (
                <li key={sub.id}>
                  <button
                    type="button"
                    className="contents-sub__item"
                    onClick={() => onSelectPodpunkt(sub.id)}
                  >
                    <TitleText title={sub.title} html={sub.titleHtml} />
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
