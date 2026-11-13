'use client';

import { createPortal } from 'react-dom';
import { useCallback, useEffect, useRef, useState } from 'react';
import type { CSSProperties } from 'react';
import { AUTH_UI } from '@/content/auth-ui';
import { site } from '@/content/site';
import type { MenuLink } from '@/content/site';
import { AUTH_ENABLED, AUTH_HREF, AUTH_IN_HEADER } from '@/lib/auth/config';
import { useSessionUser } from '@/lib/auth/session';
import { LogoutItem } from '@/components/auth/AuthLive';
import { NavIcon } from '@/components/ui/NavIcons';

type MenuState = 'open' | 'closing';

const FOCUSABLE = 'a[href], button:not([disabled])';

/** Ширина, ниже которой меню уезжает в бургер. Совпадает с site.css. */
const NARROW = '(max-width: 1023.98px)';

/** Шеврон справа у строки: показывает, что строка ведёт дальше. */
function Chevron() {
  return (
    <svg
      className="site-menu__chev"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      focusable="false"
    >
      <path d="m9 6 6 6-6 6" />
    </svg>
  );
}

/** Строка меню: значок в плашке, название, пояснение, шеврон. */
function Row({ link, onClick }: { link: MenuLink; onClick: () => void }) {
  return (
    <a href={link.href} className="site-menu__row" onClick={onClick}>
      <span className="site-menu__ico">
        <NavIcon name={link.icon} />
      </span>
      <span className="site-menu__text">
        <span className="site-menu__label">{link.label}</span>
        <span className="site-menu__hint">{link.hint}</span>
      </span>
      <Chevron />
    </a>
  );
}

/**
 * Бургер-меню узкой шапки: пункты навигации и «Войти» уезжают сюда,
 * логотип и кнопка «Начать бесплатно» остаются в шапке. После входа
 * вместо «Войти» — «Мой кабинет» и «Выйти».
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

  /* Вход — только при включённом флаге: без него пункта нет вообще.
     Вошедшему вместо «Войти» — «Мой кабинет» и «Выйти». */
  const user = useSessionUser();
  const { glavnoe, groups, tarify, akkaunt } = site.menu;
  const account =
    AUTH_IN_HEADER && user === null
      ? { label: AUTH_UI.login, href: AUTH_HREF.voyti }
      : AUTH_ENABLED && user !== null
        ? { label: AUTH_UI.kabinet, href: AUTH_HREF.kabinet }
        : null;
  const withLogout = AUTH_ENABLED && user !== null;

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
                  <a
                    href={glavnoe.href}
                    className="site-menu__hero"
                    style={{ '--i': 0 } as CSSProperties}
                    onClick={close}
                  >
                    <span className="site-menu__ico">
                      <NavIcon name={glavnoe.icon} />
                    </span>
                    <span className="site-menu__text">
                      <span className="site-menu__label">{glavnoe.label}</span>
                      <span className="site-menu__hint">{glavnoe.hint}</span>
                    </span>
                    <Chevron />
                  </a>

                  {groups.map((group, index) => (
                    <section
                      key={group.label}
                      className="site-menu__group"
                      style={{ '--i': index + 1 } as CSSProperties}
                    >
                      <h2 className="site-menu__title">{group.label}</h2>
                      <div className="site-menu__list">
                        {group.items.map((link) => (
                          <Row key={link.href + link.label} link={link} onClick={close} />
                        ))}
                      </div>
                    </section>
                  ))}

                  <div
                    className="site-menu__group site-menu__list site-menu__list--accent"
                    style={{ '--i': groups.length + 1 } as CSSProperties}
                  >
                    <Row link={tarify} onClick={close} />
                  </div>

                  {account || withLogout ? (
                    <section
                      className="site-menu__group"
                      style={{ '--i': groups.length + 2 } as CSSProperties}
                    >
                      <h2 className="site-menu__title">{akkaunt}</h2>
                      <div className="site-menu__list">
                        {account ? (
                          <a
                            href={account.href}
                            className="site-menu__row site-menu__row--plain"
                            onClick={close}
                          >
                            <span className="site-menu__label">{account.label}</span>
                            <Chevron />
                          </a>
                        ) : null}
                        {withLogout ? (
                          <LogoutItem
                            className="site-menu__row site-menu__row--plain site-menu__label"
                            onDone={close}
                          />
                        ) : null}
                      </div>
                    </section>
                  ) : null}
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
