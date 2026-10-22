'use client';

import { useRouter } from 'next/navigation';
import { useEffect, useId, useRef, useState } from 'react';
import { WELCOME, howtoHref } from '@/content/onboarding';
import { markWelcomeSeen, startTour, useOnboarding } from '@/lib/onboarding';

/** Через сколько после открытия страницы предложить окно. */
const DELAY_MS = 2500;
/** Если на странице уже открыто другое окно — подождать и проверить снова. */
const RETRY_MS = 2000;

/** Открыто ли на странице другое окно или меню. */
function somethingOpen(): boolean {
  return document.querySelector('[aria-modal="true"], .site-menu, .tour') !== null;
}

/**
 * Окно «Впервые здесь?». Один раз за всё время на этом устройстве:
 * через пару секунд после открытия страницы и не поверх другого окна.
 * Входа на сайте нет, поэтому «уже видел» помнит браузер.
 *
 * «Я репетитор» запускает тур. Тура для ученика пока нет — «Я ученик»
 * открывает инструкцию для ученика на странице «Как пользоваться».
 * На телефоне окно — нижний лист.
 */
export function Welcome({ allowed }: { allowed: boolean }) {
  const state = useOnboarding();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const panel = useRef<HTMLDivElement>(null);
  const titleId = useId();
  const leadId = useId();

  const eligible = allowed && !state.welcomeSeen && state.active === null;

  useEffect(() => {
    if (!eligible) return;
    let timer = window.setTimeout(function check() {
      if (somethingOpen()) {
        timer = window.setTimeout(check, RETRY_MS);
        return;
      }
      markWelcomeSeen();
      setOpen(true);
    }, DELAY_MS);
    return () => window.clearTimeout(timer);
  }, [eligible]);

  /* Esc закрывает, Tab не выходит из окна, фокус — в окно. */
  useEffect(() => {
    if (!open) return;
    const restore = document.activeElement as HTMLElement | null;
    panel.current?.focus();
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.preventDefault();
        setOpen(false);
        return;
      }
      if (event.key !== 'Tab' || panel.current === null) return;
      const nodes = Array.from(panel.current.querySelectorAll<HTMLElement>('a[href], button'));
      const first = nodes[0];
      const last = nodes[nodes.length - 1];
      if (first === undefined || last === undefined) return;
      if (
        event.shiftKey &&
        (document.activeElement === first || document.activeElement === panel.current)
      ) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('keydown', onKey);
      restore?.focus?.({ preventScroll: true });
    };
  }, [open]);

  if (!open) return null;

  return (
    <div className="welcome" role="presentation" onMouseDown={() => setOpen(false)}>
      <div
        ref={panel}
        className="welcome__panel"
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        aria-describedby={leadId}
        tabIndex={-1}
        onMouseDown={(event) => event.stopPropagation()}
      >
        <span className="welcome__grip" aria-hidden="true" />
        <button
          type="button"
          className="welcome__close"
          aria-label={WELCOME.close}
          onClick={() => setOpen(false)}
        >
          <svg viewBox="0 0 24 24" aria-hidden="true">
            <path d="M6 6l12 12M18 6 6 18" />
          </svg>
        </button>

        <p className="welcome__eyebrow">{WELCOME.eyebrow}</p>
        <h2 className="welcome__title" id={titleId}>
          {WELCOME.title}
        </h2>
        <p className="welcome__lead" id={leadId}>
          {WELCOME.lead}
        </p>

        <div className="welcome__choices">
          <button
            type="button"
            className="welcome__choice"
            onClick={() => {
              setOpen(false);
              router.push(howtoHref('uchenik'));
            }}
          >
            <span className="welcome__icon" aria-hidden="true">
              <svg viewBox="0 0 24 24">
                <path d="M2.5 9.5 12 5l9.5 4.5L12 14z" />
                <path d="M6.5 11.5v4c1.5 1.5 3.4 2.2 5.5 2.2s4-.7 5.5-2.2v-4M21.5 9.5v5" />
              </svg>
            </span>
            <span className="welcome__choice-title">{WELCOME.student.title}</span>
            <span className="welcome__choice-text">{WELCOME.student.text}</span>
            <span className="welcome__arrow" aria-hidden="true">
              →
            </span>
          </button>
          <button
            type="button"
            className="welcome__choice"
            onClick={() => {
              setOpen(false);
              startTour('repetitor', 0);
            }}
          >
            <span className="welcome__icon" aria-hidden="true">
              <svg viewBox="0 0 24 24">
                <circle cx="9" cy="8" r="3.2" />
                <path d="M3 19c.6-3.3 3-5.2 6-5.2s5.4 1.9 6 5.2" />
                <circle cx="17" cy="9" r="2.4" />
                <path d="M16.5 13.9c2.4.2 4.1 1.8 4.5 4.6" />
              </svg>
            </span>
            <span className="welcome__choice-title">{WELCOME.tutor.title}</span>
            <span className="welcome__choice-text">{WELCOME.tutor.text}</span>
            <span className="welcome__arrow" aria-hidden="true">
              →
            </span>
          </button>
        </div>

        <button type="button" className="welcome__later" onClick={() => setOpen(false)}>
          {WELCOME.later}
        </button>
      </div>
    </div>
  );
}
