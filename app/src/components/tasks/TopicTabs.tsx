'use client';

import Link from 'next/link';
import { useCallback, useEffect, useRef, useState } from 'react';
import type { ReactNode } from 'react';
import { EmptyState, Modal, Tabs } from '@/components/ui';
import type { TheoryBlock } from '@/content/sections';
import { TopicContents } from './TopicContents';

export interface TopicTabsProps {
  /** Вкладка «О задании» целиком: собрана на сервере. */
  about: ReactNode;
  /** Разделы теории: они же пункты содержания. */
  theory: TheoryBlock[];
  /** Экран подготовительных задач: собран на сервере. */
  prep: ReactNode;
  /** Адрес страницы «Для репетиторов». */
  tutorsHref: string;
  /** Декор под содержанием: на узком экране не показывается. */
  contentsDecor: ReactNode;
  /** Свёрстанные разделы теории по ключу body из конфига. */
  bodies: Record<string, ReactNode>;
}

/** Идентификатор блока теории в разметке: по нему работают якоря. */
function blockId(id: string): string {
  return `theory-${id}`;
}

/** Плавность прокрутки: при «уменьшить движение» переходы мгновенные. */
function motion(): ScrollBehavior {
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth';
}

/* Ширина растушёвки по краям ленты вкладок. То же число стоит в
   topic.css у background-size: под растушёвкой вкладка читалась бы
   наполовину выцветшей, поэтому подводим её с этим отступом. */
const TABS_FADE = 32;

const TABS = [
  { id: 'about', label: 'О задании' },
  { id: 'theory', label: 'Теория' },
  { id: 'prep', label: 'Подготовительные задачи' },
  { id: 'trainer', label: 'Тренажёр' },
  { id: 'generator', label: 'Генератор' },
];

/**
 * Вкладки страницы темы и содержание к ним.
 *
 * «Для репетиторов» стоит в той же ленте, но это ссылка на отдельную
 * страницу, а не вкладка: она лежит рядом с набором вкладок, а не
 * внутри него — иначе клавиатурный обход по стрелкам обещал бы
 * переключение содержимого, которого не происходит.
 *
 * Содержание темы на широком экране — правая колонка, ниже 1024px —
 * кнопка и шторка. Список в обоих случаях один и тот же.
 */
export function TopicTabs({
  about,
  theory,
  prep,
  tutorsHref,
  contentsDecor,
  bodies,
}: TopicTabsProps) {
  const [tab, setTab] = useState('about');
  /* Раздел, на котором стоит страница: сначала первый, дальше тот,
     что виден на экране. */
  const [block, setBlock] = useState(theory[0]?.id ?? '');
  const [sheet, setSheet] = useState(false);
  /* Лента вкладок прокручивается вбок: нужен сам узел, чтобы подводить
     к активной вкладке. */
  const strip = useRef<HTMLDivElement>(null);

  const current = theory.find((item) => item.id === block) ?? theory[0];
  const items = theory.map((item) => ({ id: item.id, title: item.title }));

  /* Переход к разделу. Узла может не быть — тогда просто ничего не
     происходит, без ошибки в консоли. */
  const scrollToBlock = useCallback((id: string) => {
    const node = document.getElementById(blockId(id));
    if (node === null) {
      return;
    }
    node.scrollIntoView({ behavior: motion(), block: 'start' });
  }, []);

  function pick(id: string) {
    setBlock(id);
    setSheet(false);
    /* Шторка закрывается той же отрисовкой: прокрутка идёт следующим
       кадром, когда блокировка прокрутки уже снята. */
    requestAnimationFrame(() => scrollToBlock(id));
  }

  /* Активная вкладка не должна оставаться за кромкой ленты. Сдвиг
     считается по самой ленте, а не через scrollIntoView: тот утянул бы
     за собой и страницу по вертикали. */
  useEffect(() => {
    const node = strip.current;
    if (node === null) {
      return;
    }
    const item = node.querySelector<HTMLElement>('[role="tab"][aria-selected="true"]');
    if (item === null) {
      return;
    }

    const box = node.getBoundingClientRect();
    const rect = item.getBoundingClientRect();
    let shift = 0;
    if (rect.left < box.left + TABS_FADE) {
      shift = rect.left - box.left - TABS_FADE;
    } else if (rect.right > box.right - TABS_FADE) {
      shift = rect.right - box.right + TABS_FADE;
    }
    if (shift !== 0) {
      node.scrollBy({ left: shift, behavior: motion() });
    }
  }, [tab]);

  /* Подсветка в содержании следует за экраном. Наблюдатель видимости
     дешевле обработчика прокрутки: браузер считает пересечения сам. */
  useEffect(() => {
    if (tab !== 'theory' || typeof IntersectionObserver === 'undefined') {
      return undefined;
    }

    const nodes = theory
      .map((item) => document.getElementById(blockId(item.id)))
      .filter((node): node is HTMLElement => node !== null);
    if (nodes.length === 0) {
      return undefined;
    }

    const visible = new Set<string>();
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            visible.add(entry.target.id);
          } else {
            visible.delete(entry.target.id);
          }
        });
        /* Активным считается верхний из видимых: так подсветка не
           прыгает, когда в полосе видно два раздела сразу. */
        const top = theory.find((item) => visible.has(blockId(item.id)));
        if (top !== undefined) {
          setBlock(top.id);
        }
      },
      /* Полоса наблюдения — верхняя треть экрана: раздел становится
         активным, когда его заголовок доходит до неё. */
      { rootMargin: '-72px 0px -66% 0px' },
    );

    nodes.forEach((node) => observer.observe(node));
    return () => observer.disconnect();
  }, [tab, theory]);

  return (
    <>
      {/* Лента вкладок: ниже 1024px она прокручивается вбок, тени по
          краям показывают, что прокручивать есть куда. */}
      <div className="topic-tabs" ref={strip}>
        <Tabs items={TABS} value={tab} onValueChange={setTab} label="Разделы темы" />
        <Link className="topic-tabs__link" href={tutorsHref}>
          Для репетиторов
        </Link>
      </div>

      <div className={tab === 'theory' ? 'topic-body topic-body--theory' : 'topic-body'}>
        <div className="topic-panel">
          {tab === 'about' ? about : null}

          {tab === 'theory' ? (
            <>
              {/* Кнопка появляется только здесь: на других вкладках
                  содержание ни к чему. Ниже 1024px она заменяет
                  правую колонку, выше — скрыта разметкой. */}
              <div className="topic-open">
                <button
                  type="button"
                  className="btn btn--secondary topic-open__btn"
                  onClick={() => setSheet(true)}
                >
                  <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
                    <path d="M4 7h16M4 12h16M4 17h10" />
                  </svg>
                  Содержание
                </button>
                {current !== undefined ? (
                  <span className="topic-open__now">{current.title}</span>
                ) : null}
              </div>

              {theory.length === 0 ? (
                <EmptyState
                  title="Материал готовится"
                  description="Разделы теории этого типа функции ещё не собраны."
                />
              ) : (
                <div className="theory">
                  {theory.map((item) => (
                    <article className="theory-block" id={blockId(item.id)} key={item.id}>
                      <h3 className="t-h3 theory-block__title">
                        {/* Кружок — часть содержимого раздела, со списком
                            содержания его нумерация не связана. */}
                        {item.badge !== undefined ? (
                          <span className="theory-block__no" aria-hidden="true">
                            {item.badge}
                          </span>
                        ) : null}
                        {item.title}
                      </h3>
                      {item.body !== undefined && bodies[item.body] !== undefined ? (
                        bodies[item.body]
                      ) : item.content === null ? (
                        /* Ненаписанных разделов подряд тринадцать: каждому
                           по большому пустому экрану — это стена из
                           одинаковых картинок. Здесь довольно строки. */
                        <p className="theory-block__soon">Материал готовится</p>
                      ) : (
                        <p className="theory-block__text">{item.content}</p>
                      )}
                    </article>
                  ))}
                </div>
              )}
            </>
          ) : null}

          {tab === 'prep' ? prep : null}

          {tab === 'trainer' ? (
            <EmptyState
              title="Тренажёр готовится"
              description="Задания собирает движок graph/, но экрана решения в кабинете пока нет."
            />
          ) : null}

          {tab === 'generator' ? (
            <EmptyState
              title="Генератор готовится"
              description="Раздел появится, когда будет решено, что именно он настраивает."
            />
          ) : null}
        </div>

        {/* Правая колонка: только на вкладке теории и только от 1024px —
            ниже её прячет разметка, а список открывает шторка. */}
        {tab === 'theory' ? (
          <aside className="topic-side" aria-label="Содержание темы">
            <h3 className="topic-side__title">Содержание</h3>
            <TopicContents items={items} active={block} onSelect={pick} />
            {contentsDecor}
          </aside>
        ) : null}
      </div>

      {/* Шторка: то же окно, что и на выборе типа функции. Своего
          компонента для неё в проекте нет и не заводится. */}
      <Modal
        open={sheet}
        onClose={() => setSheet(false)}
        className="contents-sheet"
        closeLabel="Закрыть содержание"
        title="Содержание"
        description="Выберите раздел темы"
      >
        <TopicContents items={items} active={block} onSelect={pick} />
      </Modal>
    </>
  );
}
