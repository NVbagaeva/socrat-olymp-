'use client';

import Link from 'next/link';
import { useState } from 'react';
import type { ReactNode } from 'react';
import { clsx } from 'clsx';
import { ProgressBar, ProgressRing } from '@/components/ui';
import { prepPage } from '@/content/prepSkills';
import type { PrepSkillId } from '@/content/prepSkills';
import { TaskCountIcon } from './PrepIcons';

export interface PrepSkillItem {
  id: PrepSkillId;
  no: string;
  title: string;
  lead: string;
  total: number;
  solved: number;
  percent: number;
  /** Адрес тренажёра навыка. */
  href: string;
  /** Миниатюра чертежа: её собирает движок на сервере. */
  chart: ReactNode;
}

export interface PrepSkillsScreenProps {
  items: PrepSkillItem[];
  solved: number;
  total: number;
  percent: number;
}

/**
 * Экран списка навыков подготовительных задач.
 *
 * Один и тот же экран стоит вкладкой на странице темы и отдельной
 * страницей /podgotovka/: второй разметки для него в проекте нет.
 *
 * Клиентский он только из-за фильтра по навыкам — всё остальное
 * приходит готовым с сервера.
 */
export function PrepSkillsScreen({ items, solved, total, percent }: PrepSkillsScreenProps) {
  const [filter, setFilter] = useState<PrepSkillId | 'all'>('all');
  const shown = filter === 'all' ? items : items.filter((item) => item.id === filter);
  const counter = `${solved} из ${total} заданий`;

  return (
    <section className="prep">
      <header className="prep__head">
        <div className="prep__intro">
          <h2 className="t-h2 prep__title">{prepPage.title}</h2>
          <p className="prep__lead">{prepPage.lead}</p>
        </div>
        <div className="prep__progress">
          <ProgressRing value={percent} label="заданий" srLabel={counter} />
          <p className="prep__counter">
            <b>{solved}</b> из {total} заданий
          </p>
        </div>
      </header>

      {/* Лента чипов: ниже 1024px прокручивается вбок, тень у правого
          края показывает, что прокручивать есть куда. */}
      <div className="prep__chips" role="group" aria-label="Фильтр по навыкам">
        <button
          type="button"
          className={clsx('chip', filter === 'all' && 'is-active')}
          aria-pressed={filter === 'all'}
          onClick={() => setFilter('all')}
        >
          {prepPage.allLabel}
        </button>
        {items.map((item) => (
          <button
            key={item.id}
            type="button"
            className={clsx('chip', filter === item.id && 'is-active')}
            aria-pressed={filter === item.id}
            onClick={() => setFilter(item.id)}
          >
            {item.title}
          </button>
        ))}
      </div>

      <ul className="prep__grid">
        {shown.map((item) => (
          <li key={item.id}>
            {/* Кликабельна вся карточка: «Начать» внутри — часть ссылки,
                а не вторая кнопка, иначе фокус ловил бы её отдельно. */}
            <Link className="prep-card" href={item.href}>
              <span className="prep-card__top">
                <span className="prep-card__no" aria-hidden="true">
                  {item.no}
                </span>
                <span className="prep-card__text">
                  <span className="prep-card__title">{item.title}</span>
                  <span className="prep-card__lead">{item.lead}</span>
                </span>
                <span className="prep-card__chart">{item.chart}</span>
              </span>

              <span className="prep-card__count">
                <TaskCountIcon />
                {item.total} заданий
              </span>

              <span className="prep-card__bottom">
                <span className="prep-card__meter">
                  <ProgressBar value={item.percent} label={`${item.title}: решено задач`} />
                  <span className="prep-card__done">
                    {item.solved} из {item.total}
                  </span>
                </span>
                <span className="prep-card__start">Начать →</span>
              </span>
            </Link>
          </li>
        ))}
      </ul>

      <figure className="prep-quote">
        <blockquote className="prep-quote__text">«{prepPage.quote.text}»</blockquote>
        <figcaption className="prep-quote__author">— {prepPage.quote.author}</figcaption>
      </figure>
    </section>
  );
}
