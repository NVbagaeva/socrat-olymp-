'use client';

import { useEffect } from 'react';
import type { RefObject } from 'react';

/** Безопасная зона сверху (чёлка iPhone) в пикселях. */
function safeTop(): number {
  const probe = document.createElement('div');
  probe.style.cssText =
    'position:fixed;top:0;height:env(safe-area-inset-top,0px);visibility:hidden;pointer-events:none';
  document.body.appendChild(probe);
  const value = probe.getBoundingClientRect().height;
  probe.remove();
  return value;
}

function attach(strip: HTMLElement, row: HTMLElement, slot: HTMLElement, page: HTMLElement) {
  let stuck = false;
  /* Высота компактной строки: от неё считается, когда её показывать
     и сколько места она закрывает сверху. */
  let compact = 0;
  let observer: IntersectionObserver | null = null;
  let frame = 0;

  function revealActive(): void {
    const active = strip.querySelector<HTMLElement>('[aria-selected="true"]');
    if (active === null || strip.scrollWidth <= strip.clientWidth) {
      return;
    }
    const box = strip.getBoundingClientRect();
    const rect = active.getBoundingClientRect();
    if (rect.left < box.left) {
      strip.scrollLeft += rect.left - box.left - 16;
    } else if (rect.right > box.right) {
      strip.scrollLeft += rect.right - box.right + 16;
    }
  }

  /* Закреплённая строка — position: fixed: встаёт ровно над колонкой
     страницы, где лежит её место (с сайдбаром и без). */
  function place(): void {
    const box = slot.getBoundingClientRect();
    row.style.left = `${box.left}px`;
    row.style.width = `${box.width}px`;
  }

  function unplace(): void {
    row.style.removeProperty('left');
    row.style.removeProperty('width');
  }

  /* Высота компактной строки. Пока лента стоит плитками, строку не
     видно — её примеряют на миг, в одной задаче, без отрисовки.
     Место ленты на это время держит свою высоту. */
  function measure(): void {
    if (stuck) {
      compact = row.getBoundingClientRect().height;
      return;
    }
    slot.style.minHeight = `${slot.getBoundingClientRect().height}px`;
    row.classList.add('is-stuck', 'is-measuring');
    place();
    compact = row.getBoundingClientRect().height;
    row.classList.remove('is-stuck', 'is-measuring');
    unplace();
    slot.style.removeProperty('min-height');
  }

  /* Высота, которую закрывает строка сверху: от неё отсчитываются
     полоса «Содержание», колонка содержания и отступ заголовка при
     переходе по якорю. Пока строки нет, пишем её будущую высоту:
     после перехода по якорю строка появится и закроет ровно её. */
  function publish(): void {
    const bottom = stuck ? row.getBoundingClientRect().bottom : safeTop() + compact;
    page.style.setProperty('--topic-sticky-top', `${Math.round(bottom)}px`);
  }

  function setStuck(next: boolean): void {
    if (next === stuck) {
      return;
    }
    if (next) {
      /* Место ленты не схлопывается: страница под ней не сдвигается.
         Оно в эту минуту целиком выше экрана — пустоты не видно. */
      slot.style.minHeight = `${slot.getBoundingClientRect().height}px`;
      place();
      row.classList.add('is-stuck');
    } else {
      row.classList.remove('is-stuck');
      unplace();
      slot.style.removeProperty('min-height');
    }
    stuck = next;
    revealActive();
    publish();
  }

  /* Строка появляется, когда плитки целиком ушли под её будущую
     высоту — за верх видимой области. Обратно — как только место
     ленты снова показалось из-под строки. */
  function observe(): void {
    observer?.disconnect();
    const top = Math.max(0, Math.round(safeTop() + compact));
    observer = new IntersectionObserver(
      (entries) => {
        const entry = entries[entries.length - 1];
        if (entry === undefined) {
          return;
        }
        const above = !entry.isIntersecting && entry.boundingClientRect.bottom <= top + 1;
        setStuck(above);
      },
      { rootMargin: `-${top}px 0px 0px 0px`, threshold: 0 },
    );
    observer.observe(slot);
  }

  function relayout(): void {
    frame = 0;
    measure();
    if (stuck) {
      place();
    }
    observe();
    publish();
  }

  function schedule(): void {
    if (frame === 0) {
      frame = window.requestAnimationFrame(relayout);
    }
  }

  relayout();
  window.addEventListener('resize', schedule);
  /* Шрифты меняют высоту плиток и строки. */
  void document.fonts?.ready.then(schedule);
  return () => {
    observer?.disconnect();
    window.removeEventListener('resize', schedule);
    if (frame !== 0) {
      window.cancelAnimationFrame(frame);
    }
    row.classList.remove('is-stuck');
    unplace();
    slot.style.removeProperty('min-height');
    page.style.removeProperty('--topic-sticky-top');
  };
}

/**
 * Лента вкладок раздела (.topic-tabs-row) — общая для всех разделов.
 *
 * Пока лента в кадре, она — большое меню плитками и прокручивается
 * вместе со страницей, как обычный текст. Когда меню целиком ушло за
 * верх экрана, сверху плавно появляется компактная закреплённая
 * строка тех же вкладок (класс is-stuck, position: fixed). При
 * прокрутке назад строка уходит, как только место меню показалось.
 *
 * Место меню в потоке (.topic-tabs-slot) держит свою высоту, пока
 * строка закреплена: страница не прыгает. А видно его никогда не
 * бывает — строка появляется только когда оно уже выше экрана.
 *
 * Раньше лента прилипала, едва верх меню доходил до верха экрана,
 * и сворачивалась в строку; место плиток держал пустой отступ — под
 * строкой оставалась пустая полоса в 500–700px.
 *
 * Ещё хук пишет в --topic-sticky-top высоту, которую закрывает
 * строка (полоса «Содержание», якоря), и подводит активную вкладку
 * в видимую часть строки.
 *
 * stripRef — сама лента (.topic-tabs); строка — её родитель, место —
 * родитель строки.
 */
export function useStickyTabs(stripRef: RefObject<HTMLElement | null>): void {
  useEffect(() => {
    const strip = stripRef.current;
    const row = strip?.parentElement ?? null;
    const slot = row?.parentElement ?? null;
    const page = slot?.parentElement ?? null;
    if (strip === null || row === null || slot === null || page === null) {
      return undefined;
    }
    return attach(strip, row, slot, page);
  }, [stripRef]);
}
