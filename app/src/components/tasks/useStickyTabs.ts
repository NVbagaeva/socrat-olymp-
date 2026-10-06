'use client';

import { useEffect } from 'react';
import type { RefObject } from 'react';

/* Ширина, ниже которой закреплённая лента становится компактной —
   ярус телефона, как в styles/components.css. */
const PHONE = '(max-width: 767.98px)';

function attach(strip: HTMLElement, row: HTMLElement, page: HTMLElement): () => void {
  const phone = window.matchMedia(PHONE);
  let stuck = false;
  let frame = 0;

  /* Где лента стояла бы без липкости: под предыдущим соседом или у
     верхнего поля страницы. Её собственный прямоугольник не годится —
     у прилипшей ленты он всегда у верха экрана. */
  function naturalTop(): number {
    const before = row.previousElementSibling;
    const margin = parseFloat(getComputedStyle(row).marginTop) || 0;
    if (before !== null) {
      return before.getBoundingClientRect().bottom + margin;
    }
    return page.getBoundingClientRect().top + (parseFloat(getComputedStyle(page).paddingTop) || 0);
  }

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

  /* Высота ленты в обычном виде: её помнят, пока лента не прилипла,
     и по ней считают отступ компактной. */
  let full = row.getBoundingClientRect().height;

  function update(): void {
    frame = 0;
    const next = naturalTop() < 0;
    if (!next && !stuck) {
      full = row.getBoundingClientRect().height;
    }
    if (next !== stuck) {
      stuck = next;
      row.classList.toggle('is-stuck', stuck);
      revealActive();
    }
    const box = row.getBoundingClientRect();
    /* Отступ бывает и отрицательным: на широком экране прилипшая
       лента получает поля сверху и снизу и становится выше. */
    const gap = stuck ? full - box.height : 0;
    row.style.marginBottom = Math.abs(gap) > 0.5 ? `${gap}px` : '';
    /* У прилипшей ленты низ — с учётом выреза экрана сверху. */
    const bottom = stuck ? Math.max(box.bottom, box.height) : box.height;
    page.style.setProperty('--topic-sticky-top', `${Math.round(bottom)}px`);
  }

  function schedule(): void {
    if (frame === 0) {
      frame = window.requestAnimationFrame(update);
    }
  }

  update();
  window.addEventListener('scroll', schedule, { passive: true });
  window.addEventListener('resize', schedule);
  phone.addEventListener('change', schedule);
  return () => {
    window.removeEventListener('scroll', schedule);
    window.removeEventListener('resize', schedule);
    phone.removeEventListener('change', schedule);
    if (frame !== 0) {
      window.cancelAnimationFrame(frame);
    }
    row.classList.remove('is-stuck');
    row.style.marginBottom = '';
    page.style.removeProperty('--topic-sticky-top');
  };
}

/**
 * Липкая лента вкладок раздела (.topic-tabs-row): общая для всех
 * разделов — №12, №2, №3, №4, №5, №8. Сама липкость — в CSS
 * (styles/components.css); хук делает то, чего CSS не умеет.
 *
 * 1. Отмечает ленту классом is-stuck, когда она прилипла к верху
 *    экрана. По нему на телефоне лента становится компактной
 *    (подписи в одну строку, поля меньше), а снизу появляется тень.
 * 2. Прилипшая лента другой высоты, чем обычная (на телефоне ниже,
 *    на широком экране чуть выше — с полями), и всё под ней сдвинулось
 *    бы. Разница уходит в нижний отступ ленты: страница под ней не
 *    дёргается.
 * 3. Высоту закреплённой ленты пишет в --topic-sticky-top на
 *    содержимом страницы: от неё отсчитываются полоса «Содержание»,
 *    колонка содержания и отступ заголовка при переходе по якорю —
 *    заголовок не прячется под лентой.
 * 4. Подводит активную вкладку в видимую часть ленты, когда лента
 *    меняет ширину подписей.
 *
 * stripRef — сама лента (.topic-tabs); строка — её родитель.
 */
export function useStickyTabs(stripRef: RefObject<HTMLElement | null>): void {
  useEffect(() => {
    const strip = stripRef.current;
    const row = strip?.parentElement ?? null;
    const page = row?.parentElement ?? null;
    if (strip === null || row === null || page === null) {
      return undefined;
    }
    return attach(strip, row, page);
  }, [stripRef]);
}
