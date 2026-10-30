'use client';

import { useEffect, useState } from 'react';
import type { RefObject } from 'react';

/**
 * Подсветка шага тура: где цель, как подвести к ней страницу и как
 * держать на ней рамку. Общая для всех туров (Tour.tsx).
 *
 * Одна система координат: рамка и карточка — position: fixed, место —
 * из getBoundingClientRect цели, заново на каждом кадре, пока что-то
 * двигается. Прокрутка окна и вложенных лент, смена размеров окна,
 * адресная строка iOS (visualViewport), размеры цели (ResizeObserver),
 * правки страницы (MutationObserver) и переходы CSS (липкая панель
 * вкладок проявляется со сдвигом) будят цикл requestAnimationFrame;
 * он крутится, пока рамка не простоит на месте несколько кадров.
 * Место пишется прямо в стиль, мимо состояния React: отрисовка React
 * шла бы отдельной задачей, после кадра, и рамка отставала бы.
 *
 * Вкладки раздела нарисованы двумя копиями (плитки и липкая панель,
 * components/tasks/TabsRow.tsx), скрытая копия — inert и aria-hidden.
 * Цель — всегда видимая копия: прилипла панель — рамка на панели.
 * Рамка охватывает видимую часть цели: что обрезала лента с прокруткой
 * вбок, то не обводится.
 */

/** Отступ рамки от цели. */
export const PAD = 8;
/** Сколько ждать цель, прежде чем показать подсказку без подсветки. */
const WAIT_MS = 4000;
/** Дольше плавная прокрутка к шагу не ждётся. */
const SCROLL_MS = 1500;
/** Цикл слежения стоит, когда рамка не двигалась столько кадров. */
const STILL_FRAMES = 10;
/** Отступ цели во вложенной ленте от её края: там растушёвка (TabsRow). */
const INNER_GAP = 32;

export interface Box {
  top: number;
  left: number;
  width: number;
  height: number;
}

/** Сколько места сверху и снизу экрана закрывают липкие полосы. */
export interface Occlusion {
  top: number;
  bottom: number;
}

export function sameBox(a: Box | null, b: Box | null): boolean {
  if (a === null || b === null) return a === b;
  return (
    Math.abs(a.top - b.top) < 0.25 &&
    Math.abs(a.left - b.left) < 0.25 &&
    Math.abs(a.width - b.width) < 0.25 &&
    Math.abs(a.height - b.height) < 0.25
  );
}

function shown(el: Element): boolean {
  return (
    el.closest('[inert], [aria-hidden="true"]') === null &&
    el.getClientRects().length > 0 &&
    getComputedStyle(el).visibility !== 'hidden'
  );
}

/**
 * Элементы шага — по одному на селектор, видимая копия; нет хоть
 * одного — null. Скрытую копию берём, только если видимой нет вовсе.
 */
export function resolveTargets(selectors: readonly string[]): Element[] | null {
  const els: Element[] = [];
  for (const sel of selectors) {
    const all = Array.from(document.querySelectorAll(sel));
    const el = all.find(shown) ?? all.find((e) => e.getClientRects().length > 0);
    if (el === undefined) return null;
    els.push(el);
  }
  return els;
}

/** Общая рамка элементов; все нулевого размера — null. */
export function unionBox(els: readonly Element[]): Box | null {
  let top = Infinity;
  let left = Infinity;
  let right = -Infinity;
  let bottom = -Infinity;
  for (const el of els) {
    const r = el.getBoundingClientRect();
    if (r.width === 0 && r.height === 0) continue;
    top = Math.min(top, r.top);
    left = Math.min(left, r.left);
    right = Math.max(right, r.right);
    bottom = Math.max(bottom, r.bottom);
  }
  return top === Infinity ? null : { top, left, width: right - left, height: bottom - top };
}

/**
 * Видимая часть цели: прямоугольник, обрезанный предками с overflow
 * (лента вкладок и ряд пресетов прокручиваются вбок). По ней стоит
 * рамка — там, где цель видна на экране. Не видно ничего — null.
 */
export function visibleBox(els: readonly Element[]): Box | null {
  let top = Infinity;
  let left = Infinity;
  let right = -Infinity;
  let bottom = -Infinity;
  for (const el of els) {
    const r = el.getBoundingClientRect();
    let t = r.top;
    let l = r.left;
    let rr = r.right;
    let b = r.bottom;
    for (let p = el.parentElement; p !== null && p !== document.body; p = p.parentElement) {
      const s = getComputedStyle(p);
      if (s.position === 'fixed') break;
      const cx = s.overflowX !== 'visible';
      const cy = s.overflowY !== 'visible';
      if (!cx && !cy) continue;
      const pr = p.getBoundingClientRect();
      if (cx) {
        l = Math.max(l, pr.left);
        rr = Math.min(rr, pr.right);
      }
      if (cy) {
        t = Math.max(t, pr.top);
        b = Math.min(b, pr.bottom);
      }
    }
    if (rr - l < 1 || b - t < 1) continue;
    top = Math.min(top, t);
    left = Math.min(left, l);
    right = Math.max(right, rr);
    bottom = Math.max(bottom, b);
  }
  return top === Infinity ? null : { top, left, width: right - left, height: bottom - top };
}

/**
 * Липкие и закреплённые полосы во всю ширину, которые встанут над
 * целью или под ней: шапка, панель вкладок, полоса фильтров генератора,
 * нижняя панель. Считается по их CSS top/bottom и высоте, а не по
 * текущему месту: до прокрутки панель вкладок ещё скрыта, а полоса
 * фильтров стоит посреди страницы. Липкая полоса считается, только
 * если её блок дотягивается до цели — иначе она уедет вместе с ним.
 */
export function occlusion(els: readonly Element[], tour: Element | null): Occlusion {
  const vw = window.innerWidth;
  const vh = window.innerHeight;
  const y = window.scrollY;
  const box = unionBox(els);
  const docTop = box === null ? y : box.top + y;
  const docBottom = box === null ? y : box.top + box.height + y;
  let top = 0;
  let bottom = 0;
  for (const el of document.body.querySelectorAll<HTMLElement>('*')) {
    const s = getComputedStyle(el);
    if (s.position !== 'sticky' && s.position !== 'fixed') continue;
    if (s.display === 'none') continue;
    const h = el.offsetHeight;
    if (h === 0 || h > vh * 0.4 || el.offsetWidth < vw * 0.5) continue;
    if (tour?.contains(el) || els.some((t) => el.contains(t) || t.contains(el))) continue;
    if (s.position === 'sticky') {
      const parent = el.parentElement?.getBoundingClientRect();
      if (parent === undefined || parent.top + y > docBottom || parent.bottom + y < docTop) {
        continue;
      }
    }
    /* У закреплённой top и bottom в стиле — уже пиксели, поэтому
       сторону видно по месту: offsetTop, без сдвига на время перехода
       (скрытая панель вкладок приподнята). У липкой — по заданной
       стороне: незаданная остаётся auto. */
    let atTop: boolean;
    if (s.position === 'fixed') {
      atTop = el.offsetTop + h / 2 < vh / 2;
    } else if (s.top !== 'auto') {
      atTop = true;
    } else if (s.bottom !== 'auto') {
      atTop = false;
    } else {
      continue;
    }
    if (atTop) {
      if (s.position === 'sticky' && el.getBoundingClientRect().top + y > docTop) continue;
      const at = s.position === 'fixed' ? el.offsetTop : parseFloat(s.top) || 0;
      top = Math.max(top, at + h);
    } else if (s.visibility !== 'hidden') {
      const at = s.position === 'fixed' ? vh - el.offsetTop - h : parseFloat(s.bottom) || 0;
      bottom = Math.max(bottom, at + h);
    }
  }
  return { top, bottom };
}

function inFixed(el: Element): boolean {
  for (let p: Element | null = el; p !== null; p = p.parentElement) {
    if (getComputedStyle(p).position === 'fixed') return true;
  }
  return false;
}

/** Подвести цель в видимую часть вложенных лент (лента вкладок вбок). */
function revealInScrollers(els: readonly Element[]): void {
  const first = els[0];
  if (first === undefined) return;
  for (let p = first.parentElement; p !== null && p !== document.body; p = p.parentElement) {
    const s = getComputedStyle(p);
    const sy = /auto|scroll|overlay/.test(s.overflowY) && p.scrollHeight > p.clientHeight + 1;
    const sx = /auto|scroll|overlay/.test(s.overflowX) && p.scrollWidth > p.clientWidth + 1;
    if (!sx && !sy) continue;
    const inside = unionBox(els.filter((el) => p!.contains(el)));
    if (inside === null) continue;
    const pr = p.getBoundingClientRect();
    const fit = (start: number, size: number, from: number, to: number) => {
      if (start < from + INNER_GAP) return start - from - INNER_GAP;
      if (start + size > to - INNER_GAP) {
        return Math.min(start + size - to + INNER_GAP, start - from - INNER_GAP);
      }
      return 0;
    };
    if (sy) p.scrollTop += fit(inside.top, inside.height, pr.top, pr.bottom);
    if (sx) p.scrollLeft += fit(inside.left, inside.width, pr.left, pr.right);
  }
}

/** Дождаться, пока прокрутка окна встанет: scrollend или несколько кадров на месте. */
function settle(targetY: number, alive: () => boolean): Promise<void> {
  return new Promise((resolve) => {
    const start = performance.now();
    let last = window.scrollY;
    let still = 0;
    let frame = 0;
    const done = () => {
      window.removeEventListener('scrollend', done);
      cancelAnimationFrame(frame);
      resolve();
    };
    window.addEventListener('scrollend', done);
    const tick = () => {
      const y = window.scrollY;
      still = Math.abs(y - last) < 0.5 ? still + 1 : 0;
      last = y;
      if (
        !alive() ||
        (Math.abs(y - targetY) < 1 && still >= 2) ||
        still >= 12 ||
        performance.now() - start > SCROLL_MS
      ) {
        done();
        return;
      }
      frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
  });
}

const nextFrame = () => new Promise<void>((r) => requestAnimationFrame(() => r()));

export interface SpotlightOptions {
  /** Селекторы шага; null — шаг ещё не на своей странице или финал. */
  selectors: readonly string[] | null;
  /** Корень тура: в data-spot пишется, есть ли сейчас подсветка. */
  root: RefObject<HTMLElement | null>;
  hole: RefObject<HTMLElement | null>;
  card: RefObject<HTMLElement | null>;
  /** Подсказка — нижний лист (телефон). */
  sheet: boolean;
  /** Каждый кадр, когда рамка сдвинулась: поставить карточку. */
  onBox?: (box: Box | null, occ: Occlusion) => void;
}

export interface Spotlight {
  /** Страница подведена, можно показывать подсказку. */
  ready: boolean;
  /** Нижний лист переехал наверх: снизу цель он закрыл бы. */
  sheetOnTop: boolean;
}

export function useSpotlight({
  selectors,
  root,
  hole,
  card,
  sheet,
  onBox,
}: SpotlightOptions): Spotlight {
  const [state, setState] = useState<Spotlight>({ ready: false, sheetOnTop: false });

  useEffect(() => {
    if (selectors === null) return undefined;
    let alive = true;
    const isAlive = () => alive;
    const stops: (() => void)[] = [];
    const tour = root.current;

    const setSpot = (on: boolean) => {
      tour?.setAttribute('data-spot', on ? 'on' : 'off');
    };
    setSpot(false);

    /** Подвести цель под липкие полосы, над подсказкой. */
    const bringIntoView = (els: Element[], smooth: boolean): { y: number; onTop: boolean } => {
      revealInScrollers(els);
      const box = unionBox(els);
      if (box === null || inFixed(els[0]!)) return { y: window.scrollY, onTop: false };
      const vh = window.innerHeight;
      const occ = occlusion(els, tour);
      const gap = sheet ? 12 : 24;
      const sheetH = sheet ? (card.current?.offsetHeight ?? 0) : 0;
      const need = box.height + 2 * PAD + 2 * gap;
      /* Свободная полоса: лист снизу — между липкими полосами и листом;
         лист сверху — между листом и низом экрана. */
      const below = { from: occ.top, to: vh - Math.max(occ.bottom, sheetH) };
      const above = { from: Math.max(occ.top, sheetH), to: vh - occ.bottom };
      const max = document.documentElement.scrollHeight - vh;
      const y0 = window.scrollY;
      const plan = (free: { from: number; to: number }) => {
        const inView =
          box.top - PAD - gap >= free.from && box.top + box.height + PAD + gap <= free.to;
        const wanted = inView ? y0 : y0 + box.top - (free.from + PAD + gap);
        const y = Math.min(Math.max(0, Math.round(wanted)), Math.max(0, max));
        const top = box.top - (y - y0);
        const fits = need <= free.to - free.from;
        const visible = top - PAD >= free.from - 1 && top + box.height + PAD <= free.to + 1;
        return { y, fits, visible };
      };
      let onTop = false;
      let target = plan(below);
      if (sheet && !(target.fits && target.visible)) {
        const alt = plan(above);
        if (alt.fits && alt.visible) {
          target = alt;
          onTop = true;
        }
      }
      if (Math.abs(target.y - y0) >= 1) {
        window.scrollTo({ top: target.y, behavior: smooth ? 'smooth' : 'instant' });
      }
      return { y: target.y, onTop };
    };

    /* Слежение: цикл кадров, который будят события. */
    let frame = 0;
    let still = 0;
    let last: Box | null = null;
    /* Перерисовать, даже если рамка на месте: сменились окно и полосы. */
    let dirty = true;
    let lastEls: Element[] = [];
    let occ: Occlusion = { top: 0, bottom: 0 };
    let tracking = false;
    const sizes = new ResizeObserver(() => pump());
    const tick = () => {
      frame = 0;
      const els = resolveTargets(selectors) ?? [];
      if (els.length !== lastEls.length || els.some((el, i) => el !== lastEls[i])) {
        lastEls.forEach((el) => sizes.unobserve(el));
        els.forEach((el) => sizes.observe(el));
        /* Другая копия (прилипла панель вкладок): её лента прокручена
           по-своему — подводим цель и в ней. */
        if (lastEls.length > 0 && els.length > 0) revealInScrollers(els);
        lastEls = els;
      }
      const box = els.length > 0 ? visibleBox(els) : null;
      if (!dirty && sameBox(box, last)) {
        still += 1;
      } else {
        still = 0;
        dirty = false;
        last = box;
        const el = hole.current;
        if (box !== null && el !== null) {
          el.style.setProperty('top', `${box.top - PAD}px`);
          el.style.setProperty('left', `${box.left - PAD}px`);
          el.style.setProperty('width', `${box.width + PAD * 2}px`);
          el.style.setProperty('height', `${box.height + PAD * 2}px`);
        }
        setSpot(box !== null);
        onBox?.(box, occ);
      }
      if (still < STILL_FRAMES) frame = requestAnimationFrame(tick);
    };
    function pump() {
      if (!tracking) return;
      still = 0;
      if (frame === 0) frame = requestAnimationFrame(tick);
    }
    const remeasure = () => {
      occ = occlusion(lastEls, tour);
      dirty = true;
      pump();
    };

    const startTracking = (els: Element[]) => {
      tracking = true;
      lastEls = els;
      els.forEach((el) => sizes.observe(el));
      sizes.observe(document.documentElement);
      if (card.current !== null) sizes.observe(card.current);
      occ = occlusion(els, tour);
      const opts = { capture: true, passive: true } as const;
      const vv = window.visualViewport;
      window.addEventListener('scroll', pump, opts);
      window.addEventListener('resize', remeasure, opts);
      window.addEventListener('orientationchange', remeasure, opts);
      vv?.addEventListener('resize', remeasure, opts);
      vv?.addEventListener('scroll', pump, opts);
      /* Липкая панель проявляется переходом CSS, картинки догружаются. */
      const moving = ['transitionrun', 'transitionend', 'animationstart', 'animationend', 'load'];
      moving.forEach((type) => document.addEventListener(type, pump, opts));
      /* Правка страницы — сразу, не дожидаясь кадра: React меняет
         копию вкладок (aria-hidden) отдельной задачей между кадрами, и
         рамка должна переехать до ближайшей отрисовки. */
      const mutations = new MutationObserver((records) => {
        if (!records.some((r) => tour === null || !tour.contains(r.target))) return;
        cancelAnimationFrame(frame);
        still = 0;
        tick();
      });
      mutations.observe(document.body, {
        subtree: true,
        childList: true,
        attributes: true,
        attributeFilter: ['class', 'style', 'hidden', 'inert', 'aria-hidden', 'open'],
      });
      stops.push(() => {
        window.removeEventListener('scroll', pump, opts);
        window.removeEventListener('resize', remeasure, opts);
        window.removeEventListener('orientationchange', remeasure, opts);
        vv?.removeEventListener('resize', remeasure, opts);
        vv?.removeEventListener('scroll', pump, opts);
        moving.forEach((type) => document.removeEventListener(type, pump, opts));
        mutations.disconnect();
      });
      pump();
    };
    stops.push(() => {
      tracking = false;
      cancelAnimationFrame(frame);
      sizes.disconnect();
    });

    void (async () => {
      /* Цель может появиться не сразу: страница догружается. */
      const started = performance.now();
      let els = selectors.length > 0 ? resolveTargets(selectors) : null;
      while (
        alive &&
        els === null &&
        selectors.length > 0 &&
        performance.now() - started < WAIT_MS
      ) {
        await nextFrame();
        els = resolveTargets(selectors);
      }
      if (!alive) return;
      if (els === null) {
        /* Цели нет — подсказка без подсветки, по центру. */
        onBox?.(null, { top: 0, bottom: 0 });
        setState({ ready: true, sheetOnTop: false });
        return;
      }
      const smooth = !window.matchMedia('(prefers-reduced-motion: reduce)').matches;
      let { y, onTop } = bringIntoView(els, smooth);
      await settle(y, isAlive);
      /* Пока ехали, страница могла дорасти: поправить без анимации. */
      for (let i = 0; i < 2 && alive; i++) {
        await nextFrame();
        const now = resolveTargets(selectors);
        if (now === null) break;
        els = now;
        const again = bringIntoView(els, false);
        onTop = again.onTop;
        if (Math.abs(again.y - y) < 1) break;
        y = again.y;
      }
      if (!alive) return;
      startTracking(els);
      setState({ ready: true, sheetOnTop: onTop });
    })();

    return () => {
      alive = false;
      stops.forEach((stop) => stop());
    };
  }, [selectors, root, hole, card, sheet, onBox]);

  return selectors === null ? { ready: true, sheetOnTop: false } : state;
}
