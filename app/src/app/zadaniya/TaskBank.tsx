'use client';

import { useId, useMemo, useState } from 'react';
import { TaskCard } from '@/components/ui';
import { tasks, tasksPage } from '@/content/tasks';
import { IllustrationDefs, TaskIllustration } from './illustrations';

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

export function TaskBank() {
  const [query, setQuery] = useState('');
  const searchId = useId();

  const shown = useMemo(() => tasks.filter((t) => matches(query, t.no, t.name)), [query]);

  return (
    <main className="app-main">
      <IllustrationDefs />

      <header className="bank-head">
        <div className="bank-head__text">
          <p className="bank-head__eyebrow">{tasksPage.eyebrow}</p>
          <h1 className="t-h1 bank-head__title">{tasksPage.title}</h1>
          <p className="bank-head__lead">{tasksPage.lead}</p>
        </div>

        <div className="bank-search">
          <label className="sr-only" htmlFor={searchId}>
            Поиск по заданиям
          </label>
          <svg className="bank-search__icon" viewBox="0 0 24 24" aria-hidden="true" focusable="false">
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
      </header>

      {shown.length === 0 ? (
        <p className="bank-empty">Ничего не найдено</p>
      ) : (
        <ul className="tasks-grid">
          {shown.map((task) => (
            <li key={task.no}>
              <TaskCard
                className="task-card--bank"
                number={task.no}
                title={task.name}
                href={task.status === 'active' ? `${tasksPage.href}/${task.slug}` : undefined}
                comingSoon={task.status !== 'active'}
                difficulty={task.badge}
                difficultyTone="info"
                illustration={<TaskIllustration slug={task.slug} />}
              />
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}
