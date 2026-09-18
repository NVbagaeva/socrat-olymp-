'use client';

import { clsx } from 'clsx';
import type { ReactNode } from 'react';

export interface OptionProps {
  checked: boolean;
  disabled?: boolean;
  onSelect: () => void;
  title: ReactNode;
  lead?: ReactNode;
  /** Группа с одним выбором — радиокнопка, с несколькими — флажок. */
  role?: 'radio' | 'checkbox';
}

/** Кнопка-вариант в группе: радиокнопка по семантике, плашка по виду. */
export function Option({
  checked,
  disabled = false,
  onSelect,
  title,
  lead,
  role = 'radio',
}: OptionProps) {
  return (
    <button
      type="button"
      role={role}
      aria-checked={checked}
      className={clsx('cfg-opt', checked && 'is-checked')}
      disabled={disabled}
      onClick={onSelect}
    >
      <span className="cfg-opt__title">{title}</span>
      {lead !== undefined ? <span className="cfg-opt__lead">{lead}</span> : null}
    </button>
  );
}

export interface OptionGroupProps {
  id: string;
  label: ReactNode;
  /** Один выбор или несколько: семантика группы и её кнопок. */
  multiple?: boolean;
  /** Числовые варианты одной ширины. */
  compact?: boolean;
  children: ReactNode;
}

/** Подпись и ряд вариантов одного параметра. */
export function OptionGroup({ id, label, multiple = false, compact = false, children }: OptionGroupProps) {
  return (
    <div
      className="cfg-param"
      role={multiple ? 'group' : 'radiogroup'}
      aria-labelledby={id}
    >
      <span className="cfg-param__label" id={id}>
        {label}
      </span>
      <div className={clsx('cfg-param__options', compact && 'cfg-param__options--compact')}>
        {children}
      </div>
    </div>
  );
}
