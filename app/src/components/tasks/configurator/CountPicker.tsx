'use client';

import { useId, useRef, useState } from 'react';
import { Input } from '@/components/ui';
import { counted } from '@/lib/plural';
import { Option, OptionGroup } from './Option';

/**
 * Выбор количества заданий: готовые числа, «Все (N)» и «Своё».
 *
 * Один на все конфигураторы сайта — тренажёры №12, №4, №5, №8 и
 * генераторы вариантов. Состояние держит тот, кто показывает группу
 * (useCountChoice), а итоговое число считает countOf: так подпись
 * внизу, сводка и «Начать тренировку» видят одно и то же число.
 */

/** Выбор: число с кнопки, null — «Все», 'custom' — своё число из поля. */
export type CountPick = number | null | 'custom';

export interface CountChoice {
  pick: CountPick;
  /** Что набрано в поле «Своё»: только цифры, может быть пусто. */
  custom: string;
  /** Набрали больше, чем есть: поле уже исправлено на максимум. */
  capped: boolean;
}

/** Готовые числа и «Все» (null) — как было у всех конфигураторов. */
export const COUNT_PRESETS: readonly (number | null)[] = [5, 10, 20, null];

export const countWords = {
  all: 'Все',
  custom: 'Своё',
  field: 'Своё количество заданий',
  placeholder: 'Например, 7',
  /* «{n}» подставляется числом. */
  capped: 'Доступно только {n}',
  empty: 'Введите число от 1 до {n}',
  /* Подпись внизу, пока поле «Своё» пусто. */
  none: 'количество не выбрано',
};

/** Состояние выбора: по умолчанию 10, как было. */
export function useCountChoice(initial: CountPick = 10) {
  return useState<CountChoice>({ pick: initial, custom: '', capped: false });
}

/**
 * Сколько заданий выбрано при максимуме `max`.
 *
 * null — выбора нет: поле «Своё» пусто или в нём ноль, запускать
 * нечего. Своё число больше максимума сводится к максимуму: максимум
 * мог уменьшиться, когда сменили навык или режим.
 */
export function countOf(choice: CountChoice, max: number): number | null {
  if (choice.pick === null) {
    return max;
  }
  if (choice.pick !== 'custom') {
    return choice.pick;
  }
  const n = Number.parseInt(choice.custom, 10);
  if (!Number.isFinite(n) || n < 1 || max < 1) {
    return null;
  }
  return Math.min(n, max);
}

/** «10 заданий» для подписи и сводки; пустой выбор — словами. */
export function countLabel(count: number | null): string {
  return count === null ? countWords.none : counted(count, 'задание', 'задания', 'заданий');
}

export interface CountPickerProps {
  /** id подписи группы: уникален на странице. */
  id: string;
  label: string;
  /** Сколько заданий доступно: число за «Все» и потолок поля «Своё». */
  max: number;
  value: CountChoice;
  onChange: (value: CountChoice) => void;
  presets?: readonly (number | null)[];
  /** Слово кнопки «Все»: у конфигураторов оно своё в словаре. */
  allWord?: string;
}

export function CountPicker({
  id,
  label,
  max,
  value,
  onChange,
  presets = COUNT_PRESETS,
  allWord = countWords.all,
}: CountPickerProps) {
  const inputId = useId();
  const hintId = useId();
  const input = useRef<HTMLInputElement>(null);
  const custom = value.pick === 'custom';
  const typed = Number.parseInt(value.custom, 10);
  /* Максимум мог стать меньше набранного: поле показывает то, что
     уйдёт в тренировку, и подсказка объясняет почему. */
  const over = Number.isFinite(typed) && typed > max && max > 0;
  const shown = over ? String(max) : value.custom;
  const empty = countOf(value, max) === null;

  function pickCustom() {
    onChange({ ...value, pick: 'custom' });
    /* Поле появляется под кнопками: фокус в него и прокрутка к
       середине экрана — на телефоне снизу прилипла панель запуска,
       и поле у нижнего края ушло бы под неё. */
    window.requestAnimationFrame(() => {
      input.current?.focus({ preventScroll: true });
      input.current?.scrollIntoView({ block: 'center', behavior: 'smooth' });
    });
  }

  function type(raw: string) {
    const digits = raw.replace(/\D/g, '').slice(0, 4);
    if (digits === '') {
      onChange({ pick: 'custom', custom: '', capped: false });
      return;
    }
    const n = Number.parseInt(digits, 10);
    if (max > 0 && n > max) {
      onChange({ pick: 'custom', custom: String(max), capped: true });
      return;
    }
    onChange({ pick: 'custom', custom: String(n), capped: false });
  }

  const hint = !custom
    ? null
    : value.capped || over
      ? countWords.capped.replace('{n}', String(max))
      : empty
        ? countWords.empty.replace('{n}', String(max))
        : null;

  return (
    <>
      <OptionGroup id={id} label={label} compact>
        {presets.map((item) => (
          <Option
            key={item ?? 'all'}
            checked={value.pick === item}
            onSelect={() => onChange({ ...value, pick: item, capped: false })}
            title={item === null ? `${allWord} (${max})` : item}
          />
        ))}
        <Option checked={custom} onSelect={pickCustom} title={countWords.custom} />
      </OptionGroup>

      {custom ? (
        <div className="cfg-param cfg-count">
          <label className="sr-only" htmlFor={inputId}>
            {countWords.field}
          </label>
          <Input
            ref={input}
            id={inputId}
            className="cfg-count__input"
            type="text"
            inputMode="numeric"
            pattern="[0-9]*"
            enterKeyHint="done"
            autoComplete="off"
            maxLength={4}
            value={shown}
            placeholder={countWords.placeholder}
            onChange={(event) => type(event.target.value)}
            state={empty && value.custom !== '' ? 'error' : 'default'}
            aria-describedby={hint === null ? undefined : hintId}
          />
          {hint === null ? null : (
            <p className="cfg-count__hint" id={hintId} role="status">
              {hint}
            </p>
          )}
        </div>
      ) : null}
    </>
  );
}
