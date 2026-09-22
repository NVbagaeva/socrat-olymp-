'use client';

import { clsx } from 'clsx';
import Link from 'next/link';
import { useId, useRef, useState } from 'react';
import type { KeyboardEvent, ReactNode } from 'react';

export interface TabItem {
  id: string;
  label: ReactNode;
  /**
   * Значок перед подписью. Не задан — вкладка остаётся текстовой,
   * как была: поле добавлено для лент разделов и другие наборы
   * вкладок его не заполняют.
   */
  icon?: ReactNode;
  disabled?: boolean;
  /**
   * Адрес вкладки. Задан — вкладка становится ссылкой: её можно
   * открыть в новой вкладке браузера, скопировать и вернуться к ней
   * кнопкой «назад». Не задан — вкладка переключает содержимое на
   * месте, как было.
   */
  href?: string;
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
  const refs = useRef(new Map<string, HTMLElement>());

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
        const common = {
          role: 'tab' as const,
          id: `${autoId}-tab-${item.id}`,
          'aria-controls': `${autoId}-panel-${item.id}`,
          'aria-selected': selected,
          tabIndex: selected ? 0 : -1,
          ref: (node: HTMLElement | null) => {
            if (node) refs.current.set(item.id, node);
            else refs.current.delete(item.id);
          },
        };

        /* Вкладка с адресом — ссылка: переход настоящий, поэтому
           работают «назад», «открыть в новой вкладке» и копирование
           адреса. Вид и обход стрелками у неё те же. */
        /* Значок и подпись — отдельными span: по ним CSS красит
           значок и разводит подпись на две строки, не трогая сам
           набор вкладок. */
        const inside = (
          <>
            {item.icon === undefined ? null : (
              <span className="tabs__ico" aria-hidden="true">
                {item.icon}
              </span>
            )}
            <span className="tabs__text">{item.label}</span>
          </>
        );

        if (item.href !== undefined && !item.disabled) {
          return (
            <Link key={item.id} href={item.href} {...common}>
              {inside}
            </Link>
          );
        }

        return (
          <button
            key={item.id}
            type="button"
            disabled={item.disabled}
            {...common}
            onClick={() => select(item.id)}
          >
            {inside}
          </button>
        );
      })}
    </div>
  );
}
