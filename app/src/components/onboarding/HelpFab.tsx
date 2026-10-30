'use client';

import Link from 'next/link';
import { useCallback, useId, useRef, useState } from 'react';
import { HELP, HOWTO_HREF } from '@/content/onboarding';
import { useDismiss } from '@/lib/dismiss';
import { requestIntro, useOnboarding } from '@/lib/onboarding';
import { TourButtons } from './TourButtons';

/**
 * Кнопка «?» в правом нижнем углу: туры (начать, продолжить с того же
 * шага, начать заново) и инструкция. Пока идёт тур,
 * кнопки нет — тур закрывается своим крестиком. На телефоне в кабинете
 * кнопка стоит над нижней панелью навигации (onboarding.css).
 */
export function HelpFab() {
  const state = useOnboarding();
  const [open, setOpen] = useState(false);
  const root = useRef<HTMLDivElement>(null);
  const button = useRef<HTMLButtonElement>(null);
  const menuId = useId();
  const close = useCallback(() => setOpen(false), []);
  useDismiss({ open, onClose: close, menu: root, trigger: button });

  if (state.active !== null) return null;

  return (
    <div className="help-fab" ref={root}>
      {open ? (
        <div className="help-fab__menu" id={menuId} role="menu" aria-label={HELP.title}>
          <TourButtons className="help-fab__item" menuitem onRun={() => setOpen(false)} />
          <button
            type="button"
            role="menuitem"
            className="help-fab__item"
            onClick={() => {
              setOpen(false);
              requestIntro();
            }}
          >
            {HELP.intro}
          </button>
          <Link
            role="menuitem"
            className="help-fab__item"
            href={HOWTO_HREF}
            onClick={() => setOpen(false)}
          >
            {HELP.howto}
          </Link>
        </div>
      ) : null}
      <button
        ref={button}
        type="button"
        className="help-fab__button"
        aria-label={HELP.button}
        aria-expanded={open}
        aria-controls={open ? menuId : undefined}
        aria-haspopup="menu"
        onClick={() => setOpen(!open)}
      >
        <svg viewBox="0 0 24 24" aria-hidden="true">
          <path d="M9.2 9.3a2.9 2.9 0 0 1 5.6 1c0 1.9-2.8 2.4-2.8 4.2" />
          <circle cx="12" cy="18" r="0.6" />
        </svg>
      </button>
    </div>
  );
}
