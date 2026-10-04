'use client';

import { useCallback, useEffect, useRef } from 'react';

/** Плавность прокрутки: при «уменьшить движение» переход мгновенный. */
function motion(): ScrollBehavior {
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth';
}

/**
 * Переход к разделу теории по содержанию.
 *
 * Плавная прокрутка целится в место, где заголовок был в момент
 * нажатия. Пока страница едет, выше успевают догрузиться картинки и
 * чертежи — и заголовок уезжает вниз. Поэтому, когда прокрутка
 * кончилась, место проверяется ещё раз и при сдвиге выравнивается
 * без анимации. Отступ сверху (липкие полосы) задаёт scroll-margin-top
 * самого раздела.
 */
export function scrollToSection(node: HTMLElement): void {
  node.scrollIntoView({ behavior: motion(), block: 'start' });

  let done = false;
  function settle() {
    if (done) {
      return;
    }
    done = true;
    window.removeEventListener('scrollend', settle);
    const margin = parseFloat(getComputedStyle(node).scrollMarginTop) || 0;
    const top = node.getBoundingClientRect().top;
    const atBottom =
      window.scrollY + window.innerHeight >= document.documentElement.scrollHeight - 2;
    if (Math.abs(top - margin) > 4 && !(atBottom && top > margin)) {
      node.scrollIntoView({ behavior: 'auto', block: 'start' });
    }
  }
  window.addEventListener('scrollend', settle);
  /* Где события scrollend нет, проверка идёт по таймеру. */
  window.setTimeout(settle, 1200);
}

/**
 * Подсветка в содержании теории следует за экраном: активным
 * становится раздел, заголовок которого дошёл до верхней полосы
 * экрана под липкой полосой «Содержание».
 *
 * Один хук на все теории (№12, №4–5, №3): наблюдатель видимости
 * дешевле обработчика прокрутки — пересечения браузер считает сам.
 *
 * ids      — разделы по порядку;
 * domId    — якорь раздела на странице;
 * enabled  — теория на экране (вкладка открыта);
 * onActive — раздел стал активным.
 *
 * Возвращает pin(): раздел, выбранный в содержании, остаётся
 * подсвеченным, пока ученик сам не тронет страницу. Иначе у коротких
 * разделов в конце страницы подсветка перескакивала бы на соседний:
 * до полосы наблюдения такой раздел не доезжает — ниже прокручивать
 * некуда.
 */
export function useActiveSection(
  ids: readonly string[],
  domId: (id: string) => string,
  enabled: boolean,
  onActive: (id: string) => void,
): () => void {
  const pinned = useRef(false);

  const pin = useCallback(() => {
    pinned.current = true;
  }, []);

  /* Своя прокрутка ученика снимает закрепление. Колесо, касание и
     клавиши — это он; прокрутка от scrollIntoView их не вызывает. */
  useEffect(() => {
    if (!enabled) {
      return undefined;
    }
    function release() {
      pinned.current = false;
    }
    const events = ['wheel', 'touchstart', 'keydown'] as const;
    events.forEach((name) => window.addEventListener(name, release, { passive: true }));
    return () => events.forEach((name) => window.removeEventListener(name, release));
  }, [enabled]);

  /* Список приходит новым массивом при каждой отрисовке — зависимость
     берётся строкой, чтобы наблюдатель не пересоздавался зря. */
  const key = ids.join('|');

  useEffect(() => {
    if (!enabled || typeof IntersectionObserver === 'undefined') {
      return undefined;
    }
    const order = key === '' ? [] : key.split('|');
    const nodes = order
      .map((id) => document.getElementById(domId(id)))
      .filter((node): node is HTMLElement => node !== null);
    if (nodes.length === 0) {
      return undefined;
    }

    const visible = new Set<string>();
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            visible.add(entry.target.id);
          } else {
            visible.delete(entry.target.id);
          }
        });
        if (pinned.current) {
          return;
        }
        /* Активным считается верхний из видимых: так подсветка не
           прыгает, когда в полосе видно два раздела сразу. */
        const top = order.find((id) => visible.has(domId(id)));
        if (top !== undefined) {
          onActive(top);
        }
      },
      /* Полоса наблюдения — от низа липких полос (лента вкладок и
         «Содержание», вместе до ~90px) до верхних 40% экрана. */
      { rootMargin: '-96px 0px -60% 0px' },
    );

    nodes.forEach((node) => observer.observe(node));
    return () => observer.disconnect();
    // domId и onActive — чистые функции и сеттер состояния: от них
    // наблюдатель не зависит.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [enabled, key]);

  return pin;
}
