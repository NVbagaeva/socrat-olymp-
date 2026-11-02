'use client';

import { clsx } from 'clsx';
import Link from 'next/link';
import { useCallback, useEffect, useId, useRef, useState } from 'react';
import type { NavGroup } from '@/content/site';

/** Сколько мышь может побыть вне списка, прежде чем он закроется. */
const HOVER_CLOSE_MS = 160;

export interface NavDropdownProps {
  group: NavGroup;
  /** Текущая страница: если она в группе, кнопка отмечена как текущая. */
  currentHref?: string;
}

/**
 * Пункт широкой шапки со списком ссылок («Варианты»). Открывается
 * щелчком, с клавиатуры (Enter, пробел, стрелка вниз) и наведением мыши.
 * Закрывается по Esc, щелчку мимо, уходу фокуса и выбору ссылки.
 * В бургер-меню групп нет: там те же ссылки подряд (navLinks).
 */
export function NavDropdown({ group, currentHref }: NavDropdownProps) {
  const [open, setOpen] = useState(false);
  const root = useRef<HTMLDivElement>(null);
  const button = useRef<HTMLButtonElement>(null);
  const hoverTimer = useRef<number | undefined>(undefined);
  /* Мышь сначала наводится, потом щёлкает: список уже открыт наведением,
     и щелчок не должен тут же его закрыть. Второй щелчок — закрывает. */
  const openedByHover = useRef(false);
  const listId = useId();
  const current = group.items.some((item) => item.href === currentHref);

  const cancelHoverClose = () => window.clearTimeout(hoverTimer.current);

  const focusItem = (index: number) => {
    const links = root.current?.querySelectorAll<HTMLAnchorElement>('.nav-drop__item');
    links?.[index]?.focus();
  };

  const onDocumentDown = useCallback((event: PointerEvent) => {
    if (!root.current?.contains(event.target as Node)) setOpen(false);
  }, []);

  useEffect(() => {
    if (!open) return undefined;
    document.addEventListener('pointerdown', onDocumentDown);
    return () => document.removeEventListener('pointerdown', onDocumentDown);
  }, [open, onDocumentDown]);

  useEffect(() => {
    if (!open) openedByHover.current = false;
  }, [open]);

  useEffect(() => () => window.clearTimeout(hoverTimer.current), []);

  const onKeyDown = (event: React.KeyboardEvent) => {
    const links = Array.from(
      root.current?.querySelectorAll<HTMLAnchorElement>('.nav-drop__item') ?? [],
    );
    const index = links.indexOf(document.activeElement as HTMLAnchorElement);

    if (event.key === 'Escape' && open) {
      event.preventDefault();
      setOpen(false);
      button.current?.focus();
    } else if (event.key === 'ArrowDown') {
      event.preventDefault();
      if (!open) {
        setOpen(true);
        requestAnimationFrame(() => focusItem(0));
      } else {
        links[(index + 1) % links.length]?.focus();
      }
    } else if (event.key === 'ArrowUp' && open) {
      event.preventDefault();
      links[index <= 0 ? links.length - 1 : index - 1]?.focus();
    }
  };

  return (
    <div
      className="nav-drop"
      ref={root}
      data-open={open || undefined}
      onKeyDown={onKeyDown}
      onBlur={(event) => {
        if (!root.current?.contains(event.relatedTarget as Node)) setOpen(false);
      }}
      onPointerEnter={(event) => {
        if (event.pointerType !== 'mouse') return;
        cancelHoverClose();
        if (!open) openedByHover.current = true;
        setOpen(true);
      }}
      onPointerLeave={(event) => {
        if (event.pointerType !== 'mouse') return;
        cancelHoverClose();
        hoverTimer.current = window.setTimeout(() => {
          openedByHover.current = false;
          setOpen(false);
        }, HOVER_CLOSE_MS);
      }}
    >
      <button
        type="button"
        ref={button}
        className={clsx('nav-drop__button', current && 'is-current')}
        aria-expanded={open}
        aria-controls={listId}
        onClick={() => {
          if (openedByHover.current) {
            openedByHover.current = false;
            setOpen(true);
          } else {
            setOpen((value) => !value);
          }
        }}
      >
        {group.label}
        <svg viewBox="0 0 12 12" aria-hidden="true" focusable="false">
          <path d="M3 4.5 6 7.5l3-3" />
        </svg>
      </button>
      <ul className="nav-drop__list" id={listId} hidden={!open}>
        {group.items.map((item) => (
          <li key={item.href}>
            <Link
              className="nav-drop__item"
              href={item.href}
              aria-current={item.href === currentHref ? 'page' : undefined}
              onClick={() => setOpen(false)}
            >
              {item.label}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
