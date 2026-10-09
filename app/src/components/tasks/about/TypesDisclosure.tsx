'use client';

import { useEffect, useState, useSyncExternalStore, type ReactNode } from 'react';
import { clsx } from 'clsx';

export interface TypeItem {
  /** Якорь плашки: …/#abscissa-line. */
  id: string;
  /** Название типа обычным текстом — для подписей кнопок. */
  label: string;
  /** Содержимое плашки: номер, значок, название, миниатюра. */
  card: ReactNode;
  /** Страница разбора: из неё под плашку вставляется блок примеров. */
  href: string;
  /** «Потренироваться»: тренажёр этого типа. */
  practiceHref: string;
}

export interface TypesDisclosureProps {
  items: TypeItem[];
  /** Заголовок блока: к нему возвращает «К типам задач». */
  headingId: string;
  /** Метка блока примеров на странице разбора. */
  attr: string;
  words: {
    back: string;
    practice: string;
    open: string;
    close: string;
    loading: string;
    failed: string;
    page: string;
  };
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

/** Разбор: разметка блока примеров со страницы разбора или ошибка. */
type Loaded = { html: string } | { failed: true };

async function loadAnalysis(href: string, attr: string, id: string): Promise<Loaded> {
  try {
    const response = await fetch(href);
    if (!response.ok) {
      return { failed: true };
    }
    const page = new DOMParser().parseFromString(await response.text(), 'text/html');
    const block = page.querySelector(`[${attr}="${id}"]`);
    return block === null ? { failed: true } : { html: block.innerHTML };
  } catch {
    return { failed: true };
  }
}

/**
 * Плашки типов задач с разбором под каждой. Плашка — кнопка: по клику
 * под ней раскрывается разбор (на широком экране — во всю ширину под
 * её рядом, на узком — сразу под ней). Внизу разбора — «К типам
 * задач» и «Потренироваться».
 *
 * Сами разборы — восемь примеров с формулами и рисунками — в разметку
 * страницы темы не входят: она и так тяжёлая, а открывают их не все.
 * Каждый разбор — отдельная статическая страница, собранная на
 * сервере; при открытии плашки блок примеров берётся из неё готовой
 * разметкой. Без скриптов плашка — обычная ссылка на эту страницу.
 */
export function TypesDisclosure({ items, headingId, attr, words }: TypesDisclosureProps) {
  const hash = useSyncExternalStore(subscribe, readHash, () => '');
  const open = items.find((item) => item.id === hash) ?? null;
  /* Загруженные разборы: повторное открытие плашки не ходит в сеть. */
  const [loaded, setLoaded] = useState<Record<string, Loaded>>({});

  useEffect(() => {
    if (open === null || loaded[open.id] !== undefined) {
      return;
    }
    let alive = true;
    void loadAnalysis(open.href, attr, open.id).then((result) => {
      if (alive) {
        setLoaded((prev) => ({ ...prev, [open.id]: result }));
        /* Заход по ссылке с якорем: разбор появился позже прокрутки
           браузера — подводим к плашке ещё раз. */
        document.getElementById(open.id)?.scrollIntoView({ block: 'start' });
      }
    });
    return () => {
      alive = false;
    };
  }, [open, loaded, attr]);

  function toggle(id: string) {
    setHash(open?.id === id ? null : id);
  }

  function back() {
    setHash(null);
    document.getElementById(headingId)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  return (
    <ul className="about-forms__list about-types__list">
      {items.map((item) => {
        const isOpen = open?.id === item.id;
        const panelId = `${item.id}-razbor`;
        const state = loaded[item.id];
        return [
          <li
            key={item.id}
            id={item.id}
            className={clsx('form-card form-card--chart about-type', isOpen && 'is-open')}
          >
            <a
              className="about-type__button"
              href={item.href}
              role="button"
              aria-expanded={isOpen}
              aria-controls={panelId}
              aria-label={`${isOpen ? words.close : words.open}: ${item.label}`}
              onClick={(event) => {
                event.preventDefault();
                toggle(item.id);
              }}
            />
            {item.card}
          </li>,
          <li
            key={panelId}
            id={panelId}
            className="about-type__panel"
            hidden={!isOpen}
            aria-label={item.label}
            aria-busy={isOpen && state === undefined}
          >
            {state === undefined ? (
              isOpen ? (
                <p className="about-type__status">{words.loading}</p>
              ) : null
            ) : 'failed' in state ? (
              <p className="about-type__status">
                {words.failed} <a href={item.href}>{words.page}</a>
              </p>
            ) : (
              <div
                className="about-type__examples"
                /* Разметка со своей же статической страницы, собранной
                   на сервере из content/quadraticTypes.ts. */
                dangerouslySetInnerHTML={{ __html: state.html }}
              />
            )}
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
