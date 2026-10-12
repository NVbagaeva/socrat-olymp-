'use client';

import { useId, useState, type KeyboardEvent, type ReactNode } from 'react';
import { clsx } from 'clsx';
import { CheckIcon } from '@/components/ui';
import { RazdelIkonka } from '@/components/tasks/razdely/RazdelIkonka';
import type { IkonkaRazdela } from '@/components/tasks/razdely/types';
import { sostavText } from '@/content/ves12';
import { TitleText } from '../TitleText';
import { TemplateIcon, type TemplateIconName } from './icons';
import './zachyot-setup.css';

/** Строка списка: тип функции (или прототип у генератора раздела). */
export interface SostavRow {
  id: string;
  title: string;
  icon?: IkonkaRazdela | undefined;
  /** Миниатюра вместо иконки: у генератора раздела строка — прототип. */
  media?: ReactNode;
  /** Свой предел счётчика: у прототипа — сколько задач в наборе. */
  max?: number;
  /** Подпись под названием: код набора. */
  code?: string;
  /** Название, набранное KaTeX. */
  titleHtml?: string;
  /** Прототипы строки. Пусто — «Настроить» нет (строка и есть прототип). */
  sets: { id: string; title: string; titleHtml: string; bank: number | null }[];
}

/** Плитка быстрого старта. */
export interface SostavTemplate {
  id: string;
  title: string;
  lead: string;
  icon: TemplateIconName;
  counts: Record<string, number>;
  /** У «Как в прошлый раз» — свои выключенные прототипы и прочие настройки. */
  off?: string[];
}

export interface SostavValue {
  counts: Record<string, number>;
  off: string[];
}

export interface SostavPickerProps {
  rows: SostavRow[];
  /** Готовящиеся строки: одной серой строкой внизу, без счётчиков. */
  soon: string[];
  templates: SostavTemplate[];
  /** Какой шаблон совпадает с составом сейчас. null — свой состав. */
  activeTemplate: string | null;
  value: SostavValue;
  onChange: (next: SostavValue) => void;
  /** Нажата плитка шаблона: у «Как в прошлый раз» экран берёт и прочие настройки. */
  onTemplate?: (template: SostavTemplate) => void;
  /** Заголовок списка: «Типы функций». */
  listTitle: string;
  max?: number;
  /** Что-то под строкой типа: плашка нехватки банка. */
  rowNote?: (rowId: string) => ReactNode;
}

/**
 * Общий выбор состава: шаблон → счётчики по строкам → прототипы по
 * желанию. Один на зачётную работу №12 и генератор по всем типам; у
 * каждого инструмента свои шаблоны.
 *
 * Счётчик заменяет и галочку типа, и общее «задач на тип»: 0 — тип не
 * включён (строка бледнеет), 1…max — число задач. Прототипы скрыты;
 * «Настроить» раскрывает их у одного типа за раз.
 */
export function SostavPicker({
  rows,
  soon,
  templates,
  activeTemplate,
  value,
  onChange,
  onTemplate,
  listTitle,
  max = 5,
  rowNote,
}: SostavPickerProps) {
  const listId = useId();
  const [open, setOpen] = useState<string | null>(null);
  const count = (id: string) => value.counts[id] ?? 0;
  const limit = (id: string) => Math.min(max, rows.find((row) => row.id === id)?.max ?? max);
  const setCount = (id: string, n: number) =>
    onChange({ ...value, counts: { ...value.counts, [id]: Math.max(0, Math.min(limit(id), n)) } });
  const all = (n: number) =>
    onChange({ ...value, counts: Object.fromEntries(rows.map((row) => [row.id, Math.min(n, limit(row.id))])) });
  const total = rows.reduce((sum, row) => sum + count(row.id), 0);

  function onCounterKey(event: KeyboardEvent<HTMLDivElement>, id: string) {
    const step =
      event.key === 'ArrowUp' || event.key === 'ArrowRight'
        ? 1
        : event.key === 'ArrowDown' || event.key === 'ArrowLeft'
          ? -1
          : 0;
    if (step !== 0) {
      event.preventDefault();
      setCount(id, count(id) + step);
    } else if (event.key === 'Home' || event.key === 'End') {
      event.preventDefault();
      setCount(id, event.key === 'Home' ? 0 : limit(id));
    }
  }

  function toggleSet(row: SostavRow, setId: string) {
    const off = value.off.includes(setId)
      ? value.off.filter((id) => id !== setId)
      : [...value.off, setId];
    /* Последний прототип типа не выключается: тип без прототипов — это
       счётчик 0, а не пустой список. */
    if (row.sets.every((set) => off.includes(set.id))) {
      return;
    }
    onChange({ ...value, off });
  }

  return (
    <div className="sostav">
      <section className="sostav__block" aria-labelledby={`${listId}-tpl`}>
        <h3 className="sostav__title" id={`${listId}-tpl`}>
          {sostavText.quick}
        </h3>
        <div className="sostav-tiles">
          {templates.map((item) => {
            const on = activeTemplate === item.id;
            return (
              <button
                key={item.id}
                type="button"
                className={clsx('sostav-tile', on && 'is-checked')}
                aria-pressed={on}
                onClick={() => {
                  onTemplate?.(item);
                  onChange({ counts: { ...item.counts }, off: item.off ?? [] });
                }}
                data-template={item.id}
              >
                <span className="sostav-tile__ico">
                  <TemplateIcon name={item.icon} />
                </span>
                <span className="sostav-tile__text">
                  <span className="sostav-tile__title">{item.title}</span>
                  <span className="sostav-tile__lead">{item.lead}</span>
                </span>
                {on ? (
                  <span className="sostav-tile__check" aria-hidden="true">
                    <CheckIcon />
                  </span>
                ) : null}
              </button>
            );
          })}
          <button
            type="button"
            className={clsx('sostav-tile', activeTemplate === null && total > 0 && 'is-checked')}
            aria-pressed={activeTemplate === null && total > 0}
            onClick={() => {
              all(0);
              document.getElementById(listId)?.querySelector<HTMLElement>('.sostav-counter')?.focus();
            }}
            data-template="own"
          >
            <span className="sostav-tile__ico">
              <TemplateIcon name="sliders" />
            </span>
            <span className="sostav-tile__text">
              <span className="sostav-tile__title">{sostavText.own}</span>
              <span className="sostav-tile__lead">{sostavText.ownLead}</span>
            </span>
            {activeTemplate === null && total > 0 ? (
              <span className="sostav-tile__check" aria-hidden="true">
                <CheckIcon />
              </span>
            ) : null}
          </button>
        </div>
      </section>

      <section className="sostav__block" aria-labelledby={`${listId}-list`}>
        <div className="sostav__head">
          <h3 className="sostav__title" id={`${listId}-list`}>
            {listTitle}
          </h3>
          <div className="sostav__all">
            <button type="button" className="sostav-chip" onClick={() => all(1)}>
              {sostavText.all1}
            </button>
            <button type="button" className="sostav-chip" onClick={() => all(2)}>
              {sostavText.all2}
            </button>
            <button type="button" className="sostav-chip" onClick={() => all(0)}>
              {sostavText.clear}
            </button>
          </div>
        </div>

        <ul className="sostav-rows" id={listId}>
          {rows.map((row) => {
            const n = count(row.id);
            const on = row.sets.filter((set) => !value.off.includes(set.id));
            const expanded = open === row.id;
            const panelId = `${listId}-${row.id}`;
            return (
              <li key={row.id} className={clsx('sostav-row', n === 0 && 'is-off', expanded && 'is-open')}>
                <div className="sostav-row__main">
                  {row.media !== undefined ? (
                    <span className="sostav-row__media" aria-hidden="true">
                      {row.media}
                    </span>
                  ) : row.icon === undefined ? null : (
                    <RazdelIkonka icon={row.icon} sizes="44px" dim={n === 0} className="sostav-row__ico" />
                  )}
                  <span className="sostav-row__title">
                    <TitleText title={row.title} html={row.titleHtml} />
                    {row.code === undefined ? null : <span className="sostav-row__code">{row.code}</span>}
                  </span>
                  <div
                    className="sostav-counter"
                    role="spinbutton"
                    tabIndex={0}
                    aria-label={`${row.title}: задач`}
                    aria-valuemin={0}
                    aria-valuemax={limit(row.id)}
                    aria-valuenow={n}
                    aria-valuetext={n === 0 ? sostavText.offValue : `${n}`}
                    onKeyDown={(event) => onCounterKey(event, row.id)}
                    data-row={row.id}
                  >
                    <button
                      type="button"
                      tabIndex={-1}
                      aria-label={sostavText.less}
                      disabled={n === 0}
                      onClick={() => setCount(row.id, n - 1)}
                    >
                      −
                    </button>
                    <output className="sostav-counter__value">{n}</output>
                    <button
                      type="button"
                      tabIndex={-1}
                      aria-label={sostavText.more}
                      disabled={n >= limit(row.id)}
                      onClick={() => setCount(row.id, n + 1)}
                    >
                      +
                    </button>
                  </div>
                  {row.sets.length === 0 ? null : (
                    <>
                      <span className="sostav-row__sets">
                        {on.length === row.sets.length
                          ? sostavText.allSets
                          : sostavText.someSets(on.length, row.sets.length)}
                      </span>
                      <button
                        type="button"
                        className="sostav-row__more"
                        aria-expanded={expanded}
                        aria-controls={panelId}
                        onClick={() => setOpen(expanded ? null : row.id)}
                      >
                        {sostavText.tune}
                        <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
                          <path d="M6 9l6 6 6-6" />
                        </svg>
                      </button>
                    </>
                  )}
                </div>
                {rowNote?.(row.id)}
                {expanded ? (
                  <ul className="sostav-sets" id={panelId}>
                    {row.sets.map((set) => {
                      const enabled = !value.off.includes(set.id);
                      return (
                        <li key={set.id}>
                          <button
                            type="button"
                            role="switch"
                            aria-checked={enabled}
                            className="sostav-set"
                            onClick={() => toggleSet(row, set.id)}
                          >
                            <span className={clsx('sostav-switch', enabled && 'is-on')} aria-hidden="true" />
                            <span className="sostav-set__title">
                              <TitleText title={set.title} html={set.titleHtml} />
                            </span>
                            <span className="sostav-set__bank">
                              {set.bank === null ? sostavText.bankAny : sostavText.bank(set.bank)}
                            </span>
                          </button>
                        </li>
                      );
                    })}
                  </ul>
                ) : null}
              </li>
            );
          })}
        </ul>
        {soon.length === 0 ? null : (
          <p className="sostav-soon">
            <b>{sostavText.soon}</b> {soon.join(', ')}
          </p>
        )}
      </section>
    </div>
  );
}
