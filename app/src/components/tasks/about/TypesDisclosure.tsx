'use client';

import { useSyncExternalStore, type ReactNode } from 'react';
import { clsx } from 'clsx';

export interface TypeItem {
  /** Якорь плашки: …/#abscissa-line. */
  id: string;
  /** Название типа обычным текстом — для подписей кнопок. */
  label: string;
  /** Содержимое плашки: номер, значок, название, миниатюра. */
  card: ReactNode;
  /** Разбор: примеры, собранные на сервере. */
  examples: ReactNode;
  /** «Потренироваться»: тренажёр этого типа. */
  practiceHref: string;
}

export interface TypesDisclosureProps {
  items: TypeItem[];
  /** Заголовок блока: к нему возвращает «К типам задач». */
  headingId: string;
  words: { back: string; practice: string; open: string; close: string };
}

/* Открытый разбор — это якорь адреса: ссылку …/#abscissa-line можно
   дать ученику, и разбор откроется сразу. Своего состояния у блока
   нет — он читает адрес как внешний источник. */
const HASH_EVENT = 'hashchange';

function subscribe(listener: () => void): () => void {
  window.addEventListener(HASH_EVENT, listener);
  return () => window.removeEventListener(HASH_EVENT, listener);
}

function readHash(): string {
  return decodeURIComponent(window.location.hash.slice(1));
}

/** Сменить якорь без прыжка страницы и без записи в историю. */
function setHash(id: string | null) {
  const { pathname, search } = window.location;
  window.history.replaceState(window.history.state, '', id === null ? pathname + search : `#${id}`);
  window.dispatchEvent(new Event(HASH_EVENT));
}

/**
 * Плашки типов задач с разбором под каждой. Плашка — кнопка: по клику
 * под ней раскрывается разбор (на широком экране — во всю ширину под
 * её рядом, на узком — сразу под ней). Внизу разбора — «К типам
 * задач» и «Потренироваться».
 *
 * Разборы есть в разметке страницы целиком, закрытые — с hidden:
 * они собраны на сервере вместе с формулами и рисунками.
 */
export function TypesDisclosure({ items, headingId, words }: TypesDisclosureProps) {
  const hash = useSyncExternalStore(subscribe, readHash, () => '');
  const open = items.some((item) => item.id === hash) ? hash : null;

  function toggle(id: string) {
    setHash(open === id ? null : id);
  }

  function back() {
    setHash(null);
    document.getElementById(headingId)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  return (
    <ul className="about-forms__list about-types__list">
      {items.map((item) => {
        const isOpen = open === item.id;
        const panelId = `${item.id}-razbor`;
        return [
          <li
            key={item.id}
            id={item.id}
            className={clsx('form-card form-card--chart about-type', isOpen && 'is-open')}
          >
            <button
              type="button"
              className="about-type__button"
              aria-expanded={isOpen}
              aria-controls={panelId}
              aria-label={`${isOpen ? words.close : words.open}: ${item.label}`}
              onClick={() => toggle(item.id)}
            />
            {item.card}
          </li>,
          <li
            key={panelId}
            id={panelId}
            className="about-type__panel"
            hidden={!isOpen}
            aria-label={item.label}
          >
            <div className="about-type__examples">{item.examples}</div>
            <div className="about-type__foot">
              <button type="button" className="btn btn--secondary" onClick={back}>
                {words.back}
              </button>
              <a className="btn btn--primary" href={item.practiceHref}>
                {words.practice}
              </a>
            </div>
          </li>,
        ];
      })}
    </ul>
  );
}
