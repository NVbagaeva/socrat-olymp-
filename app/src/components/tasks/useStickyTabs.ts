'use client';

import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import type { RefObject } from 'react';

/* Растушёвка по краям ленты: активную вкладку подводим с этим
   отступом, иначе она читалась бы наполовину выцветшей. То же число
   у кнопки материалов (TutorMenu). */
const STRIP_FADE = 32;
/* Зазор между панелью и началом содержимого после перехода по
   вкладке из панели: --space-4. */
const CONTENT_GAP = 16;
/* Сколько после нажатия на вкладку в панели ждать новую вкладку,
   чтобы подвести к её началу. Переход по сети обычно быстрее; не
   дождались — значит, перехода не было, и прокрутки тоже не будет. */
const PENDING_MS = 3000;

const FOCUSABLE = 'a[href],button,[tabindex]';

function focusables(row: HTMLElement): HTMLElement[] {
  return Array.from(row.querySelectorAll<HTMLElement>(FOCUSABLE));
}

/** Номер активной вкладки в строке: по нему узнаём, что вкладка сменилась. */
export function activeIndex(row: HTMLElement): number {
  return Array.from(row.querySelectorAll('[role="tab"]')).findIndex(
    (tab) => tab.getAttribute('aria-selected') === 'true',
  );
}

/**
 * Подвести активную вкладку в видимую часть ленты. Сдвигается только
 * сама лента, а не страница. Строку с раскрытым меню материалов не
 * трогаем: меню само держит свою кнопку в виду.
 */
export function revealActive(row: HTMLElement): void {
  const strip = row.querySelector<HTMLElement>('.topic-tabs');
  const active = strip?.querySelector('[aria-selected="true"]');
  if (!strip || !active || row.querySelector('.tmenu')) {
    return;
  }
  const box = strip.getBoundingClientRect();
  const rect = active.getBoundingClientRect();
  if (rect.left < box.left + STRIP_FADE) {
    strip.scrollLeft += rect.left - box.left - STRIP_FADE;
  } else if (rect.right > box.right - STRIP_FADE) {
    strip.scrollLeft += rect.right - box.right + STRIP_FADE;
  }
}

/**
 * Прокрутить к началу содержимого вкладки — первому видимому блоку под
 * плитками — так, чтобы оно встало под панелью, а не под ней
 * спряталось. Плитки при этом остаются за панелью — панель не пропадает.
 */
export function scrollToContent(tiles: HTMLElement, panel: HTMLElement): void {
  /* Нижний край панели — по её месту, а не по прямоугольнику: скрытая
     панель приподнята для анимации появления. */
  const line = (parseFloat(getComputedStyle(panel).top) || 0) + panel.offsetHeight;
  const tilesBottom = tiles.getBoundingClientRect().bottom;
  let content = tiles.nextElementSibling;
  while (content && (content === panel || !content.getClientRects().length)) {
    content = content.nextElementSibling;
  }
  const contentTop = content ? content.getBoundingClientRect().top : tilesBottom;
  const gap = Math.min(CONTENT_GAP, Math.max(0, contentTop - tilesBottom));
  window.scrollTo(0, Math.max(0, Math.round(window.scrollY + contentTop - line - gap)));
}

/* Нажатие на вкладку в панели ждёт отрисовки новой вкладки. Модульная
   переменная, а не ref: в части разделов ленту рисует страница, и
   после перехода это уже другой экземпляр компонента. */
let pending: { path: string; active: number; at: number } | null = null;

export function rememberPanelTab(path: string, active: number): void {
  pending = { path, active, at: Date.now() };
}

/**
 * Новая вкладка отрисована (сменился адрес или активная вкладка) —
 * подводим к началу её содержимого. Сменилась только вкладка на
 * месте — подводим один раз, но ждём ещё и смену адреса: вкладка с
 * адресом (тренажёр №12) сначала подсвечивается, а потом уводит на свою
 * страницу. После смены адреса ожидание снимается: Next.js свою
 * прокрутку уже сделал, наша — последняя.
 */
export function settlePanelTab(
  path: string,
  active: number,
  tiles: HTMLElement,
  panel: HTMLElement,
): void {
  if (pending && Date.now() - pending.at > PENDING_MS) {
    pending = null;
  }
  if (pending && (path !== pending.path || active !== pending.active)) {
    pending = path === pending.path ? { ...pending, active } : null;
    scrollToContent(tiles, panel);
  }
}

/**
 * Липкая панель вкладок раздела: общая для всех разделов (TabsRow).
 *
 * Плитки всегда стоят в потоке страницы и уезжают вверх вместе с ней —
 * ничего не убирается и не меняет высоту, поэтому страница под ними не
 * сдвигается. Поверх страницы у верхнего края (с учётом выреза экрана)
 * висит компактная панель с теми же вкладками. Она появляется, когда
 * нижний край плиток уходит под её нижний край, и прячется, когда
 * плитки возвращаются. Следит IntersectionObserver, а не обработчик
 * прокрутки: ни пересчёта на каждый кадр, ни порога по scrollY.
 *
 * Хук:
 * 1. Возвращает shown — показана ли панель. Скрытая копия меню
 *    (панель или плитки) получает inert и aria-hidden: фокусируемая и
 *    видимая скринридеру копия всегда одна.
 * 2. Переносит фокус на ту же кнопку в другой копии, если он был в
 *    той, что становится скрытой.
 * 3. Ставит панель по горизонтали ровно над плитками
 *    (--tabs-panel-left, --tabs-panel-width) и подводит активную
 *    вкладку в видимую часть обеих лент при изменении размеров.
 * 4. Пишет нижний край панели в --topic-sticky-top на содержимом
 *    страницы: от него отсчитываются полоса «Содержание», колонка
 *    содержания и отступ заголовка при переходе по якорю. Высота панели
 *    не меняется, поэтому и число постоянное.
 */
export function useStickyTabs(
  tilesRef: RefObject<HTMLElement | null>,
  panelRef: RefObject<HTMLElement | null>,
): boolean {
  const [shown, setShown] = useState(false);
  /* Какая по счёту кнопка была в фокусе в копии, которая прячется. */
  const focus = useRef(-1);

  useEffect(() => {
    const tiles = tilesRef.current;
    const panel = panelRef.current;
    const page = tiles?.parentElement;
    if (!tiles || !panel || !page) {
      return undefined;
    }
    let current = false;
    let line = -1;
    let observer: IntersectionObserver | undefined;

    /* Место и высота панели. Нижний край панели — линия, под которую
       уходят плитки: за ней следит IntersectionObserver с отступом
       сверху ровно в эту линию. */
    function relayout(): void {
      const box = tiles!.getBoundingClientRect();
      panel!.style.setProperty('--tabs-panel-left', `${box.left}px`);
      panel!.style.setProperty('--tabs-panel-width', `${box.width}px`);
      revealActive(tiles!);
      revealActive(panel!);
      const bottom = Math.round(
        (parseFloat(getComputedStyle(panel!).top) || 0) + panel!.offsetHeight,
      );
      page!.style.setProperty('--topic-sticky-top', `${bottom}px`);
      if (bottom === line) {
        return;
      }
      line = bottom;
      observer?.disconnect();
      observer = new IntersectionObserver(
        (entries) => {
          const box = entries[entries.length - 1]!;
          const next = !box.isIntersecting && box.boundingClientRect.bottom <= bottom + 0.5;
          if (next === current) {
            return;
          }
          current = next;
          const from = next ? tiles! : panel!;
          const active = document.activeElement as HTMLElement | null;
          focus.current = active && from.contains(active) ? focusables(from).indexOf(active) : -1;
          setShown(next);
        },
        { rootMargin: `-${bottom}px 0px 0px 0px` },
      );
      observer.observe(tiles!);
    }

    relayout();
    const sizes = new ResizeObserver(relayout);
    sizes.observe(tiles);
    sizes.observe(panel);
    window.addEventListener('resize', relayout);
    return () => {
      observer?.disconnect();
      sizes.disconnect();
      window.removeEventListener('resize', relayout);
      page.style.removeProperty('--topic-sticky-top');
    };
  }, [tilesRef, panelRef]);

  /* Фокус переезжает до отрисовки кадра: inert у прежней копии уже
     стоит, и без переноса фокус ушёл бы в body. */
  useLayoutEffect(() => {
    const index = focus.current;
    focus.current = -1;
    const to = shown ? panelRef.current : tilesRef.current;
    if (index < 0 || to === null) {
      return;
    }
    focusables(to)[index]?.focus({ preventScroll: true });
  }, [shown, tilesRef, panelRef]);

  return shown;
}
