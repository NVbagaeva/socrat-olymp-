'use client';

import { useSyncExternalStore } from 'react';

/*
 * iPhone и iPad (Safari и любые браузеры на iOS — у всех движок WebKit).
 *
 * Печать HTML-листа там ломается: Safari на iOS не слушает @page и
 * печатает на свою бумагу — нередко US Letter, 279 мм в высоту. Лист
 * справочника — 295 мм, и каждый переезжает на вторую, почти пустую
 * страницу (подвал и обрывок). Поэтому на iOS «Печать» открывает
 * готовый PDF: его просмотрщик сам вписывает A4 в любую бумагу.
 * iPad с iPadOS 13 представляется Mac — его узнаём по сенсорному экрану.
 */
export function naIos(): boolean {
  const ua = navigator.userAgent;
  return (
    /iPad|iPhone|iPod/.test(ua) ||
    (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1)
  );
}

const nichego = () => () => {};

/** На iPhone/iPad ли страница. На сервере и при первой отрисовке — нет. */
export function useIos(): boolean {
  return useSyncExternalStore(nichego, naIos, () => false);
}
