'use client';

import { clsx } from 'clsx';
import { CheckIcon } from '@/components/ui';
import { RazdelIkonka } from '@/components/tasks/razdely/RazdelIkonka';
import { typePickerText } from '@/content/ves12';
import { usableSets, type WorkSource } from '@/lib/ves12/work';
import type { Ves12Catalog, Ves12Type } from '@/lib/ves12/types';
import { TitleText } from '../TitleText';

export interface TypePickerProps {
  catalog: Ves12Catalog;
  /** Источник задач: при «Только ФИПИ» прототипы без задач банка не выбираются. */
  source: WorkSource;
  /** Выбранные прототипы всех типов. */
  selected: string[];
  onChange: (next: string[]) => void;
  /** Подпись группы для чтения с экрана. */
  labelledBy: string;
  /** Показывать, сколько задач банка ФИПИ в прототипе. */
  fipiCounts?: boolean;
}

/**
 * Выбор типов функций и их прототипов — общий для зачётной работы и
 * генератора по всем типам.
 *
 * Сверху — чипы типов с иконками и «Выбрать все»; под ними у каждого
 * выбранного типа — его прототипы флажками. Здесь выбор настоящий:
 * выбранный чип — галочка и синяя рамка постоянно, а наведение только
 * подсвечивает рамку (и только при мыши).
 */
export function TypePicker({
  catalog,
  source,
  selected,
  onChange,
  labelledBy,
  fipiCounts = false,
}: TypePickerProps) {
  const chosen = new Set(selected);
  const open = catalog.types.filter((type) => usableSets(type, source).length > 0);
  const allIds = open.flatMap((type) => usableSets(type, source).map((set) => set.id));
  const everything = allIds.length > 0 && allIds.every((id) => chosen.has(id));

  /* Порядок выбора — порядок каталога: адрес работы не зависит от того,
     в какой последовательности учитель нажимал. */
  const ordered = (ids: Set<string>) => allIds.filter((id) => ids.has(id));

  function toggleType(type: Ves12Type) {
    const own = usableSets(type, source).map((set) => set.id);
    const on = own.some((id) => chosen.has(id));
    const next = new Set(chosen);
    own.forEach((id) => (on ? next.delete(id) : next.add(id)));
    onChange(ordered(next));
  }

  function toggleSet(id: string) {
    const next = new Set(chosen);
    if (next.has(id)) {
      next.delete(id);
    } else {
      next.add(id);
    }
    onChange(ordered(next));
  }

  return (
    <div className="type-picker">
      <div className="type-picker__chips" role="group" aria-labelledby={labelledBy}>
        <button
          type="button"
          className="type-picker__all"
          onClick={() => onChange(everything ? [] : allIds)}
        >
          {everything ? typePickerText.none : typePickerText.all}
        </button>
        {catalog.types.map((type) => {
          const sets = usableSets(type, source);
          const disabled = sets.length === 0;
          const count = sets.filter((set) => chosen.has(set.id)).length;
          const checked = count > 0;
          return (
            <button
              key={type.id}
              type="button"
              role="checkbox"
              aria-checked={checked ? (count === sets.length ? true : 'mixed') : false}
              className={clsx('type-chip', checked && 'is-checked', disabled && 'is-disabled')}
              disabled={disabled}
              title={!type.soon && disabled ? typePickerText.noFipi : undefined}
              onClick={() => toggleType(type)}
            >
              <RazdelIkonka icon={type.icon} sizes="40px" soon={type.soon} className="type-chip__ico" />
              <span className="type-chip__text">
                <span className="type-chip__title">{type.title}</span>
                {type.soon ? (
                  <span className="type-chip__note">{typePickerText.soon}</span>
                ) : disabled ? (
                  <span className="type-chip__note">{typePickerText.noFipiShort}</span>
                ) : checked ? (
                  <span className="type-chip__note">
                    {count} из {sets.length}
                  </span>
                ) : null}
              </span>
              {checked ? (
                <span className="type-chip__check" aria-hidden="true">
                  <CheckIcon />
                </span>
              ) : null}
            </button>
          );
        })}
      </div>

      {open
        .filter((type) => usableSets(type, source).some((set) => chosen.has(set.id)))
        .map((type) => (
          <fieldset key={type.id} className="type-picker__sets">
            <legend className="type-picker__legend">
              {typePickerText.prototypes}: {type.title}
            </legend>
            <div className="type-picker__set-list">
              {usableSets(type, source).map((set) => {
                const on = chosen.has(set.id);
                return (
                  <label key={set.id} className={clsx('set-pill', on && 'is-checked')}>
                    <input type="checkbox" checked={on} onChange={() => toggleSet(set.id)} />
                    <span className="set-pill__box" aria-hidden="true">
                      {on ? <CheckIcon /> : null}
                    </span>
                    <span className="set-pill__text">
                      <span className="set-pill__code">{set.id}</span>{' '}
                      <TitleText title={set.title} html={set.titleHtml} />
                      {fipiCounts && source === 'fipi' && set.fipi !== null ? (
                        <span className="set-pill__note"> · {typePickerText.fipiCount(set.fipi)}</span>
                      ) : null}
                    </span>
                  </label>
                );
              })}
            </div>
          </fieldset>
        ))}
    </div>
  );
}
