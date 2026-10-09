'use client';

import { useId, useState, type ReactNode } from 'react';

/**
 * Сворачиваемая врезка теории: заголовок и кнопка «Свернуть» /
 * «Развернуть». Содержимое собрано на сервере и приходит готовым —
 * здесь только состояние «открыто». По умолчанию врезка открыта:
 * без скрипта ученик видит всё.
 */
export function Collapse({
  title,
  tag,
  children,
}: {
  title: ReactNode;
  tag?: ReactNode;
  children: ReactNode;
}) {
  const [open, setOpen] = useState(true);
  const body = useId();
  return (
    <section className={open ? 'rich-collapse is-open' : 'rich-collapse'}>
      <header className="rich-collapse__head">
        <h4 className="rich-collapse__title">{title}</h4>
        {tag === undefined ? null : <span className="rich-collapse__tag">{tag}</span>}
        <button
          type="button"
          className="rich-collapse__toggle"
          aria-expanded={open}
          aria-controls={body}
          onClick={() => setOpen(!open)}
        >
          {open ? 'Свернуть' : 'Развернуть'}
          <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
            <path d="m6 15 6-6 6 6" />
          </svg>
        </button>
      </header>
      <div className="rich-collapse__body" id={body} hidden={!open}>
        {children}
      </div>
    </section>
  );
}
