'use client';

import { useEffect, useRef, useSyncExternalStore, type CSSProperties, type ReactNode } from 'react';
import { clsx } from 'clsx';

export interface TipKartochka {
  /** Якорь адреса: …/zadaniya/2/#dlina — разбор открывается сразу. */
  id: string;
  /** Название обычным текстом — для подписи кнопки. */
  label: string;
  wide: boolean;
  /** Содержимое карточки: миниатюра, номер, название, «что найти». */
  card: ReactNode;
  /** Разобранный пример: собран на сервере, формулы и рисунок — готовая разметка. */
  panel: ReactNode;
}

export interface TipGruppa {
  id: string;
  head: ReactNode;
  items: TipKartochka[];
}

export interface TipyRaskrytieProps {
  gruppy: TipGruppa[];
  words: { open: string; close: string; back: string };
  /** Заголовок блока: к нему возвращает «К типам задач». */
  headingId: string;
}

/* Открытый разбор — якорь адреса: ссылку можно дать ученику. Своего
   состояния у блока нет, он читает адрес как внешний источник — так же,
   как TypesDisclosure у №12. */
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

function reducedMotion(): boolean {
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

/**
 * Карточки типов задач с разбором под каждой.
 *
 * Разбор раскрывается в потоке страницы, а не в модальном окне: на
 * телефоне решение с рисунком длиннее экрана, и в окне вышла бы
 * прокрутка внутри прокрутки, а «Назад» браузера закрывало бы страницу,
 * а не окно. Под карточкой разбор встаёт во всю ширину ряда (плотная
 * укладка сетки подтягивает соседей), на узком экране — сразу под ней.
 * Esc закрывает разбор и возвращает фокус на карточку.
 */
export function TipyRaskrytie({ gruppy, words, headingId }: TipyRaskrytieProps) {
  const hash = useSyncExternalStore(subscribe, readHash, () => '');
  const all = gruppy.flatMap((g) => g.items);
  const open = all.find((item) => item.id === hash) ?? null;
  const prev = useRef<string | null>(null);

  /* Только что открытый разбор подводим в видимую часть, если он ушёл
     ниже сгиба: на телефоне он начинается под карточкой. */
  useEffect(() => {
    if (open === null || prev.current === open.id) {
      prev.current = open?.id ?? null;
      return;
    }
    prev.current = open.id;
    const panel = document.getElementById(`${open.id}-razbor`);
    if (panel === null) return;
    const top = panel.getBoundingClientRect().top;
    if (top > window.innerHeight * 0.7 || top < 0) {
      panel.scrollIntoView({ behavior: reducedMotion() ? 'auto' : 'smooth', block: 'start' });
    }
  }, [open]);

  function toggle(id: string) {
    setHash(open?.id === id ? null : id);
  }

  function close(id: string, toHeading: boolean) {
    setHash(null);
    if (toHeading) {
      document
        .getElementById(headingId)
        ?.scrollIntoView({ behavior: reducedMotion() ? 'auto' : 'smooth', block: 'start' });
    }
    document.getElementById(`${id}-btn`)?.focus({ preventScroll: toHeading });
  }

  return (
    <>
      {gruppy.map((gruppa) => (
        <section className="z2t-gruppa" key={gruppa.id} aria-labelledby={`z2t-${gruppa.id}`}>
          {gruppa.head}
          <ul className="z2t-list" data-count={gruppa.items.length}>
            {gruppa.items.flatMap((item, i) => {
              const isOpen = open?.id === item.id;
              const panelId = `${item.id}-razbor`;
              return [
                <li
                  key={item.id}
                  id={item.id}
                  className={clsx('z2t-card', item.wide && 'z2t-card--wide', isOpen && 'is-open')}
                  data-reveal=""
                  style={{ '--i': i } as CSSProperties}
                >
                  <button
                    type="button"
                    id={`${item.id}-btn`}
                    className="z2t-card__btn"
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
                  className="z2t-panel"
                  hidden={!isOpen}
                  aria-label={item.label}
                  onKeyDown={(event) => {
                    if (event.key === 'Escape') {
                      event.stopPropagation();
                      close(item.id, false);
                    }
                  }}
                >
                  {item.panel}
                  <div className="z2t-panel__back">
                    <button
                      type="button"
                      className="z2-btn z2-btn--ghost"
                      onClick={() => close(item.id, true)}
                    >
                      <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
                        <path d="m6 15 6-6 6 6" />
                      </svg>
                      {words.back}
                    </button>
                  </div>
                </li>,
              ];
            })}
          </ul>
        </section>
      ))}
    </>
  );
}
