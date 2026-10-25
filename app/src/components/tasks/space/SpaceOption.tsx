'use client';

import { clsx } from 'clsx';
import { useId } from 'react';
import { SPACE_TEXT as T } from '@/content/space';
import type { SheetSpace, SpaceMode, SpaceSize } from '@/lib/sheet/space.js';
import './space-option.css';

export interface SpaceOptionProps {
  value: SheetSpace;
  onChange: (next: SheetSpace) => void;
  /** Номера заданий для «Настроить по заданиям» («Собрать вариант»); нет — блока нет. */
  numbers?: readonly number[];
  className?: string;
}

function Seg<I extends string>({
  label,
  options,
  value,
  onPick,
}: {
  label: string;
  options: readonly { id: I; label: string }[];
  value: I;
  onPick: (id: I) => void;
}) {
  return (
    <div className="sp-opt__seg" role="radiogroup" aria-label={label}>
      {options.map((o) => (
        <button
          key={o.id}
          type="button"
          role="radio"
          aria-checked={value === o.id}
          className={clsx('sp-opt__btn', value === o.id && 'is-active')}
          onClick={() => onPick(o.id)}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}

/**
 * Настройка «Место для решения» листа ученика (lib/sheet/space.js):
 * нет / пустое место / в клетку, размер, а у «Собрать вариант» — свой
 * размер по номерам заданий. Одна для всех генераторов: экран хранит
 * выбор на устройстве, лист получает его адресом (sp=) или кодом.
 */
export function SpaceOption({ value, onChange, numbers, className }: SpaceOptionProps) {
  const id = useId();
  const on = value.mode !== 'none';
  const setPer = (n: number, v: string) => {
    const per = { ...value.per };
    if (v === '') delete per[n];
    else per[n] = v as SpaceSize | 'none';
    onChange({ ...value, per });
  };
  return (
    <div className={clsx('sp-opt', className)}>
      <p className="sp-opt__label">{T.title}</p>
      <Seg
        label={T.title}
        options={T.modes as readonly { id: SpaceMode; label: string }[]}
        value={value.mode}
        onPick={(mode) => onChange({ ...value, mode })}
      />
      {on ? (
        <>
          <p className="sp-opt__label sp-opt__label--sub">{T.size}</p>
          <Seg
            label={T.size}
            options={T.sizes as readonly { id: SpaceSize; label: string }[]}
            value={value.size}
            onPick={(size) => onChange({ ...value, size })}
          />
          <p className="sp-opt__note">{T.sizeNote}</p>
        </>
      ) : null}
      <p className="sp-opt__note">{T.note}</p>
      {on && numbers !== undefined && numbers.length > 0 ? (
        <details className="sp-opt__per">
          <summary className="sp-opt__per-title">{T.perTitle}</summary>
          <p className="sp-opt__note">{T.perNote}</p>
          <ul className="sp-opt__per-list">
            {numbers.map((n) => (
              <li key={n} className="sp-opt__per-row">
                <label className="sp-opt__per-no" htmlFor={`${id}-${n}`}>
                  {T.perLabel(n)}
                </label>
                <select
                  id={`${id}-${n}`}
                  className="input sp-opt__per-select"
                  value={value.per[n] ?? ''}
                  onChange={(e) => setPer(n, e.target.value)}
                >
                  <option value="">{T.perSame}</option>
                  {T.sizes.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.label}
                    </option>
                  ))}
                  <option value="none">{T.perNone}</option>
                </select>
              </li>
            ))}
          </ul>
        </details>
      ) : null}
    </div>
  );
}
