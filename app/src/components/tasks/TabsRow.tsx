'use client';

import { clsx } from 'clsx';
import { usePathname } from 'next/navigation';
import { useEffect, useRef } from 'react';
import type { MouseEvent, ReactNode } from 'react';
import {
  activeIndex,
  rememberPanelTab,
  revealActive,
  scrollToContent,
  settlePanelTab,
  useStickyTabs,
} from './useStickyTabs';

/** Копия меню: плитки в потоке страницы или липкая панель над ней. */
export type TabsCopy = 'tiles' | 'panel';

export interface TabsRowProps {
  /** Модификатор строки, общий для обеих копий: topic-tabs-row--stroka. */
  className?: string;
  /**
   * Содержимое строки (плашка разделов, лента вкладок, кнопка
   * материалов) — вызывается для каждой копии. live — эта копия сейчас
   * видна и нажимается: меню материалов и ссылки на узлы живут в ней.
   */
  children: (copy: TabsCopy, live: boolean) => ReactNode;
}

/**
 * Строка вкладок раздела — общая для всех разделов: её рисуют
 * TutorMenu, RazdelTabs и SectionTabs.
 *
 * Две копии одного меню. Плитки стоят в потоке страницы и никогда не
 * меняют ни вида, ни высоты. Панель — компактная строка, закреплённая
 * у верха экрана; она появляется, когда плитки уходят под неё (хук
 * useStickyTabs). Скрытая копия — inert и aria-hidden.
 *
 * Панель стоит в разметке после плиток: document.querySelector и
 * обход фокусом сначала находят плитки.
 */
export function TabsRow({ className, children }: TabsRowProps) {
  const tiles = useRef<HTMLDivElement>(null);
  const panel = useRef<HTMLDivElement>(null);
  const shown = useStickyTabs(tiles, panel);
  const pathname = usePathname();

  /* Активная вкладка сменилась — подводим её в видимую часть обеих
     лент; новая вкладка, открытая из панели, — к началу её содержимого. */
  const last = useRef(-2);
  useEffect(() => {
    const index = activeIndex(panel.current!);
    settlePanelTab(pathname, index, tiles.current!, panel.current!);
    if (index !== last.current) {
      last.current = index;
      revealActive(tiles.current!);
      revealActive(panel.current!);
    }
  });

  /* Края прокручиваемой ленты: где за краем ещё есть вкладки, CSS
     гасит его градиентом (components.css, data-ten-l / data-ten-r). */
  useEffect(() => {
    const lenty = [tiles.current!, panel.current!]
      .map((row) => row.querySelector<HTMLElement>('.topic-tabs'))
      .filter((el): el is HTMLElement => el !== null);
    const otmetit = (el: HTMLElement) => {
      const hvost = el.scrollWidth - el.clientWidth - el.scrollLeft;
      el.toggleAttribute('data-ten-l', el.scrollLeft > 1);
      el.toggleAttribute('data-ten-r', hvost > 1);
    };
    const handlers = lenty.map((el) => {
      const h = () => otmetit(el);
      el.addEventListener('scroll', h, { passive: true });
      h();
      return h;
    });
    const ro = new ResizeObserver(() => lenty.forEach(otmetit));
    lenty.forEach((el) => ro.observe(el));
    return () => {
      ro.disconnect();
      lenty.forEach((el, i) => el.removeEventListener('scroll', handlers[i]!));
    };
  }, [pathname]);

  /* Нажатие на вкладку в панели: содержимое новой вкладки начнётся
     под панелью. Подводим сразу и ещё раз, когда вкладка отрисуется. */
  function onPanelClick(event: MouseEvent<HTMLDivElement>) {
    const tab = (event.target as Element).closest('[role="tab"]');
    if (
      !tab ||
      tab.getAttribute('aria-selected') === 'true' ||
      event.button ||
      event.metaKey ||
      event.ctrlKey ||
      event.shiftKey ||
      event.altKey
    ) {
      return;
    }
    rememberPanelTab(pathname, activeIndex(panel.current!));
    scrollToContent(tiles.current!, panel.current!);
  }

  return (
    <>
      <div
        ref={tiles}
        className={clsx('topic-tabs-row', className)}
        inert={shown}
        aria-hidden={shown || undefined}
      >
        {children('tiles', !shown)}
      </div>
      <div
        ref={panel}
        className={clsx('topic-tabs-row topic-tabs-row--panel is-stuck', className, {
          'is-shown': shown,
        })}
        inert={!shown}
        aria-hidden={!shown || undefined}
        onClickCapture={onPanelClick}
      >
        {children('panel', shown)}
      </div>
    </>
  );
}
