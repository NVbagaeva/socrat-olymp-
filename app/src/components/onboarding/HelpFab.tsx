'use client';

import Link from 'next/link';
import { useCallback, useId, useRef, useState } from 'react';
import { HELP, HOWTO_HREF, TOUR_REPETITOR } from '@/content/onboarding';
import { useDismiss } from '@/lib/dismiss';
import { startTour, useOnboarding } from '@/lib/onboarding';

/**
 * Кнопка «?» в правом нижнем углу: туры и инструкция. Пока идёт тур,
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

  const tutor = state.tours.repetitor;
  const total = TOUR_REPETITOR.steps.length + 1;
  const inProgress = tutor !== undefined && !tutor.done && tutor.step > 0;

  const run = (step: number) => {
    setOpen(false);
    startTour('repetitor', step);
  };

  return (
    <div className="help-fab" ref={root}>
      {open ? (
        <div className="help-fab__menu" id={menuId} role="menu" aria-label={HELP.title}>
          {inProgress ? (
            <>
              <button
                type="button"
                role="menuitem"
                className="help-fab__item"
                onClick={() => run(tutor.step)}
              >
                {HELP.continueTour(tutor.step + 1, total)}
              </button>
              <button
                type="button"
                role="menuitem"
                className="help-fab__item"
                onClick={() => run(0)}
              >
                {HELP.restartTour}
              </button>
            </>
          ) : (
            <button type="button" role="menuitem" className="help-fab__item" onClick={() => run(0)}>
              {HELP.tutorTour}
            </button>
          )}
          <span
            className="help-fab__item help-fab__item--soon"
            role="menuitem"
            aria-disabled="true"
          >
            {HELP.studentTour}
            <span className="badge">{HELP.soon}</span>
          </span>
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
