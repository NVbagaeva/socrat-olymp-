'use client';

import { clsx } from 'clsx';
import { useId, useRef, useState } from 'react';
import type { KeyboardEvent, ReactNode } from 'react';

export interface TabItem {
  id: string;
  label: ReactNode;
  disabled?: boolean;
}

export interface TabsProps {
  items: TabItem[];
  /** Управляемый режим. Без него вкладки управляют собой сами. */
  value?: string;
  defaultValue?: string;
  onValueChange?: (id: string) => void;
  /** Название набора вкладок для скринридера. */
  label: string;
  className?: string;
}

/** Табы с блуждающим фокусом: стрелки, Home и End переключают вкладку. */
export function Tabs({ items, value, defaultValue, onValueChange, label, className }: TabsProps) {
  const autoId = useId();
  const first = items[0];
  const [inner, setInner] = useState(defaultValue ?? first?.id ?? '');
  const active = value ?? inner;
  const refs = useRef(new Map<string, HTMLButtonElement>());

  const select = (id: string) => {
    if (value === undefined) setInner(id);
    onValueChange?.(id);
  };

  const move = (event: KeyboardEvent<HTMLDivElement>) => {
    const usable = items.filter((item) => !item.disabled);
    const current = usable.findIndex((item) => item.id === active);
    if (current === -1) return;

    let next = current;
    if (event.key === 'ArrowRight') next = (current + 1) % usable.length;
    else if (event.key === 'ArrowLeft') next = (current - 1 + usable.length) % usable.length;
    else if (event.key === 'Home') next = 0;
    else if (event.key === 'End') next = usable.length - 1;
    else return;

    event.preventDefault();
    const target = usable[next];
    if (!target) return;
    select(target.id);
    refs.current.get(target.id)?.focus();
  };

  return (
    <div className={clsx('tabs', className)} role="tablist" aria-label={label} onKeyDown={move}>
      {items.map((item) => {
        const selected = item.id === active;
        return (
          <button
            key={item.id}
            type="button"
            role="tab"
            id={`${autoId}-tab-${item.id}`}
            aria-controls={`${autoId}-panel-${item.id}`}
            aria-selected={selected}
            tabIndex={selected ? 0 : -1}
            disabled={item.disabled}
            ref={(node) => {
              if (node) refs.current.set(item.id, node);
              else refs.current.delete(item.id);
            }}
            onClick={() => select(item.id)}
          >
            {item.label}
          </button>
        );
      })}
    </div>
  );
}
