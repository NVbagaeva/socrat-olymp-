'use client';

import { clsx } from 'clsx';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useCallback, useEffect, useId, useRef, useSyncExternalStore } from 'react';
import { TOURS, TOUR_UI, type Tour as TourData } from '@/content/onboarding';
import { finishTour, pauseTour, setTourStep, startTour, useOnboarding } from '@/lib/onboarding';
import { PAD, useSpotlight, type Box, type Occlusion } from './spotlight';

/**
 * Тур по сайту. Описывается данными (content/onboarding.ts): страница,
 * что подсветить, заголовок и текст шага. Тур сам переходит на страницу
 * шага, ждёт нужный элемент, прокручивает к нему с поправкой на липкие
 * полосы и подсказку и ставит подсказку туда, где хватает места. Рамку
 * подсветки ведёт spotlight.ts — кадр в кадр с целью.
 *
 * Шире 768px подсказка — карточка у элемента, уже — нижний лист.
 * От 1280px слева, поверх сайдбара, — панель «Как проходит тур?»:
 * справа на страницах тура стоят подсвечиваемые колонки (листы
 * генератора, быстрый лист), и панель закрывала бы их.
 */
export function Tour() {
  const state = useOnboarding();
  const id = state.active;
  if (id === null) return null;
  const step = state.tours[id]?.step ?? 0;
  /* Ключ с шагом: каждый шаг монтируется заново и начинает с чистого
     листа — без подсветки и позиции от прошлого шага. */
  return <TourRun key={`${id}:${step}`} tour={TOURS[id]} step={step} />;
}

/** Отступ подсказки от рамки и от краёв экрана. */
const GAP = 16;

const slash = (p: string) => (p.endsWith('/') ? p : `${p}/`);

const NARROW = '(max-width: 767.98px)';

function subscribeNarrow(onChange: () => void): () => void {
  const mq = window.matchMedia(NARROW);
  mq.addEventListener('change', onChange);
  return () => mq.removeEventListener('change', onChange);
}

/** Узкий экран — подсказка нижним листом. */
function useNarrow(): boolean {
  return useSyncExternalStore(
    subscribeNarrow,
    () => window.matchMedia(NARROW).matches,
    () => false,
  );
}

interface Place {
  top: number;
  left: number;
}

/** Куда поставить карточку: под элементом, над ним, справа, слева —
    где хватает места; не хватает нигде — внизу по центру. Сверху место
    считается от нижнего края липких полос. */
function place(box: Box, w: number, h: number, occ: Occlusion): Place {
  const vw = window.innerWidth;
  const vh = window.innerHeight - occ.bottom;
  const clampX = (x: number) => Math.min(Math.max(x, GAP), vw - w - GAP);
  const clampY = (y: number) => Math.min(Math.max(y, occ.top + GAP), vh - h - GAP);
  const top = box.top - PAD;
  const bottom = box.top + box.height + PAD;
  const left = box.left - PAD;
  const right = box.left + box.width + PAD;
  if (vh - bottom >= h + GAP * 2) return { top: bottom + GAP, left: clampX(left) };
  if (top - occ.top >= h + GAP * 2) return { top: top - GAP - h, left: clampX(left) };
  if (vw - right >= w + GAP * 2) return { top: clampY(top), left: right + GAP };
  if (left >= w + GAP * 2) return { top: clampY(top), left: left - GAP - w };
  return { top: vh - h - GAP, left: (vw - w) / 2 };
}

function TourRun({ tour, step }: { tour: TourData; step: number }) {
  const router = useRouter();
  const pathname = usePathname();
  const total = tour.steps.length + 1;
  const isFinal = step >= tour.steps.length;
  const current = isFinal ? null : (tour.steps[step] ?? null);

  const narrow = useNarrow();
  const root = useRef<HTMLDivElement>(null);
  const hole = useRef<HTMLDivElement>(null);
  const card = useRef<HTMLDivElement>(null);
  const pushedFor = useRef<number | null>(null);
  const titleId = useId();
  const textId = useId();

  /* Карточка у элемента (шире 768px) ставится тем же кадром, что и
     рамка, прямо в стиль; нижний лист стоит сам. */
  const onBox = useCallback(
    (box: Box | null, occ: Occlusion) => {
      const el = card.current;
      if (el === null || narrow) return;
      if (box === null) {
        el.dataset.place = 'center';
        el.style.removeProperty('top');
        el.style.removeProperty('left');
        return;
      }
      const at = place(box, el.offsetWidth, el.offsetHeight, occ);
      delete el.dataset.place;
      el.style.top = `${at.top}px`;
      el.style.left = `${at.left}px`;
    },
    [narrow],
  );

  const onPage = current !== null && slash(pathname) === slash(current.href);
  const selectors =
    current === null || !onPage
      ? null
      : narrow && current.narrowTarget !== undefined
        ? current.narrowTarget
        : current.target;
  const spot = useSpotlight({ selectors, root, hole, card, sheet: narrow, onBox });
  const ready = isFinal || (onPage && spot.ready);

  const go = useCallback(
    (to: number) => {
      if (to < 0) return;
      setTourStep(tour.id, Math.min(to, tour.steps.length));
    },
    [tour],
  );
  const close = useCallback(() => {
    if (isFinal) finishTour(tour.id);
    else pauseTour();
  }, [isFinal, tour.id]);

  /* Страница шага. Тур переходит на неё сам; если человек ушёл со
     страницы (кнопка «Назад» браузера), тур встаёт на паузу. */
  useEffect(() => {
    if (current === null) return;
    if (slash(pathname) === slash(current.href)) return;
    if (pushedFor.current !== step) {
      pushedFor.current = step;
      router.push(current.href);
    } else {
      pauseTour();
    }
  }, [current, pathname, router, step]);

  /* Фокус — в карточку шага: читалка экрана сразу читает заголовок. */
  useEffect(() => {
    if (ready) card.current?.focus({ preventScroll: true });
  }, [ready, step]);

  /* Клавиатура: стрелки — по шагам, Enter — дальше, Esc — закрыть.
     Tab не выходит из карточки. */
  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.preventDefault();
        close();
        return;
      }
      if (event.key === 'ArrowRight' && !isFinal) {
        event.preventDefault();
        go(step + 1);
        return;
      }
      if (event.key === 'ArrowLeft' && step > 0) {
        event.preventDefault();
        go(step - 1);
        return;
      }
      if (event.key === 'Enter' && !isFinal) {
        const el = document.activeElement;
        if (el instanceof HTMLButtonElement || el instanceof HTMLAnchorElement) return;
        event.preventDefault();
        go(step + 1);
        return;
      }
      if (event.key === 'Tab' && card.current !== null) {
        const nodes = Array.from(
          card.current.querySelectorAll<HTMLElement>('a[href], button:not([disabled])'),
        );
        const first = nodes[0];
        const last = nodes[nodes.length - 1];
        if (first === undefined || last === undefined) return;
        if (
          event.shiftKey &&
          (document.activeElement === first || document.activeElement === card.current)
        ) {
          event.preventDefault();
          last.focus();
        } else if (!event.shiftKey && document.activeElement === last) {
          event.preventDefault();
          first.focus();
        }
      }
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [close, go, isFinal, step]);

  return (
    <div
      ref={root}
      className="tour"
      data-tour-step={isFinal ? 'final' : current?.id}
      data-spot="off"
      data-ready={ready || undefined}
    >
      {/* Слой ловит нажатия мимо: тур ведёт сам, страница под ним не
          должна уезжать по случайному клику. */}
      <div className="tour__veil" aria-hidden="true" />
      <div ref={hole} className="tour__hole" aria-hidden="true" />

      <ol className="tour-panel" aria-label={TOUR_UI.panelTitle}>
        <li className="tour-panel__title" aria-hidden="true">
          {TOUR_UI.panelTitle}
        </li>
        {[...tour.steps.map((s) => s.short), tour.final.short].map((label, i) => (
          <li
            key={label}
            className={clsx('tour-panel__item', i === step && 'is-current', i < step && 'is-past')}
            aria-current={i === step ? 'step' : undefined}
          >
            <span className="tour-panel__no" aria-hidden="true">
              {i < step ? <Check /> : i + 1}
            </span>
            {label}
          </li>
        ))}
        <li className="tour-panel__note">{TOUR_UI.panelNote}</li>
      </ol>

      <div
        ref={card}
        className={clsx(
          'tour-card',
          narrow && 'tour-card--sheet',
          isFinal && 'tour-card--final',
          narrow && spot.sheetOnTop && !isFinal && 'tour-card--sheet-top',
          !ready && 'is-hidden',
        )}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        aria-describedby={textId}
        tabIndex={-1}
      >
        <button
          type="button"
          className="tour-card__close"
          aria-label={TOUR_UI.close}
          onClick={close}
        >
          <svg viewBox="0 0 24 24" aria-hidden="true">
            <path d="M6 6l12 12M18 6 6 18" />
          </svg>
        </button>

        <span className="tour-card__step">{TOUR_UI.step(step + 1, total)}</span>

        {isFinal ? (
          <>
            <span className="tour-card__done" aria-hidden="true">
              <Check />
            </span>
            <h2 className="tour-card__title" id={titleId}>
              {tour.final.title}
            </h2>
            <p className="tour-card__text" id={textId}>
              {tour.final.lead}
            </p>
            <div className="tour-card__skills">
              <p className="tour-card__skills-title">{tour.final.skillsTitle}</p>
              <ul>
                {tour.final.skills.map((s) => (
                  <li key={s}>
                    <span className="tour-card__tick" aria-hidden="true">
                      <Check />
                    </span>
                    {s}
                  </li>
                ))}
              </ul>
            </div>
            <div className="tour-card__foot tour-card__foot--final">
              <button
                type="button"
                className="btn btn--secondary"
                onClick={() => startTour(tour.id, 0)}
              >
                {tour.final.again}
              </button>
              <Link
                className="btn btn--primary"
                href={tour.final.go.href}
                onClick={() => finishTour(tour.id)}
              >
                {tour.final.go.label} →
              </Link>
            </div>
          </>
        ) : (
          <>
            <h2 className="tour-card__title" id={titleId}>
              {current?.title}
            </h2>
            <p className="tour-card__text" id={textId}>
              {current?.text}
            </p>
            <div className="tour-card__foot">
              <button
                type="button"
                className="btn btn--secondary"
                onClick={() => go(step - 1)}
                disabled={step === 0}
              >
                {TOUR_UI.back}
              </button>
              <span
                className="tour-card__dots"
                role="img"
                aria-label={TOUR_UI.step(step + 1, total)}
              >
                {Array.from({ length: total }, (_, i) => (
                  <span key={i} className={clsx('tour-card__dot', i === step && 'is-current')} />
                ))}
              </span>
              <button type="button" className="btn btn--primary" onClick={() => go(step + 1)}>
                {TOUR_UI.next}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

function Check() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="m5 12.5 4.5 4.5L19 7.5" />
    </svg>
  );
}
