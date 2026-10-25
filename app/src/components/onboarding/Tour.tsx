'use client';

import { clsx } from 'clsx';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useCallback, useEffect, useId, useRef, useState, useSyncExternalStore } from 'react';
import { TOURS, TOUR_UI, type Tour as TourData } from '@/content/onboarding';
import { finishTour, pauseTour, setTourStep, startTour, useOnboarding } from '@/lib/onboarding';

/**
 * Тур по сайту. Описывается данными (content/onboarding.ts): страница,
 * что подсветить, заголовок и текст шага. Тур сам переходит на страницу
 * шага, ждёт нужный элемент, прокручивает к нему с поправкой на липкую
 * ленту вкладок и ставит подсказку туда, где хватает места.
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

interface Box {
  top: number;
  left: number;
  width: number;
  height: number;
}

/** Отступ рамки подсветки от элемента. */
const PAD = 8;
/** Отступ подсказки от рамки и от краёв экрана. */
const GAP = 16;
/** Сколько ждать элемент шага, прежде чем показать подсказку без подсветки. */
const WAIT_MS = 4000;

const slash = (p: string) => (p.endsWith('/') ? p : `${p}/`);

function sameBox(a: Box | null, b: Box | null): boolean {
  if (a === null || b === null) return a === b;
  return (
    Math.abs(a.top - b.top) < 0.5 &&
    Math.abs(a.left - b.left) < 0.5 &&
    Math.abs(a.width - b.width) < 0.5 &&
    Math.abs(a.height - b.height) < 0.5
  );
}

/** Общая рамка всех элементов шага; не нашлось хоть одного — null. */
function measure(selectors: readonly string[]): { box: Box; els: Element[] } | null {
  const els: Element[] = [];
  for (const sel of selectors) {
    const el = document.querySelector(sel);
    if (el === null) return null;
    els.push(el);
  }
  let top = Infinity;
  let left = Infinity;
  let right = -Infinity;
  let bottom = -Infinity;
  for (const el of els) {
    const r = el.getBoundingClientRect();
    if (r.width === 0 && r.height === 0) return null;
    top = Math.min(top, r.top);
    left = Math.min(left, r.left);
    right = Math.max(right, r.right);
    bottom = Math.max(bottom, r.bottom);
  }
  return { box: { top, left, width: right - left, height: bottom - top }, els };
}

/**
 * Сколько места сверху займут липкие полосы, когда прилипнут: лента
 * вкладок раздела, шапка. Считается по их top и высоте, а не по
 * текущему положению: до прокрутки лента стоит посреди страницы.
 */
function stickyTop(): number {
  let h = 0;
  for (const el of document.querySelectorAll<HTMLElement>('.topic-tabs-row, .topbar, .site-head')) {
    const style = getComputedStyle(el);
    if (style.position !== 'sticky' && style.position !== 'fixed') continue;
    h = Math.max(h, (parseFloat(style.top) || 0) + el.offsetHeight);
  }
  return h;
}

function reducedMotion(): boolean {
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

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
    где хватает места; не хватает нигде — внизу по центру. */
function place(box: Box, w: number, h: number): Place {
  const vw = window.innerWidth;
  const vh = window.innerHeight;
  const clampX = (x: number) => Math.min(Math.max(x, GAP), vw - w - GAP);
  const clampY = (y: number) => Math.min(Math.max(y, GAP), vh - h - GAP);
  const top = box.top - PAD;
  const bottom = box.top + box.height + PAD;
  const left = box.left - PAD;
  const right = box.left + box.width + PAD;
  const sticky = stickyTop();
  if (vh - bottom >= h + GAP * 2) return { top: bottom + GAP, left: clampX(left) };
  if (top - sticky >= h + GAP * 2) return { top: top - GAP - h, left: clampX(left) };
  if (vw - right >= w + GAP * 2) return { top: clampY(top), left: right + GAP };
  if (left >= w + GAP * 2) return { top: clampY(top), left: left - GAP - w };
  return { top: vh - h - GAP, left: (vw - w) / 2 };
}

const samePlace = (a: Place | null, b: Place | null) =>
  a === null || b === null
    ? a === b
    : Math.abs(a.top - b.top) < 0.5 && Math.abs(a.left - b.left) < 0.5;

function TourRun({ tour, step }: { tour: TourData; step: number }) {
  const router = useRouter();
  const pathname = usePathname();
  const total = tour.steps.length + 1;
  const isFinal = step >= tour.steps.length;
  const current = isFinal ? null : (tour.steps[step] ?? null);

  const [found, setFound] = useState<Box | null>(null);
  const [settled, setSettled] = useState(false);
  const [pos, setPos] = useState<Place | null>(null);
  const narrow = useNarrow();
  /* На финале подсвечивать нечего: карточка по центру сразу. */
  const box = isFinal ? null : found;
  const ready = isFinal || settled;
  const card = useRef<HTMLDivElement>(null);
  const pushedFor = useRef<number | null>(null);
  const titleId = useId();
  const textId = useId();

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

  /* Найти элемент шага, прокрутить к нему и дальше следить за ним
     каждый кадр: страница может доезжать, лента — прилипать. */
  useEffect(() => {
    if (current === null) return;
    if (slash(pathname) !== slash(current.href)) return;
    let frame = 0;
    let scrolled = false;
    let settleAt = 0;
    const started = performance.now();
    const tick = () => {
      const hit = current.target.length > 0 ? measure(current.target) : null;
      const now = performance.now();
      if (hit !== null && !scrolled) {
        scrolled = true;
        const inSticky = hit.els.some((el) => el.closest('.topic-tabs-row') !== null);
        const offset = stickyTop() + (window.innerWidth < 768 ? 12 : 24);
        const top = inSticky ? 0 : Math.max(0, hit.box.top + window.scrollY - offset - PAD);
        const smooth = !reducedMotion();
        window.scrollTo({ top, behavior: smooth ? 'smooth' : 'auto' });
        settleAt = now + (smooth ? 450 : 50);
      }
      if (hit !== null) {
        setFound((prev) => (sameBox(prev, hit.box) ? prev : hit.box));
        const el = card.current;
        if (el !== null && !window.matchMedia(NARROW).matches) {
          const next = place(hit.box, el.offsetWidth, el.offsetHeight);
          setPos((prev) => (samePlace(prev, next) ? prev : next));
        }
        if (now >= settleAt) setSettled(true);
      } else if (now - started > WAIT_MS || current.target.length === 0) {
        /* Элемента нет — подсказка по центру, без подсветки. */
        setFound(null);
        setPos(null);
        setSettled(true);
      }
      frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [current, pathname]);

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

  const hole =
    box !== null && ready
      ? {
          top: box.top - PAD,
          left: box.left - PAD,
          width: box.width + PAD * 2,
          height: box.height + PAD * 2,
        }
      : null;

  return (
    <div className="tour" data-tour-step={isFinal ? 'final' : current?.id}>
      {/* Слой ловит нажатия мимо: тур ведёт сам, страница под ним не
          должна уезжать по случайному клику. */}
      <div className={clsx('tour__veil', hole === null && 'tour__veil--dim')} aria-hidden="true" />
      {hole !== null ? <div className="tour__hole" style={hole} aria-hidden="true" /> : null}

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
          !narrow && !isFinal && pos === null && 'tour-card--center',
          !ready && 'is-hidden',
        )}
        style={!narrow && !isFinal && pos !== null ? { top: pos.top, left: pos.left } : undefined}
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
