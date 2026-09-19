'use client';

import { clsx } from 'clsx';
import type { ReactNode } from 'react';
import { CheckIcon } from '@/components/ui';

export interface SkillItem {
  /** Идентификатор набора движка: 12.A … */
  id: string;
  title: string;
  /**
   * Подпись под названием на карточке. Не задана — идентификатор:
   * у наборов движка он и есть код, «12.A»; у методов вероятности
   * идентификатор служебный, и подписью идёт номер метода.
   */
  code?: string;
  /** Сколько задач в наборе — из манифеста. */
  count: number;
  /** Уровни, встреченные у задач набора — из манифеста. */
  levels: string[];
  /** Миниатюра, собранная движком на сервере. */
  chart: ReactNode;
}

export interface SkillCardsProps {
  items: SkillItem[];
  /** Что выбрано. Один выбор — список из одного элемента. */
  selected: string[];
  onToggle: (id: string) => void;
  /** Несколько навыков сразу — флажки; иначе радиокнопки. */
  multiple?: boolean;
  labelledBy: string;
}

/** Карточки навыков: миниатюра, название, код набора, галочка. */
export function SkillCards({
  items,
  selected,
  onToggle,
  multiple = false,
  labelledBy,
}: SkillCardsProps) {
  return (
    <div
      className="cfg-skills"
      role={multiple ? 'group' : 'radiogroup'}
      aria-labelledby={labelledBy}
    >
      {items.map((item) => {
        const checked = selected.includes(item.id);
        return (
          <button
            key={item.id}
            type="button"
            role={multiple ? 'checkbox' : 'radio'}
            aria-checked={checked}
            className={clsx('cfg-skill', checked && 'is-checked')}
            onClick={() => onToggle(item.id)}
          >
            <span className="cfg-skill__chart" aria-hidden="true">
              {item.chart}
            </span>
            {checked ? (
              <span className="cfg-skill__check" aria-hidden="true">
                <CheckIcon />
              </span>
            ) : null}
            <span className="cfg-skill__text">
              <span className="cfg-skill__title">{item.title}</span>
              <span className="cfg-skill__code">{item.code ?? item.id}</span>
            </span>
          </button>
        );
      })}
    </div>
  );
}
