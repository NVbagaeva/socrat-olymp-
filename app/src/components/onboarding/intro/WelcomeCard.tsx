'use client';

import { forwardRef } from 'react';
import { WELCOME_INTRO } from '@/content/onboarding';

export type WelcomeChoice = 'uchenik' | 'repetitor';

interface Props {
  titleId: string;
  leadId: string;
  sheet: boolean;
  shown: boolean;
  onChoose: (choice: WelcomeChoice) => void;
  onLater: () => void;
  onClose: () => void;
}

/**
 * Окно «Впервые здесь?» в оформлении заставки: светлая полупрозрачная
 * карточка (кадр 4), на телефоне — нижний лист с ручкой (кадр 5).
 * Пока идёт анимация, карточка уже в разметке, но скрыта: заставка
 * меряет её место, чтобы поставить цветок над ней.
 */
export const WelcomeCard = forwardRef<HTMLDivElement, Props>(function WelcomeCard(
  { titleId, leadId, sheet, shown, onChoose, onLater, onClose },
  ref,
) {
  return (
    <div
      ref={ref}
      className="intro-card"
      data-sheet={sheet ? '' : undefined}
      data-shown={shown ? '' : undefined}
      aria-hidden={shown ? undefined : true}
      tabIndex={-1}
      onMouseDown={(event) => event.stopPropagation()}
    >
      {sheet ? <span className="intro-card__grip" aria-hidden="true" /> : null}
      <button
        type="button"
        className="intro-card__close"
        aria-label={WELCOME_INTRO.close}
        tabIndex={shown ? 0 : -1}
        onClick={onClose}
      >
        <svg viewBox="0 0 24 24" aria-hidden="true">
          <path d="M6 6l12 12M18 6 6 18" />
        </svg>
      </button>
      <h2 className="intro-card__title" id={titleId}>
        {WELCOME_INTRO.title}
      </h2>
      <p className="intro-card__lead" id={leadId}>
        {WELCOME_INTRO.lead}
      </p>
      <div className="intro-card__choices">
        <button
          type="button"
          className="intro-card__go"
          tabIndex={shown ? 0 : -1}
          onClick={() => onChoose('uchenik')}
        >
          {WELCOME_INTRO.student}
          <Arrow />
        </button>
        <button
          type="button"
          className="intro-card__go"
          tabIndex={shown ? 0 : -1}
          onClick={() => onChoose('repetitor')}
        >
          {WELCOME_INTRO.tutor}
          <Arrow />
        </button>
      </div>
      <button
        type="button"
        className="intro-card__later"
        tabIndex={shown ? 0 : -1}
        onClick={onLater}
      >
        {WELCOME_INTRO.later}
      </button>
    </div>
  );
});

function Arrow() {
  return (
    <svg className="intro-card__arrow" viewBox="0 0 24 24" aria-hidden="true">
      <path d="M4 12h15M13 6l6 6-6 6" />
    </svg>
  );
}
