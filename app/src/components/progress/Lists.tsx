'use client';

import type { ReactNode } from 'react';
import { Button } from '@/components/ui';
import { FIX_STREAK, type Mistake } from '@/lib/progressLog';
import { activeBookmarks, bookmarks, type Bookmark } from '@/lib/zakladki';
import { history, historyOf } from '@/lib/istoriya';
import { counted } from '@/lib/plural';
import './progress.css';

function dateTime(ms: number): string {
  if (ms <= 0) return '';
  return new Date(ms).toLocaleString('ru-RU', {
    day: 'numeric',
    month: 'long',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function minutes(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return m === 0 ? `${s} с` : `${m} мин ${s} с`;
}

/**
 * «Мои ошибки»: задачи с ошибкой или открытым решением. «Работа над
 * ошибками» — новые аналоги того же типа; задача уходит из списка после
 * двух верных аналогов подряд.
 */
export function MistakesList({
  items,
  titleOf,
  action,
  empty,
}: {
  items: Mistake[];
  /** Название типа задачи: «Степени с одним основанием». */
  titleOf: (mistake: Mistake) => ReactNode;
  /** Кнопка или ссылка «Работа над ошибками». */
  action?: ReactNode;
  empty: string;
}) {
  if (items.length === 0) {
    return <p className="tp-empty">{empty}</p>;
  }
  return (
    <div className="tp-list-wrap">
      <ul className="tp-list" data-list="mistakes">
        {items.map((m) => (
          <li key={m.task} className="tp-row">
            <span className="tp-row__title">{titleOf(m)}</span>
            <span className="tp-row__meta">
              {m.streak === 0
                ? `Нужно ${FIX_STREAK} верных аналога подряд`
                : `Верных аналогов подряд: ${m.streak} из ${FIX_STREAK}`}
            </span>
          </li>
        ))}
      </ul>
      {action}
    </div>
  );
}

/** «Отложенные»: закладки раздела со ссылкой «Открыть» и снятием. */
export function BookmarksList({
  section,
  empty,
  renderTitle,
}: {
  section?: string;
  empty: string;
  /** Подпись закладки разделом (с формулами); без неё — сохранённая подпись. */
  renderTitle?: (item: Bookmark) => ReactNode;
}) {
  const list = bookmarks.use();
  const items = activeBookmarks(list, section);
  if (items.length === 0) {
    return <p className="tp-empty">{empty}</p>;
  }
  return (
    <ul className="tp-list" data-list="bookmarks">
      {items.map((item) => (
        <li key={item.id} className="tp-row tp-row--action">
          <span className="tp-row__title">{renderTitle?.(item) ?? item.title}</span>
          <span className="tp-row__meta">
            {item.place === 'opornye' ? 'Опорная задача' : 'Тренажёр'} · отложено{' '}
            {dateTime(item.addedAt)}
          </span>
          <span className="tp-row__actions">
            {/* Обычная ссылка, а не переход внутри приложения: тренажёр
                читает задачу из адреса при входе, и с той же страницы
                закладка должна открыться так же, как с любой другой. */}
            <a className="btn btn--secondary btn--sm" href={item.href}>
              Открыть
            </a>
            <Button
              variant="ghost"
              size="sm"
              onClick={() =>
                bookmarks.update((current) => ({
                  v: 1,
                  items: current.items.map((entry) =>
                    entry.id === item.id
                      ? { ...entry, removedAt: Date.now(), updatedAt: Date.now() }
                      : entry,
                  ),
                }))
              }
            >
              Убрать
            </Button>
          </span>
        </li>
      ))}
    </ul>
  );
}

/** История тренировок раздела: когда, сколько верно, время, что просело. */
export function HistoryList({
  section,
  empty,
  limit = 10,
}: {
  section: string;
  empty: string;
  limit?: number;
}) {
  const list = history.use();
  const items = historyOf(list, section).slice(0, limit);
  if (items.length === 0) {
    return <p className="tp-empty">{empty}</p>;
  }
  return (
    <ul className="tp-list" data-list="history">
      {items.map((item) => (
        <li key={item.id} className="tp-row">
          <span className="tp-row__title">
            {dateTime(item.at)} · верно {item.right} из {item.total}
          </span>
          <span className="tp-row__meta">
            {minutes(item.seconds)}
            {item.wrong + item.hinted > 0
              ? ` · с ошибкой или подсказкой: ${counted(item.wrong + item.hinted, 'задача', 'задачи', 'задач')}`
              : ''}
          </span>
          {item.weak.length === 0 ? null : (
            <span className="tp-row__weak">Просели: {item.weak.join(', ')}</span>
          )}
        </li>
      ))}
    </ul>
  );
}
