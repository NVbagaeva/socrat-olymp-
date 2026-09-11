'use client';

import { clsx } from 'clsx';
import { createPortal } from 'react-dom';
import { useCallback, useEffect, useRef, useState } from 'react';
import type { CSSProperties } from 'react';
import { site } from '@/content/site';

type MenuState = 'open' | 'closing';

const FOCUSABLE = 'a[href], button:not([disabled])';

/** Ширина, ниже которой меню уезжает в бургер. Совпадает с site.css. */
const NARROW = '(max-width: 939.98px)';

/**
 * Бургер-меню узкой шапки: пункты навигации и «Войти» уезжают сюда,
 * логотип и кнопка «Начать бесплатно» остаются в шапке.
 */
export function SiteMenu() {
  const [state, setState] = useState<MenuState | null>(null);
  const button = useRef<HTMLButtonElement>(null);
  const panel = useRef<HTMLDivElement>(null);
  const open = state !== null;

  const close = useCallback(() => {
    setState((current) => (current === 'open' ? 'closing' : current));
  }, []);

  /** Esc закрывает, Tab не выпускает фокус за пределы панели. */
  const onKeyDown = useCallback(
    (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.preventDefault();
        close();
        return;
      }
      if (event.key !== 'Tab' || !panel.current) return;

      const nodes = Array.from(panel.current.querySelectorAll<HTMLElement>(FOCUSABLE));
      const first = nodes[0];
      const last = nodes[nodes.length - 1];
      if (!first || !last) return;

      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    },
    [close],
  );

  // Фокус уходит внутрь панели, страница за ней не прокручивается.
  useEffect(() => {
    if (state !== 'open') return undefined;

    panel.current?.querySelector<HTMLElement>(FOCUSABLE)?.focus();
    document.addEventListener('keydown', onKeyDown);
    const previous = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    return () => {
      document.removeEventListener('keydown', onKeyDown);
      document.body.style.overflow = previous;
    };
  }, [state, onKeyDown]);

  // Экран стал шире — бургера больше нет, панель закрывается без следа.
  useEffect(() => {
    if (!open) return undefined;
    const wide = window.matchMedia(NARROW);
    const onChange = () => {
      if (!wide.matches) setState(null);
    };
    wide.addEventListener('change', onChange);
    return () => wide.removeEventListener('change', onChange);
  }, [open]);

  const finishClosing = (animationName: string) => {
    if (state !== 'closing' || animationName !== 'menu-out') return;
    setState(null);
    button.current?.focus();
  };

  const items = [
    ...site.nav.map((link) => ({ ...link, separated: false })),
    { ...site.headerActions.login, separated: true },
  ];

  return (
    <>
      <button
        type="button"
        className="burger"
        ref={button}
        aria-expanded={state === 'open'}
        aria-controls="site-menu"
        aria-label={state === 'open' ? 'Закрыть меню' : 'Открыть меню'}
        onClick={() => setState(state === 'open' ? 'closing' : 'open')}
      >
        <span className="burger__bar" />
        <span className="burger__bar" />
        <span className="burger__bar" />
      </button>

      {open
        ? createPortal(
            <div
              className="site-menu"
              data-state={state}
              role="presentation"
              onMouseDown={close}
              onAnimationEnd={(event) => finishClosing(event.animationName)}
            >
              <div
                className="site-menu__panel"
                id="site-menu"
                ref={panel}
                role="dialog"
                aria-modal="true"
                aria-label="Меню сайта"
                onMouseDown={(event) => event.stopPropagation()}
              >
                <nav className="site-menu__nav" aria-label="Разделы сайта">
                  {items.map((item, index) => (
                    <a
                      key={item.href + item.label}
                      href={item.href}
                      className={clsx(
                        't-h3 site-menu__item',
                        item.separated && 'site-menu__item--apart',
                      )}
                      style={{ '--i': index } as CSSProperties}
                      onClick={close}
                    >
                      {item.label}
                    </a>
                  ))}
                </nav>
              </div>
            </div>,
            // Панель выносится в body: у шапки есть backdrop-filter, а он
            // делает её содержащим блоком для position: fixed — внутри неё
            // панель ужалась бы до размеров шапки.
            document.body,
          )
        : null}
    </>
  );
}
