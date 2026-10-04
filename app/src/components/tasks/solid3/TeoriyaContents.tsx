'use client';

import { useState, type ReactNode } from 'react';
import { clsx } from 'clsx';
import { Modal } from '@/components/ui';
import { scrollToSection, useActiveSection } from '@/components/tasks/useActiveSection';

export interface TeoriyaContentsItem {
  id: string;
  title: string;
}

export interface TeoriyaContentsProps {
  items: TeoriyaContentsItem[];
  /** Приставка якоря раздела: якорь — приставка + id. */
  prefix: string;
  /** Подпись под списком в правой колонке («Готово 1 из 6 разделов»). */
  footer?: ReactNode;
  /** Сами разделы — набраны на сервере. */
  children: ReactNode;
}

/**
 * Содержание теории задания №3: правая колонка на широком экране,
 * липкая полоса со шторкой — на узком. Полоса, шторка и подсветка
 * те же, что у №12 и №4–5 (.topic-open, .contents-sheet,
 * useActiveSection); разделы приходят готовыми с сервера.
 *
 * Пункты — ссылки на якоря: без сценариев переход тоже работает, а
 * адрес раздела можно отправить.
 */
export function TeoriyaContents({ items, prefix, footer, children }: TeoriyaContentsProps) {
  const [active, setActive] = useState(items[0]?.id ?? '');
  const [sheet, setSheet] = useState(false);
  const domId = (id: string) => `${prefix}${id}`;

  const pin = useActiveSection(
    items.map((item) => item.id),
    domId,
    true,
    setActive,
  );

  function go(event: React.MouseEvent, id: string) {
    const node = document.getElementById(domId(id));
    if (node === null) {
      return;
    }
    event.preventDefault();
    setActive(id);
    pin();
    setSheet(false);
    /* Шторка закрывается той же отрисовкой: прокрутка идёт следующим
       кадром, когда блокировка прокрутки уже снята. */
    requestAnimationFrame(() => {
      scrollToSection(node);
      history.replaceState(null, '', `#${domId(id)}`);
    });
  }

  const list = (
    <ol className="contents-list">
      {items.map((item, index) => (
        <li key={item.id}>
          <a
            className={clsx('contents-item', item.id === active && 'is-active')}
            href={`#${domId(item.id)}`}
            aria-current={item.id === active ? 'true' : undefined}
            onClick={(event) => go(event, item.id)}
          >
            <span className="contents-item__no" aria-hidden="true">
              {index + 1}
            </span>
            <span className="contents-item__title">{item.title}</span>
          </a>
        </li>
      ))}
    </ol>
  );
  const current = items.find((item) => item.id === active);

  return (
    <>
      {/* Полоса стоит над сеткой, а не в ней: в ячейке ростом с саму
          кнопку липкости негде было бы работать. */}
      <div className="topic-open">
        <button
          type="button"
          className="btn btn--secondary btn--sm topic-open__btn"
          onClick={() => setSheet(true)}
        >
          <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
            <path d="M4 7h16M4 12h16M4 17h10" />
          </svg>
          Содержание
        </button>
        {current === undefined ? null : <span className="topic-open__now">{current.title}</span>}
      </div>

      <div className="teoriya">
        <aside className="teoriya__side" aria-label="Содержание темы">
          <p className="teoriya__side-title">Содержание темы</p>
          {list}
          {footer}
        </aside>
        {children}
      </div>

      <Modal
        open={sheet}
        onClose={() => setSheet(false)}
        className="contents-sheet"
        closeLabel="Закрыть содержание"
        title="Содержание"
        description="Выберите раздел темы"
      >
        {list}
      </Modal>
    </>
  );
}
