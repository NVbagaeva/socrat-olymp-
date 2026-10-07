'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useId, useMemo, useState, useSyncExternalStore } from 'react';
import { TaskGrid } from '@/components/tasks';
import { HandNote } from '@/components/ui';
import type { ExamTask, TaskPart } from '@/content/tasks';
import { partRange, taskParts, tasks, tasksPage } from '@/content/tasks';

import { assetUrl } from '@/lib/assetUrl';
/** Номер без ведущего нуля: чтобы «7» находило задание «07». */
function matches(query: string, no: string, name: string): boolean {
  const q = query.trim().toLowerCase();
  if (q === '') {
    return true;
  }
  return (
    name.toLowerCase().includes(q) ||
    no.includes(q) ||
    no.replace(/^0+/, '').startsWith(q.replace(/^0+/, ''))
  );
}

/** «13 заданий», «1 задание», «2 задания». */
function countLabel(n: number): string {
  const mod10 = n % 10;
  const mod100 = n % 100;
  const word =
    mod10 === 1 && mod100 !== 11
      ? 'задание'
      : mod10 >= 2 && mod10 <= 4 && (mod100 < 12 || mod100 > 14)
        ? 'задания'
        : 'заданий';
  return `${n} ${word}`;
}

/** Часть из адреса: ?part=2 — вторая, всё остальное — первая. */
function partFromUrl(): TaskPart {
  return new URLSearchParams(window.location.search).get('part') === '2' ? 2 : 1;
}

/* replaceState событий не шлёт: о смене части сообщаем своим. */
const PART_EVENT = 'bank-part-change';

function subscribePart(onChange: () => void): () => void {
  window.addEventListener('popstate', onChange);
  window.addEventListener(PART_EVENT, onChange);
  return () => {
    window.removeEventListener('popstate', onChange);
    window.removeEventListener(PART_EVENT, onChange);
  };
}

function choosePart(next: TaskPart) {
  const url = new URL(window.location.href);
  if (next === 1) {
    url.searchParams.delete('part');
  } else {
    url.searchParams.set('part', String(next));
  }
  window.history.replaceState(window.history.state, '', url);
  window.dispatchEvent(new Event(PART_EVENT));
}

export interface TaskBankProps {
  /** Задание, которое открывается окном выбора подтемы. */
  dialogSlug: string;
  /** Открыть окно. Второй аргумент — карточка, от неё считается место. */
  onOpenDialog: (task: ExamTask, card: HTMLElement) => void;
}

export function TaskBank({ dialogSlug, onOpenDialog }: TaskBankProps) {
  const [query, setQuery] = useState('');
  const searchId = useId();
  /* Открытая часть живёт в адресе (?part=2), чтобы ссылка открывала
     нужную. Страница собрана статически: на сборке параметра нет,
     поэтому в готовом HTML первая часть, а адрес читается сразу после
     загрузки. useSearchParams здесь не годится — он требует границы
     ожидания, и сетка не попала бы в готовый HTML. */
  const part = useSyncExternalStore<TaskPart>(subscribePart, partFromUrl, () => 1);

  /* Поиск идёт по обеим частям: пока строка не пуста, сетка
     показывает найденное во всём банке. */
  const searching = query.trim() !== '';
  const shown = useMemo(
    () =>
      searching
        ? tasks.filter((t) => matches(query, t.no, t.name))
        : tasks.filter((t) => t.part === part),
    [query, searching, part],
  );
  const current = taskParts.find((item) => item.part === part) ?? taskParts[0];

  return (
    <main className="app-main">
      <header className="bank-head">
        <div className="bank-head__text">
          <p className="bank-head__eyebrow">{tasksPage.eyebrow}</p>
          <h1 className="t-h1 bank-head__title">{tasksPage.title}</h1>
          <p className="bank-head__lead">{tasksPage.lead}</p>
        </div>

        {/* Баннер: портрет и цитата. Декор, поэтому alt пустой —
            содержания, которого нет в тексте рядом, он не несёт. */}
        <figure className="bank-quote">
          <figcaption className="bank-quote__text">
            <HandNote>«{tasksPage.quote.text}»</HandNote>
            <span className="bank-quote__author">— {tasksPage.quote.author}</span>
          </figcaption>
          <Image
            className="bank-quote__art"
            src={assetUrl('/images/bust-galileo.webp')}
            alt=""
            width={814}
            height={700}
          />
        </figure>
      </header>

      {/* Строка фильтров. Рядом с поиском встанет выбор темы, когда
          в конфиге появится признак, по которому фильтровать. */}
      <div className="bank-filters">
        <div className="bank-search">
          <label className="sr-only" htmlFor={searchId}>
            Поиск по заданиям
          </label>
          <svg
            className="bank-search__icon"
            viewBox="0 0 24 24"
            aria-hidden="true"
            focusable="false"
          >
            <circle cx="11" cy="11" r="7" />
            <path d="M16.5 16.5 L 21 21" />
          </svg>
          <input
            id={searchId}
            className="input bank-search__input"
            type="search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Поиск по заданиям…"
            autoComplete="off"
          />
        </div>
      </div>

      {/* Переключатель частей. Сегменты — ссылки: часть можно открыть
          в новой вкладке, а без скрипта они просто перезагрузят страницу
          с нужным ?part. */}
      <nav className="part-switch" aria-label="Части экзамена">
        {taskParts.map((item) => {
          const active = !searching && item.part === part;
          return (
            <a
              key={item.part}
              className={active ? 'part-switch__seg is-active' : 'part-switch__seg'}
              href={item.part === 1 ? `${tasksPage.href}/` : `${tasksPage.href}/?part=${item.part}`}
              aria-current={active ? 'true' : undefined}
              onClick={(event) => {
                if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) {
                  return;
                }
                event.preventDefault();
                setQuery('');
                choosePart(item.part);
              }}
            >
              <span className="part-switch__range">{partRange(item.part)}</span>
              <span className="part-switch__text">
                <span className="part-switch__title">{item.title}</span>
                <span className="part-switch__caption">{item.caption}</span>
              </span>
            </a>
          );
        })}
      </nav>

      <div className="bank-part-head">
        <h2 className="t-h4 bank-part-head__title">
          {searching ? 'Результаты поиска' : `${current.title} · ${current.heading}`}
        </h2>
        <span className="bank-part-head__count">{countLabel(shown.length)}</span>
      </div>

      {shown.length === 0 ? (
        <p className="bank-empty">Ничего не найдено</p>
      ) : (
        <TaskGrid tasks={shown} openInDialog={{ slug: dialogSlug, onOpen: onOpenDialog }} />
      )}

      <section className="bank-start">
        <div className="bank-start__plate">
          {/* Книга и пирамида — декор: alt пустой, рядом свой текст. */}
          <Image
            className="bank-start__book"
            src={assetUrl('/images/open-book.webp')}
            alt=""
            width={700}
            height={445}
          />
          <div className="bank-start__text">
            <h2 className="t-h4">{tasksPage.start.title}</h2>
            <p className="bank-start__lead">{tasksPage.start.lead}</p>
          </div>
          <Link className="btn btn--primary bank-start__cta" href={tasksPage.start.href}>
            {tasksPage.start.action}
            <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
              <path d="M5 12h13M12 6l6 6-6 6" />
            </svg>
          </Link>
        </div>

        <div className="bank-start__decor" aria-hidden="true">
          <Image
            className="bank-start__pyramid"
            src={assetUrl('/images/pyramid-network.webp')}
            alt=""
            width={1400}
            height={504}
          />
          <HandNote className="bank-start__note">{tasksPage.start.note}</HandNote>
        </div>
      </section>
    </main>
  );
}
